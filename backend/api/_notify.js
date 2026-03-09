// backend/api/_notify.js
// SMS notifications via carrier email-to-SMS gateways.
// Uses the existing Resend email helper — no extra packages required.
//
// SETUP: Add to .env
//   OWNER_PHONE=5551234567        (digits only)
//   OWNER_CARRIER=verizon         (see CARRIERS below)
//   ALLOWED_EMAILS=you@gmail.com,spouse@gmail.com  (comma-separated)

const { sendEmail } = require("./_email-helper");

const CARRIERS = {
  att:        "@txt.att.net",
  verizon:    "@vtext.com",
  tmobile:    "@tmomail.net",
  sprint:     "@messaging.sprintpcs.com",
  uscellular: "@email.uscc.net",
  boost:      "@sms.myboostmobile.com",
  cricket:    "@mms.cricketwireless.net",
  metro:      "@mymetropcs.com",
};

async function sendSMS({ phone, carrier, message }) {
  const gateway = CARRIERS[carrier?.toLowerCase()];
  if (!gateway) {
    console.warn(`[Notify] Unknown carrier: ${carrier}. Valid: ${Object.keys(CARRIERS).join(", ")}`);
    return { ok: false, error: "Unknown carrier" };
  }
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length < 10) return { ok: false, error: "Invalid phone number" };

  const to = digits + gateway;
  // Carriers display the email body, not the subject — keep it short
  return sendEmail({ to, subject: "Mealplannr", html: message.replace(/\n/g, "<br>") });
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
