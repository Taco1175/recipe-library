// backend/api/_notify.js
// SMS notifications via carrier email-to-SMS gateways.
// Uses Gmail SMTP (nodemailer) — trusted by carriers unlike transactional
// email services (Resend, SendGrid, etc).
//
// SETUP: Add to .env
//   GMAIL_USER=you@gmail.com
//   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   (16-char App Password, spaces OK)
//   OWNER_PHONE=5551234567                    (digits only)
//   OWNER_CARRIER=spectrum                    (see CARRIERS below)

const nodemailer = require("nodemailer");

const CARRIERS = {
  att:        "@txt.att.net",
  verizon:    "@vtext.com",
  tmobile:    "@tmomail.net",
  sprint:     "@messaging.sprintpcs.com",
  uscellular: "@email.uscc.net",
  boost:      "@sms.myboostmobile.com",
  cricket:    "@mms.cricketwireless.net",
  metro:      "@mymetropcs.com",
  spectrum:   "@vtext.com",   // Spectrum Mobile is a Verizon MVNO
};

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, "");

let _transporter = null;
function getTransporter() {
  if (!_transporter && GMAIL_USER && GMAIL_PASS) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });
  }
  return _transporter;
}

async function sendSMS({ phone, carrier, message }) {
  const gateway = CARRIERS[carrier?.toLowerCase()];
  if (!gateway) {
    console.warn(`[Notify] Unknown carrier: ${carrier}. Valid: ${Object.keys(CARRIERS).join(", ")}`);
    return { ok: false, error: "Unknown carrier" };
  }
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length < 10) return { ok: false, error: "Invalid phone number" };

  const t = getTransporter();
  if (!t) {
    console.error("[Notify] GMAIL_USER/GMAIL_APP_PASSWORD not set in .env");
    return { ok: false, error: "Gmail credentials not configured" };
  }

  const to = digits + gateway;
  try {
    await t.sendMail({ from: GMAIL_USER, to, subject: "", text: message });
    console.log(`[Notify] SMS sent to ${to}`);
    return { ok: true };
  } catch (e) {
    console.error("[Notify] Send failed:", e.message);
    return { ok: false, error: e.message };
  }
}

// Alert the app owner using env vars — used for security events (unauthorized logins)
async function notifyOwner(message) {
  const phone   = process.env.OWNER_PHONE;
  const carrier = (process.env.OWNER_CARRIER || "").toLowerCase();
  if (!phone || !carrier) {
    console.warn("[Notify] OWNER_PHONE/OWNER_CARRIER not set — skipping SMS");
    return { ok: false };
  }
  return sendSMS({ phone, carrier, message });
}

module.exports = { sendSMS, notifyOwner, CARRIERS };
