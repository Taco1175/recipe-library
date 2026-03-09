// backend/api/user-preferences.js
// Stores per-user preferences in PocketBase's "user_preferences" collection.
//
// Required PocketBase fields:
//   theme         — Text
//   notifications — Text (JSON blob)
//
// Notification object shape stored in "notifications":
//   { phone, carrier, notify_login, notify_meal_save, notify_daily_digest }

const { pbFirst, pbCreate, pbUpdate, getUserFromRequest, CORS } = require("./_pb-helper");

function send(res, status, body) {
  res.writeHead(status, CORS);
  res.end(JSON.stringify(body));
}

function parseNotifs(pref) {
  try { return JSON.parse(pref?.notifications || "{}"); } catch { return {}; }
}

module.exports = async function userPreferencesHandler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, {});

  const auth = await getUserFromRequest(req);
  if (!auth) return send(res, 401, { error: "Unauthorized" });
  const { user, token } = auth;

  // GET — return theme + notification settings
  if (req.method === "GET") {
    const pref = await pbFirst("user_preferences", "", token);
    return send(res, 200, {
      theme:         pref?.theme || "dark",
      notifications: parseNotifs(pref),
    });
  }

  // POST — upsert theme and/or notifications
  if (req.method === "POST") {
    const { theme, notifications } = req.body || {};
    const update = {};

    if (theme !== undefined) {
      if (!["dark", "light", "fun"].includes(theme)) {
        return send(res, 400, { error: "Invalid theme" });
      }
      update.theme = theme;
    }

    if (notifications !== undefined) {
      update.notifications = JSON.stringify(notifications);
    }

    if (Object.keys(update).length === 0) {
      return send(res, 400, { error: "Nothing to update" });
    }

    const existing = await pbFirst("user_preferences", "", token);
    if (existing) {
      await pbUpdate("user_preferences", existing.id, update, token);
    } else {
      await pbCreate("user_preferences", { user: user.id, ...update }, token);
    }

    return send(res, 200, { ok: true });
  }

  return send(res, 405, { error: "Method Not Allowed" });
};
