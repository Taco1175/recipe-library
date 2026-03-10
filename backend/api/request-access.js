// backend/api/request-access.js
// Sends an SMS to the owner via Gmail SMTP → carrier email-to-SMS gateway.
// Gmail is trusted by carriers (Verizon/Spectrum @vtext.com etc) unlike
// transactional email services.
//
// Add to backend/.env:
//   GMAIL_USER=you@gmail.com
//   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   (16-char App Password, spaces OK)
//   OWNER_PHONE=3143309786
//   OWNER_CARRIER=spectrum   (att|verizon|tmobile|sprint|uscellular|boost|cricket|metro|spectrum)

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
  spectrum:   "@vtext.com",
};

const OWNER_PHONE   = (process.env.OWNER_PHONE   || "3143309786").replace(/\D/g, "");
const OWNER_CARRIER = (process.env.OWNER_CARRIER || "spectrum").toLowerCase();
const GMAIL_USER    = process.env.GMAIL_USER;
const GMAIL_PASS    = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, "");

const recentRequests = new Map();
const RATE_LIMIT_MS  = 10 * 60 * 1000;

let transporter = null;
function getTransporter() {
  if (!transporter && GMAIL_USER && GMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });
  }
  return transporter;
}

async function sendSms(message) {
  const gateway = CARRIERS[OWNER_CARRIER];
  if (!gateway) { console.error("[request-access] Unknown carrier:", OWNER_CARRIER); return false; }
  const t = getTransporter();
  if (!t) { console.error("[request-access] GMAIL_USER/GMAIL_APP_PASSWORD not set in .env"); return false; }

  const to = OWNER_PHONE + gateway;
  try {
    await t.sendMail({ from: GMAIL_USER, to, subject: "", text: message });
    console.log(`[request-access] SMS sent to ${to}`);
    return true;
  } catch (e) {
    console.error("[request-access] Send failed:", e.message);
    return false;
  }
}

module.exports = async function requestAccessHandler(req, res) {
  if (req.method !== "POST") { res.writeHead(405); res.end(); return; }

  let body = "";
  req.on("data", c => { body += c; if (body.length > 4096) { res.writeHead(413); res.end(); } });
  await new Promise(resolve => req.on("end", resolve));

  let email, message;
  try {
    const parsed = JSON.parse(body);
    email   = (parsed.email   || "").trim().toLowerCase();
    message = (parsed.message || "").trim().slice(0, 300);
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "Invalid request" }));
    return;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "Valid email required" }));
    return;
  }

  const lastSent = recentRequests.get(email);
  if (lastSent && Date.now() - lastSent < RATE_LIMIT_MS) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  recentRequests.set(email, Date.now());

  const smsText = message
    ? `Mealplannr access request: ${email} — ${message}`
    : `Mealplannr access request: ${email}`;

  await sendSms(smsText);  // fire-and-forget — always return ok to user

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true }));
};
