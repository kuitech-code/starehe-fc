import { useEffect, useState } from "react";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

function SupportUs() {
  const [mpesaAvailable, setMpesaAvailable] = useState(false);
  const [configChecked, setConfigChecked] = useState(false);
  const [amount, setAmount] = useState(500);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_ORIGIN}/api/donations/config`)
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (!cancelled && response.ok) setMpesaAvailable(data.available === true);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setConfigChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!reference || !mpesaAvailable) return undefined;

    let attempts = 0;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      attempts += 1;
      try {
        const response = await fetch(`${API_ORIGIN}/api/donations/${reference}`);
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;

        if (response.ok && data.status === "Completed") {
          setMessage(
            data.mpesa_receipt_number
              ? `Thank you! Your support was received. M-Pesa receipt: ${data.mpesa_receipt_number}.`
              : "Thank you! Your support was received."
          );
          setMessageType("success");
          window.clearInterval(timer);
        } else if (response.ok && data.status === "Failed") {
          setMessage("The payment was not completed. You can check your number and try again.");
          setMessageType("error");
          window.clearInterval(timer);
        } else if (attempts >= 40) {
          setMessage("We are still waiting for M-Pesa confirmation. Check your phone or contact the club before trying again.");
          setMessageType("info");
          window.clearInterval(timer);
        }
      } catch {
        if (attempts >= 40) window.clearInterval(timer);
      }
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [reference, mpesaAvailable]);

  function goToContactDetails() {
    document.getElementById("club-contact-details")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  async function submitDonation(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setReference("");

    try {
      const response = await fetch(`${API_ORIGIN}/api/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), phoneNumber }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "We could not start your payment. Please try again.");

      setReference(data.reference);
      setMessage(data.message || "Payment request sent. Check your phone and approve it in M-Pesa.");
      setMessageType("info");
    } catch (error) {
      setMessage(error.message || "We could not start your payment. Please try again.");
      setMessageType("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="donation" className="support-us-section" aria-labelledby="support-us-heading">
      <div className="section-container support-us-container">
        <div className="support-us-card">
          <div className="support-us-copy">
            <p className="section-eyebrow">BACK THE TEAM</p>
            <h2 id="support-us-heading">Support Starehe FC</h2>
            <p>
              Your support helps Starehe FC and grassroots football in our
              community. Choose an amount and pay securely with M-Pesa when
              online giving is enabled.
            </p>
            <button
              type="button"
              className="support-us-contact-button"
              onClick={goToContactDetails}
            >
              Talk to the club
            </button>
          </div>

          <div className="donation-panel" aria-live="polite">
            <h3>Make a contribution</h3>
            {mpesaAvailable ? (
              <form className="donation-form" onSubmit={submitDonation}>
                <label htmlFor="donation-amount">Amount (KSh)</label>
                <input
                  id="donation-amount"
                  type="number"
                  min="1"
                  max="250000"
                  step="1"
                  required
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />

                <label htmlFor="donation-phone">M-Pesa phone number</label>
                <input
                  id="donation-phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="0712345678"
                  required
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                />

                <button className="donation-submit" type="submit" disabled={busy}>
                  {busy ? "Sending request..." : "Continue with M-Pesa"}
                </button>
                <p className="donation-privacy-note">
                  We use your phone number only to request and confirm this payment.
                </p>
              </form>
            ) : (
              <div className="donation-unavailable">
                <p>
                  {configChecked
                    ? "Will be available soon."
                    : "Checking payment availability..."}
                </p>
                <button type="button" className="donation-submit" onClick={goToContactDetails}>
                  Contact the club for now
                </button>
              </div>
            )}
            {message && (
              <p className={`donation-message donation-message-${messageType}`} role="status">
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SupportUs;
