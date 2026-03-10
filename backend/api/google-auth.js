// backend/api/google-auth.js
// Handles Google OAuth code exchange and token refresh.
// Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET in .env
// The redirect_uri must match exactly what's registered in Google Cloud Console.

const https = require("https");

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function send(res, status, body) {
  res.writeHead(status, CORS);
  res.end(JSON.stringify(body));
}

function googleTokenRequest(params) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const req = https.request({
      hostname: "oauth2.googleapis.com",
      path: "/token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
      },
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch(e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

module.exports = async function googleAuthHandler(req, res) {
  if (req.method === "OPTIONS") { res.writeHead(200, CORS); res.end("{}"); return; }
  if (req.method !== "POST") return send(res, 405, { error: "Method Not Allowed" });

  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return send(res, 503, { error: "Google OAuth not configured on server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." });
  }

  const body = req.body || {};

  // Token refresh
  if (body.action === "refresh") {
    if (!body.refresh_token) return send(res, 400, { error: "refresh_token required" });
    try {
      const { status, data } = await googleTokenRequest({
        client_id:     clientId,
        client_secret: clientSecret,
        refresh_token: body.refresh_token,
        grant_type:    "refresh_token",
      });
      if (data.error) return send(res, 400, { error: data.error_description || data.error });
      return send(res, 200, {
        access_token: data.access_token,
        expires_in:   data.expires_in,
      });
    } catch(e) {
      return send(res, 502, { error: "Token refresh failed: " + e.message });
    }
  }

  // Initial code exchange
  if (!body.code) return send(res, 400, { error: "code required" });

  // The redirect_uri must exactly match what was registered in Google Cloud Console
  // and what the frontend sent to Google in the authorization URL.
  const redirectUri = body.redirect_uri || (process.env.APP_URL ? process.env.APP_URL + "/planner.html" : null);
  if (!redirectUri) {
    return send(res, 400, { error: "redirect_uri required. Set APP_URL in .env or pass redirect_uri in request body." });
  }

  try {
    const { data } = await googleTokenRequest({
      code:          body.code,
      client_id:     clientId,
      client_secret: clientSecret,
      redirect_uri:  redirectUri,
      grant_type:    "authorization_code",
    });
    if (data.error) return send(res, 400, { error: data.error_description || data.error });
    return send(res, 200, {
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_in:    data.expires_in,
    });
  } catch(e) {
    return send(res, 502, { error: "Token exchange failed: " + e.message });
  }
};
