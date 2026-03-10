// backend/api/claude-proxy.js
// Proxies Claude API calls from authenticated frontend clients.
// The API key never leaves the server.

const { getUserFromRequest, send } = require("./_pb-helper");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MAX_PROMPT_LENGTH = 12000;

module.exports = async function claudeProxyHandler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, {});
  if (req.method !== "POST") return send(res, 405, { error: "Method Not Allowed" });

  const auth = await getUserFromRequest(req);
  if (!auth) return send(res, 401, { error: "Unauthorized" });

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") return send(res, 400, { error: "Missing prompt" });
  if (prompt.length > MAX_PROMPT_LENGTH) return send(res, 400, { error: "Prompt too long" });

  if (!ANTHROPIC_API_KEY) return send(res, 500, { error: "AI not configured on this server" });

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await upstream.json();
    if (data.error) return send(res, 500, { error: data.error.message });
    return send(res, 200, { text: data.content[0].text });
  } catch (e) {
    console.error("[claude-proxy] Error:", e.message);
    return send(res, 500, { error: "AI request failed" });
  }
};
