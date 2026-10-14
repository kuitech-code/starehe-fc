const MPESA_TIMEOUT_MS = 15000;

function getMpesaConfig() {
  const environment = process.env.MPESA_ENVIRONMENT || "sandbox";
  const callbackUrl = process.env.MPESA_CALLBACK_URL || "";
  const configured =
    process.env.MPESA_ENABLED === "true" &&
    [
      process.env.MPESA_CONSUMER_KEY,
      process.env.MPESA_CONSUMER_SECRET,
      process.env.MPESA_SHORTCODE,
      process.env.MPESA_PASSKEY,
      process.env.MPESA_ACCOUNT_REFERENCE,
      callbackUrl,
    ].every((value) => typeof value === "string" && value.trim() !== "") &&
    ["sandbox", "production"].includes(environment) &&
    (environment !== "production" || callbackUrl.startsWith("https://"));

  return {
    configured,
    environment,
    callbackUrl,
    shortCode: process.env.MPESA_SHORTCODE,
    passkey: process.env.MPESA_PASSKEY,
    accountReference: process.env.MPESA_ACCOUNT_REFERENCE || "Starehe FC",
    transactionType: process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline",
  };
}

function getBaseUrl(environment) {
  return environment === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

function getTimestamp() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}${value.month}${value.day}${value.hour}${value.minute}${value.second}`;
}

async function readJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.errorMessage || body.error || "Daraja request failed");
  }
  return body;
}

async function getAccessToken(environment) {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");
  const response = await fetch(
    `${getBaseUrl(environment)}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
      signal: AbortSignal.timeout(MPESA_TIMEOUT_MS),
    }
  );
  const body = await readJson(response);
  if (!body.access_token) throw new Error("Daraja did not return an access token");
  return body.access_token;
}

async function requestStkPush({ amount, phoneNumber }) {
  const config = getMpesaConfig();
  if (!config.configured) throw new Error("M-Pesa checkout is not configured");

  const timestamp = getTimestamp();
  const password = Buffer.from(
    `${config.shortCode}${config.passkey}${timestamp}`
  ).toString("base64");
  const accessToken = await getAccessToken(config.environment);

  const response = await fetch(
    `${getBaseUrl(config.environment)}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(MPESA_TIMEOUT_MS),
      body: JSON.stringify({
        BusinessShortCode: config.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: config.transactionType,
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: config.shortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: config.callbackUrl,
        AccountReference: config.accountReference,
        TransactionDesc: "Starehe FC donation",
      }),
    }
  );
  return readJson(response);
}

module.exports = { getMpesaConfig, requestStkPush };
