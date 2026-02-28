const { supabase, getUserFromRequest, unauthorized, CORS, SUPABASE_URL, SUPABASE_ANON_KEY } = require("./_supabase-helper");

// Look up a user's ID by email using the service key
async function findUserByEmail(email) {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      }
    });
    const json = await res.json();
    const found = (json.users || []).find(u => u.email?.toLowerCase() === email.toLowerCase());
    return found?.id || null;
  } catch(e) { return null; }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS };

  const auth = await getUserFromRequest(event);
  if (!auth) return unauthorized();
  const { user, token } = auth;

  // GET — list shares owned by me
  if (event.httpMethod === "GET") {
    const { ok, data } = await supabase(
      `/library_shares?owner_id=eq.${user.id}&select=*&order=created_at.desc`,
      "GET", null, token
    );
    if (!ok) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "DB error" }) };
    return { statusCode: 200, headers: CORS, body: JSON.stringify(data || []) };
  }

  // POST — create or update a share
  if (event.httpMethod === "POST") {
    const { email, permission } = JSON.parse(event.body || "{}");
    if (!email || !permission) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing email or permission" }) };
    if (!["view", "edit"].includes(permission)) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid permission" }) };
    if (email.toLowerCase() === user.email?.toLowerCase()) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Cannot share with yourself" }) };

    // Try to find the user's ID
    const sharedWithId = await findUserByEmail(email);

    // Check if share already exists
    const { data: existing } = await supabase(
      `/library_shares?owner_id=eq.${user.id}&shared_with_email=eq.${encodeURIComponent(email)}`,
      "GET", null, token
    );

    if (existing?.length > 0) {
      const patch = { permission };
      if (sharedWithId) patch.shared_with_id = sharedWithId;
      await supabase(`/library_shares?id=eq.${existing[0].id}`, "PATCH", patch, token);
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, updated: true, userFound: !!sharedWithId }) };
    }

    const { ok, data } = await supabase("/library_shares", "POST", {
      owner_id: user.id,
      shared_with_email: email,
      shared_with_id: sharedWithId,
      permission,
    }, token);
    if (!ok) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "DB error", detail: data }) };
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, created: true, userFound: !!sharedWithId }) };
  }

  // PATCH — update permission
  if (event.httpMethod === "PATCH") {
    const { id, permission } = JSON.parse(event.body || "{}");
    if (!id || !permission) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing fields" }) };
    const { ok } = await supabase(`/library_shares?id=eq.${id}&owner_id=eq.${user.id}`, "PATCH", { permission }, token);
    if (!ok) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "DB error" }) };
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
  }

  // DELETE — remove a share
  if (event.httpMethod === "DELETE") {
    const id = event.queryStringParameters?.id;
    if (!id) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing id" }) };
    const { ok } = await supabase(`/library_shares?id=eq.${id}&owner_id=eq.${user.id}`, "DELETE", null, token);
    if (!ok) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "DB error" }) };
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };
};
