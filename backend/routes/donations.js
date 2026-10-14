const crypto = require("crypto");
const express = require("express");
const pool = require("../db");
const { getMpesaConfig, requestStkPush } = require("../services/mpesa");

const router = express.Router();
const attemptsByIp = new Map();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_DONATION_KES = 250000;

function normalizeKenyanPhone(value) {
  if (typeof value !== "string") return null;
  const compact = value.replace(/[\s()-]/g, "");
  if (/^0[17][0-9]{8}$/.test(compact)) return `254${compact.slice(1)}`;
  if (/^\+?254[17][0-9]{8}$/.test(compact)) return compact.replace(/^\+/, "");
  return null;
}

function rateLimitDonation(req, res, next) {
  const now = Date.now();
  const recentAttempts = (attemptsByIp.get(req.ip) || []).filter(
    (timestamp) => now - timestamp < RATE_WINDOW_MS
  );

  if (recentAttempts.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: "Too many payment attempts. Please wait a while and try again.",
    });
  }

  recentAttempts.push(now);
  attemptsByIp.set(req.ip, recentAttempts);
  next();
}

router.get("/config", (req, res) => {
  res.json({ available: getMpesaConfig().configured });
});

router.post("/", rateLimitDonation, async (req, res, next) => {
  const config = getMpesaConfig();
  if (!config.configured) {
    return res.status(503).json({
      error: "Online M-Pesa donations are not connected yet. Please contact the club.",
    });
  }

  const amount = Number(req.body?.amount);
  const phoneNumber = normalizeKenyanPhone(req.body?.phoneNumber);

  if (!Number.isSafeInteger(amount) || amount < 1 || amount > MAX_DONATION_KES) {
    return res.status(400).json({
      error: `Enter an amount from KSh 1 to KSh ${MAX_DONATION_KES.toLocaleString("en-US")}.`,
    });
  }
  if (!phoneNumber) {
    return res.status(400).json({
      error: "Enter a valid Kenyan mobile number, for example 0712345678.",
    });
  }

  const reference = crypto.randomUUID();
  let donation;
  try {
    const result = await pool.query(
      `INSERT INTO donations (public_reference, amount, phone_number)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [reference, amount, phoneNumber]
    );
    donation = result.rows[0];
  } catch (error) {
    return next(error);
  }

  try {
    const providerResponse = await requestStkPush({ amount, phoneNumber });
    if (providerResponse.ResponseCode !== "0" || !providerResponse.CheckoutRequestID) {
      await pool.query(
        `UPDATE donations
         SET status = 'Failed', provider_result_description = $2, updated_at = NOW()
         WHERE id = $1`,
        [donation.id, providerResponse.ResponseDescription || "Daraja did not accept the payment request"]
      );
      return res.status(502).json({
        error: "M-Pesa could not start the payment request. Please try again later.",
      });
    }

    await pool.query(
      `UPDATE donations
       SET status = 'Pending', merchant_request_id = $2,
           checkout_request_id = $3, updated_at = NOW()
       WHERE id = $1`,
      [donation.id, providerResponse.MerchantRequestID || null, providerResponse.CheckoutRequestID]
    );

    return res.status(202).json({
      reference,
      status: "Pending",
      message: "Payment request sent. Check your phone and approve it in M-Pesa.",
    });
  } catch (error) {
    console.error("Could not start M-Pesa donation:", error.message);
    await pool.query(
      `UPDATE donations
       SET status = 'Failed', provider_result_description = 'Payment request could not be started',
           updated_at = NOW()
       WHERE id = $1`,
      [donation.id]
    ).catch(() => {});
    return res.status(502).json({
      error: "We could not start the M-Pesa request. Check your number and try again.",
    });
  }
});

router.get("/:reference", async (req, res, next) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.reference)) {
    return res.status(400).json({ error: "Invalid donation reference" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT public_reference, amount, currency, status, mpesa_receipt_number
       FROM donations WHERE public_reference = $1`,
      [req.params.reference]
    );
    if (!rows[0]) return res.status(404).json({ error: "Donation not found" });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.post("/callback", async (req, res, next) => {
  const callback = req.body?.Body?.stkCallback;
  if (!callback?.CheckoutRequestID || !Number.isInteger(Number(callback.ResultCode))) {
    return res.status(400).json({ error: "Invalid payment callback" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, amount, phone_number, status
       FROM donations WHERE checkout_request_id = $1`,
      [callback.CheckoutRequestID]
    );
    const donation = rows[0];
    if (!donation || ["Completed", "Failed"].includes(donation.status)) {
      return res.json({ ResultCode: 0, ResultDesc: "Callback received" });
    }

    const resultCode = Number(callback.ResultCode);
    const items = Array.isArray(callback.CallbackMetadata?.Item)
      ? callback.CallbackMetadata.Item
      : [];
    const metadata = Object.fromEntries(items.map((item) => [item.Name, item.Value]));
    let status = "Pending";

    if (resultCode !== 0) {
      status = "Failed";
    } else {
      const callbackPhone = normalizeKenyanPhone(String(metadata.PhoneNumber || ""));
      const amountMatches = Number(metadata.Amount) === Number(donation.amount);
      const phoneMatches = callbackPhone === donation.phone_number;
      if (metadata.MpesaReceiptNumber && amountMatches && phoneMatches) {
        status = "Completed";
      } else {
        console.warn("M-Pesa callback details did not match donation", callback.CheckoutRequestID);
      }
    }

    await pool.query(
      `UPDATE donations
       SET status = $2, provider_result_code = $3,
           provider_result_description = $4, mpesa_receipt_number = $5,
           completed_at = CASE WHEN $2 = 'Completed' THEN NOW() ELSE completed_at END,
           updated_at = NOW()
       WHERE id = $1 AND status IN ('Initiated', 'Pending')`,
      [donation.id, status, resultCode, callback.ResultDesc || null, metadata.MpesaReceiptNumber || null]
    );
    return res.json({ ResultCode: 0, ResultDesc: "Callback received" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
