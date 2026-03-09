// backend/api/auth-intercept.js
// Intercepts Google OAuth completions at /api/collections/users/auth-with-oauth2.
// If ALLOWED_EMAILS is set and the signing-in email isn't on the list:
//   - Blocks the login (returns 403)
//   - Texts the owner via SMS

const http  = require("http");
const https = require("https");
const { notifyOwner } = require("./_notify");

const PB_INTERNAL = process.env.PB_URL || "http://localhost:8090";

// Parse allowed emails at startup so we don't re-parse on every request
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function forwardToPB(body) {
  return new Promise((resolve, reject) => {
    const pbUrl  = new URL("/api/collections/users/auth-with-oauth2", PB_INTERNAL);
    const client = pbUrl.protocol === "https:" ? https : http;
    const raw    = JSON.stringify(body);

    const req = client.request(
      {
        hostname: pbUrl.hostname,
        port:     pbUrl.port,
        path:     pbUrl.pathname,
        method:   "POST",
        headers:  { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(raw) },
      },
      res => {
        let data = "";
        res.on("data", chunk => { data += chunk; });
        res.on("end", () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, data: {} }); }
        });
      }
    );
    req.on("error", reject);
    req.write(raw);
    req.end();
  });
}

module.exports = async function authInterceptHandler(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(200, CORS);
    res.end("{}");
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, CORS);
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  const body = req.body || {};

  let pbResult;
  try {
    pbResult = await forwardToPB(body);
  } catch (e) {
    console.error("[AuthIntercept] PocketBase unreachable:", e.message);
    res.writeHead(502, CORS);
    res.end(JSON.stringify({ error: "Auth service unavailable" }));
    return;
  }

  const { status, data } = pbResult;

  // PocketBase rejected it — pass the error through as-is
  if (status !== 200) {
    res.writeHead(status, CORS);
    res.end(JSON.stringify(data));
    return;
  }

  const email = (data?.record?.email || "").toLowerCase();

  // If ALLOWED_EMAILS is configured and this email isn't on it — block
  if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) {
    console.warn(`[AuthIntercept] Blocked unauthorized login: ${email}`);
    // Alert owner async — don't await so we don't delay the response
    notifyOwner(`Mealplannr: Unauthorized login attempt from ${email}`).catch(() => {});
    res.writeHead(403, CORS);
    res.end(JSON.stringify({
      message: "Access restricted. The site owner has been notified.",
      code:    "unauthorized_email",
    }));
    return;
  }

  // Allowed — pass PocketBase response through
  res.writeHead(200, CORS);
  res.end(JSON.stringify(data));
};
