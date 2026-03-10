// backend/api/request-access.js
// Sends an SMS to the owner via TextBelt when someone requests access.
// Uses built-in https — no extra packages required.
//
// Free tier: TEXTBELT_KEY=textbelt in .env (1 SMS/day — fine for access requests)
// Paid tier: buy credits at textbelt.com and set TEXTBELT_KEY=<your-key>

const https = require("https");
const querystring = require("querystring");

const OWNER_PHONE  = process.env.OWNER_PHONE   || "3143309786";
const TEXTBELT_KEY = process.env.TEXTBELT_KEY  || "textbelt";

const recentRequests = new Map();
const RATE_LIMIT_MS  = 10 * 60 * 1000;

function sendSms(phone, message) {
  return new Promise((resolve, reject) => {
    const body = querystring.stringify({ phone, message, key: TEXTBELT_KEY });
    const req = https.request(
      {
        hostname: "textbelt.com",
        path:     "/text",
        method:   "POST",
        headers:  { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body) },
      },
      res => {
        let data = "";
        res.on("data", c => (data += c));
        res.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve({ success: false }); } });
      }
    );
    req.setTimeout(8000, () => { req.destroy(); reject(new Error("timeout")); });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
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
    ? `Mealplannr access request:\n${email}\nMessage: ${message}`
    : `Mealplannr access request:\n${email}`;

  try {
    const result = await sendSms(OWNER_PHONE, smsText);
    if (result.success) {
      console.log(`[request-access] SMS sent for ${email} | quota remaining: ${result.quotaRemaining}`);
    } else {
      console.error("[request-access] TextBelt error:", result.error);
    }
  } catch (e) {
    console.error("[request-access] SMS failed:", e.message);
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true }));
};
