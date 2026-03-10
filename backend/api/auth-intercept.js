// backend/api/auth-intercept.js
// Intercepts Google OAuth completions at /api/collections/users/auth-with-oauth2.
//
// If allowed_emails is configured in app_settings (via the app's Settings UI):
//   - Blocks any email not on the list (returns 403)
//   - Texts ALL users who have notify_login enabled in their notification prefs
//
// No env var config needed — all settings live in PocketBase.

const { pbFetch, pbList, getAdminToken } = require("./_pb-helper");
const { sendSMS } = require("./_notify");

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Read the allowed_emails list from the public app_settings collection.
// Returns [] if the collection doesn't exist or has no records (open access).
async function getAllowedEmails() {
  try {
    const { ok, data } = await pbFetch("collections/app_settings/records?perPage=1");
    if (!ok || !data?.items?.length) return [];
    return JSON.parse(data.items[0].allowed_emails || "[]");
  } catch(e) {
    console.warn("[AuthIntercept] Could not read app_settings:", e.message);
    return [];
  }
}

// Find all users who have notify_login enabled and a phone configured.
// Uses admin token since user_preferences is private.
async function getLoginNotifyTargets() {
  try {
    const adminToken = await getAdminToken();
    const { ok, data } = await pbList("user_preferences", { perPage: 100 }, adminToken);
    if (!ok || !data?.items) return [];
    return data.items
      .map(pref => {
        try { return JSON.parse(pref.notifications || "{}"); } catch { return {}; }
      })
      .filter(n => n.notify_login && n.phone && n.carrier);
  } catch(e) {
    console.error("[AuthIntercept] getLoginNotifyTargets:", e.message);
    return [];
  }
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

  // PocketBase rejected it — pass through
  if (!ok) {
    res.writeHead(status, CORS);
    res.end(JSON.stringify(data));
    return;
  }

  const email = (data?.record?.email || "").toLowerCase();

  // Check allowed list (empty list = allow everyone)
  const allowedEmails = await getAllowedEmails();
  if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
    console.warn(`[AuthIntercept] Blocked unauthorized login: ${email}`);

    // Alert all users with notify_login enabled — fire-and-forget
    getLoginNotifyTargets().then(targets => {
      for (const { phone, carrier } of targets) {
        sendSMS({ phone, carrier, message: `Mealplannr: Unauthorized login attempt from ${email}` })
          .catch(() => {});
      }
    }).catch(() => {});

    res.writeHead(403, CORS);
    res.end(JSON.stringify({
      message: "Access restricted. The site owner has been notified.",
      code: "unauthorized_email",
    }));
    return;
  }

  // Allowed — pass PocketBase response through
  res.writeHead(200, CORS);
  res.end(JSON.stringify(data));
};
