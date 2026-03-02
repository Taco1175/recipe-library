const { supabase, getUserFromRequest, unauthorized, CORS } = require("./_supabase-helper");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS };

  const auth = await getUserFromRequest(event);
  if (!auth) return unauthorized();
  const { user, token } = auth;

  if (event.httpMethod === "GET") {
    // Fetch recipes (RLS returns owned + shared)
    const { ok, data } = await supabase("/recipes?select=*&order=id.asc", "GET", null, token);
    if (!ok) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "DB error" }) };

    // Fetch shares where I am the recipient — to get owner emails for labeling
    const { data: shares } = await supabase(
      `/library_shares?shared_with_id=eq.${user.id}&select=owner_id,owner_email,shared_with_email`,
      "GET", null, token
    );

    // Build a map of owner_id -> owner_email from shares
    const ownerMap = {};
    if (Array.isArray(shares)) {
      shares.forEach(s => { if (s.owner_id) ownerMap[s.owner_id] = s.owner_email; });
    }

    // Tag each recipe with owner label if it belongs to someone else
    const recipes = (data || []).map(r => {
      if (r.user_id && r.user_id !== user.id && ownerMap[r.user_id]) {
        const email = ownerMap[r.user_id];
        const name = email.split("@")[0];
        return { ...r, _owner_label: name + "'s" };
      }
      return r;
    });

    return { statusCode: 200, headers: CORS, body: JSON.stringify(recipes) };
  }

  if (event.httpMethod === "POST") {
    const body = JSON.parse(event.body || "{}");
    const { id, ...fields } = body;

    // Partial update (archived toggle etc)
    if (id && Object.keys(fields).length > 0 && !fields.name) {
      const { ok, data } = await supabase(`/recipes?id=eq.${id}&user_id=eq.${user.id}`, "PATCH", fields, token);
      if (!ok) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "DB error", detail: data }) };
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
    }

    // New recipe — inject user_id
    const recipe = { ...body, user_id: user.id };
    const { ok, data } = await supabase("/recipes?on_conflict=id", "POST", recipe, token);
    if (!ok) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "DB error", detail: data }) };
    return { statusCode: 200, headers: CORS, body: JSON.stringify(data?.[0] || { success: true }) };
  }

  if (event.httpMethod === "DELETE") {
    const id = event.queryStringParameters?.id;
    await supabase(`/recipes?id=eq.${id}&user_id=eq.${user.id}`, "DELETE", null, token);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };
};
