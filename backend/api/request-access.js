// backend/api/request-access.js
// Receives an access request from the login page and sends an SMS to the owner.
// Uses TextBelt (textbelt.com) — zero extra dependencies, built-in https only.
//
// Free tier: set TEXTBELT_KEY=textbelt in .env (1 SMS/day)
// Paid tier: buy credits at textbelt.com and set TEXTBELT_KEY=<your-key>

const https = require("https");
const querystring = require("querystring");

const OWNER_PHONE  = process.env.ACCESS_REQUEST_PHONE || "3143309786";
const TEXTBELT_KEY = process.env.TEXTBELT_KEY         || "textbelt";

// Simple in-memory rate limit: 1 request per email per 10 minutes
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
        headers:  {
          "Content-Type":   "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      res => {
        let data = "";
        res.on("data", c => (data += c));
        res.on("end", () => {
          try { resolve(JSON.parse(data)); }
          catch { resolve({ success: false, error: "Bad response from TextBelt" }); }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

module.exports = async function requestAccessHandler(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405); res.end("Method Not Allowed"); return;
  }

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

  // Rate limit per email
  const lastSent = recentRequests.get(email);
  if (lastSent && Date.now() - lastSent < RATE_LIMIT_MS) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true })); // silently succeed to avoid enumeration
    return;
  }
  recentRequests.set(email, Date.now());

  const smsText = message
    ? `Mealplannr access request:\n${email}\nMessage: ${message}`
    : `Mealplannr access request:\n${email}`;

  try {
    const result = await sendSms(OWNER_PHONE, smsText);
    if (!result.success) {
      console.error("[request-access] TextBelt error:", result.error, "| quotaRemaining:", result.quotaRemaining);
      // Still return ok:true to the user — don't expose SMS errors
    } else {
      console.log(`[request-access] SMS sent for ${email} | quota remaining: ${result.quotaRemaining}`);
    }
  } catch (e) {
    console.error("[request-access] SMS send failed:", e.message);
    // Still return ok:true — the request is logged server-side
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true }));
};
