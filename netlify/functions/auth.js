exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const { password } = JSON.parse(event.body || "{}");
  const correct = process.env.SITE_PASSWORD;

  if (!correct) return { statusCode: 500, body: JSON.stringify({ error: "Server misconfigured" }) };
  if (password !== correct) return { statusCode: 401, body: JSON.stringify({ error: "Wrong password" }) };

  // Return a signed token (HMAC of a timestamp so it's stateless)
  const secret = process.env.SESSION_SECRET || "fallback-secret";
  const payload = Date.now().toString();
  const token = Buffer.from(`${payload}:${simpleHmac(payload, secret)}`).toString("base64");

  return {
    statusCode: 200,
    body: JSON.stringify({ token }),
  };
};

function simpleHmac(data, key) {
  // Simple deterministic hash for stateless token verification
  let hash = 0;
  const combined = data + key;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
