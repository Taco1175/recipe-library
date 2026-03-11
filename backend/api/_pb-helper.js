// backend/api/_pb-helper.js
// Thin wrapper around PocketBase's REST API for server-side use.
// PocketBase runs at http://localhost:8090 internally on the Pi.

const PB_INTERNAL = process.env.PB_URL || "http://localhost:8090";
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

const ALLOWED_ORIGIN = process.env.APP_URL || "https://mealplannr.xyz";
const CORS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Content-Type": "application/json",
};

// ── Low-level fetch to PocketBase ──────────────────────────────────────────
async function pbFetch(path, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = token;

  const res = await fetch(`${PB_INTERNAL}/api/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { _raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

// ── Admin token (for privileged ops like user lookup) ──────────────────────
let _adminToken = null;
let _adminExpiry = 0;

async function getAdminToken() {
  if (_adminToken && Date.now() < _adminExpiry - 30000) return _adminToken;
  const { ok, data } = await pbFetch("admins/auth-with-password", "POST", {
    identity: PB_ADMIN_EMAIL,
    password: PB_ADMIN_PASSWORD,
  });
  if (!ok || !data.token) throw new Error(`Admin auth failed (${status}): ${JSON.stringify(data)}`);
  _adminToken = data.token;
  // PocketBase admin tokens last 1 day by default
  _adminExpiry = Date.now() + 23 * 60 * 60 * 1000;
  return _adminToken;
}

// ── Extract & verify user token from incoming HTTP request ─────────────────
async function getUserFromRequest(req) {
  // Use a case-insensitive check for the Authorization header
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || "";
  
  // Clean the token (removes Bearer if it's there, handles raw if not)
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  // PocketBase /auth-refresh is the gold standard for verifying the session
  const { ok, data } = await pbFetch("collections/users/auth-refresh", "POST", null, token);
  
  // If PB returns 200, the token is valid. We return the fresh token PB gives us.
  if (!ok || !data.record) return null;

  return { 
    user: data.record, 
    token: data.token || token 
  };
}


// ── PocketBase filter escaping ─────────────────────────────────────────────
// Escapes a value for use inside a double-quoted PocketBase filter string.
// e.g.  filter(`email="${pbEscape(email)}"`)
function pbEscape(val) {
  return String(val).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// ── Collection helpers ─────────────────────────────────────────────────────

// GET list from a collection, with optional filter
async function pbList(collection, { filter = "", sort = "", perPage = 500, page = 1 } = {}, token) {
  const params = { perPage, page };
  if (filter) params.filter = filter;
  if (sort)   params.sort   = sort;
  const qs = new URLSearchParams(params).toString();
  return pbFetch(`collections/${collection}/records?${qs}`, "GET", null, token);
}

// GET single record
async function pbGet(collection, id, token) {
  return pbFetch(`collections/${collection}/records/${id}`, "GET", null, token);
}

// CREATE record
async function pbCreate(collection, body, token) {
  return pbFetch(`collections/${collection}/records`, "POST", body, token);
}

// UPDATE record (PATCH)
async function pbUpdate(collection, id, body, token) {
  return pbFetch(`collections/${collection}/records/${id}`, "PATCH", body, token);
}

// DELETE record
async function pbDelete(collection, id, token) {
  return pbFetch(`collections/${collection}/records/${id}`, "DELETE", null, token);
}

// Find first matching record (returns null if not found)
async function pbFirst(collection, filter, token) {
  const { ok, data } = await pbList(collection, { filter, perPage: 1 }, token);
  if (!ok || !data.items?.length) return null;
  return data.items[0];
}

// Find user by email (admin op — used for sharing)
async function findUserByEmail(email) {
  try {
    const adminToken = await getAdminToken();
    const result = await pbFirst("users", `email="${pbEscape(email)}"`, adminToken);
    return result;
  } catch (e) { return null; }
}

function send(res, status, body) {
  res.writeHead(status, { ...CORS, "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function unauthorized(msg = "Unauthorized") {
  return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: msg }) };
}

function badRequest(msg) {
  return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: msg }) };
}

function serverError(msg, detail) {
  return {
    statusCode: 500, headers: CORS,
    body: JSON.stringify({ error: msg, ...(detail ? { detail } : {}) })
  };
}

function ok(body) {
  return { statusCode: 200, headers: CORS, body: JSON.stringify(body) };
}

module.exports = {
  pbFetch, pbList, pbGet, pbCreate, pbUpdate, pbDelete, pbFirst,
  getAdminToken, getUserFromRequest, findUserByEmail, pbEscape,
  send, unauthorized, badRequest, serverError, ok, CORS,
};
