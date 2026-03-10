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
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("SMTP timeout")), 10_000)
  );
  try {
    await Promise.race([t.sendMail({ from: GMAIL_USER, to, subject: "", text: message }), timeout]);
    console.log(`[request-access] SMS sent to ${to}`);
    return true;
  } catch (e) {
    console.error("[request-access] Send failed:", e.message);
    return false;
  }
}

module.exports = async function requestAccessHandler(req, res) {
  if (req.method !== "POST") { res.writeHead(405); res.end(); return; }

  // server.js already parses JSON body into req.body before calling handlers
  const parsed = req.body || {};
  const email   = (parsed.email   || "").trim().toLowerCase();
  const message = (parsed.message || "").trim().slice(0, 300);

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

  const base = `Mealplannr: ${email}`;
  const smsText = message
    ? `${base} — ${message}`.slice(0, 160)
    : base;

  sendSms(smsText).catch(e => console.error("[request-access] SMS error:", e.message));

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true }));
};
