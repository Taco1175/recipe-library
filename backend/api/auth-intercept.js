// backend/api/auth-intercept.js
// Intercepts Google OAuth completions at /api/collections/users/auth-with-oauth2.
// Forwards the request to PocketBase and passes the response through.

const { pbFetch } = require("./_pb-helper");

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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

  // Forward the OAuth request to PocketBase
  let pbResult;
  try {
    pbResult = await pbFetch("collections/users/auth-with-oauth2", "POST", req.body || {});
  } catch(e) {
    console.error("[AuthIntercept] PocketBase unreachable:", e.message);
    res.writeHead(502, CORS);
    res.end(JSON.stringify({ error: "Auth service unavailable" }));
    return;
  }

  const { ok, status, data } = pbResult;

  res.writeHead(ok ? 200 : status, CORS);
  res.end(JSON.stringify(data));
};
