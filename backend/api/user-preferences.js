// backend/api/user-preferences.js
// Stores theme preference per user in PocketBase's "user_preferences" collection

const { pbFirst, pbCreate, pbUpdate, getUserFromRequest, CORS } = require("./_pb-helper");

module.exports = async function userPreferencesHandler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, {});

  const auth = await getUserFromRequest(req);
  if (!auth) return send(res, 401, { error: "Unauthorized" });
  const { user, token } = auth;

  // GET — return saved theme
  if (req.method === "GET") {
    const pref = await pbFirst("user_preferences", `user="${user.id}"`, token);
    return send(res, 200, { theme: pref?.theme || "dark" });
  }

  // POST — upsert theme
  if (req.method === "POST") {
    const { theme } = req.body || {};
    if (!["dark","light","fun"].includes(theme)) {
      return send(res, 400, { error: "Invalid theme" });
    }

    const existing = await pbFirst("user_preferences", `user="${user.id}"`, token);
    if (existing) {
      await pbUpdate("user_preferences", existing.id, { theme }, token);
    } else {
      await pbCreate("user_preferences", { user: user.id, theme }, token);
    }
    return send(res, 200, { ok: true });
  }

  return send(res, 405, { error: "Method Not Allowed" });
};

function send(res, status, body) {
  res.writeHead(status, CORS);
  res.end(JSON.stringify(body));
}
