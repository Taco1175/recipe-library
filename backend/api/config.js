// backend/api/config.js
// Exposes safe public config to the frontend (no secrets).

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

module.exports = function configHandler(req, res) {
  if (req.method === "OPTIONS") { res.writeHead(200, CORS); res.end("{}"); return; }

  res.writeHead(200, CORS);
  res.end(JSON.stringify({
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
  }));
};
