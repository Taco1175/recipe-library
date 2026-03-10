// backend/api/request-access.js
// Receives an access request from the login page and texts the owner via
// the carrier email-to-SMS gateway (same system as notify-meal).
//
// Requires in backend/.env:
//   OWNER_PHONE=3143309786
//   OWNER_CARRIER=verizon   (att | verizon | tmobile | sprint | uscellular | boost | cricket | metro | spectrum)

const { notifyOwner } = require("./_notify");

// Simple in-memory rate limit: 1 request per email per 10 minutes
const recentRequests = new Map();
const RATE_LIMIT_MS  = 10 * 60 * 1000;

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

  // Rate limit per email — silently succeed to avoid enumeration
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

  const result = await notifyOwner(smsText);
  if (!result.ok) {
    console.error("[request-access] SMS failed:", result.error);
    // Still return ok:true to the user — request is logged server-side
  } else {
    console.log(`[request-access] SMS sent for ${email}`);
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true }));
};
