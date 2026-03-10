// backend/api/app-settings.js
// App-wide settings (not per-user). Owner-only access.
// Requires an "site_config" collection in PocketBase with:
//   allowed_emails — Text
// All API rules: @request.auth.email = "cowlingpush2016@gmail.com"

const OWNER_EMAIL = "cowlingpush2016@gmail.com";

const { pbFetch, pbFirst, getUserFromRequest, CORS } = require("./_pb-helper");

function send(res, status, body) {
  res.writeHead(status, CORS);
  res.end(JSON.stringify(body));
}

function parseAllowedEmails(rec) {
  try { return JSON.parse(rec?.allowed_emails || "[]"); } catch { return []; }
}

module.exports = async function appSettingsHandler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, {});

  // All methods require the owner account
  const auth = await getUserFromRequest(req);
  if (!auth) return send(res, 401, { error: "Unauthorized" });
  if (auth.user.email !== OWNER_EMAIL) return send(res, 403, { error: "Forbidden" });
  const { token } = auth;

  // GET
  if (req.method === "GET") {
    const { ok, data } = await pbFetch("collections/site_config/records?perPage=1", "GET", null, token);
    const rec = data?.items?.[0] || null;
    return send(res, 200, { allowed_emails: parseAllowedEmails(rec) });
  }

  // POST
  if (req.method === "POST") {

    const raw = req.body?.allowed_emails;
    // Accept either an array or a newline/comma-separated string
    let emails = [];
    if (Array.isArray(raw)) {
      emails = raw;
    } else if (typeof raw === "string") {
      emails = raw.split(/[\n,]+/).map(e => e.trim().toLowerCase()).filter(Boolean);
    }

    const update = { allowed_emails: JSON.stringify(emails) };
    const existing = await pbFirst("site_config", "", token);

    if (existing) {
      await pbFetch(`collections/site_config/records/${existing.id}`, "PATCH", update, token);
    } else {
      await pbFetch("collections/site_config/records", "POST", update, token);
    }

    return send(res, 200, { ok: true, allowed_emails: emails });
  }

  return send(res, 405, { error: "Method Not Allowed" });
};
