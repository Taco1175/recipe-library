function simpleHmac(data, key) {
  let hash = 0;
  const combined = data + key;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function verifyToken(token) {
  if (!token) return false;
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret) return false;
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [timestamp, sig] = decoded.split(":");
    if (!timestamp || !sig) return false;
    if (Date.now() - parseInt(timestamp) > 30 * 24 * 60 * 60 * 1000) return false;
    return sig === simpleHmac(timestamp, secret);
  } catch { return false; }
}

function getToken(event) {
  const auth = event.headers["authorization"] || "";
  return auth.replace("Bearer ", "").trim();
}

module.exports = { verifyToken, getToken };