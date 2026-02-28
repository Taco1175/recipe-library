const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Call Supabase as the service role (bypasses RLS) - for admin/migration tasks
async function supabaseAdmin(path, method = "GET", body = null) {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
  return supabaseRequest(path, method, body, serviceKey);
}

// Call Supabase as the logged-in user (respects RLS)
async function supabase(path, method = "GET", body = null, userToken = null) {
  const token = userToken || SUPABASE_ANON_KEY;
  return supabaseRequest(path, method, body, token);
}

async function supabaseRequest(path, method, body, token) {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  if (method === "POST" || method === "PATCH") headers.Prefer = "return=representation";

  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

// Extract and verify JWT from request headers, return user info
async function getUserFromRequest(event) {
  const auth = event.headers["authorization"] || event.headers["Authorization"] || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY }
    });
    if (!res.ok) return null;
    const user = await res.json();
    return { user, token };
  } catch(e) { return null; }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

function unauthorized() {
  return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Unauthorized" }) };
}

module.exports = { supabase, supabaseAdmin, getUserFromRequest, unauthorized, CORS, SUPABASE_URL, SUPABASE_ANON_KEY };
