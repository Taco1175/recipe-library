const { supabase, getUserFromRequest, unauthorized, CORS } = require("./_supabase-helper");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS };

  const auth = await getUserFromRequest(event);
  if (!auth) return unauthorized();
  const { user, token } = auth;

  if (event.httpMethod === "GET") {
    const { ok, data } = await supabase("/recipes?select=*&order=id.asc", "GET", null, token);
    if (!ok) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "DB error" }) };
    return { statusCode: 200, headers: CORS, body: JSON.stringify(data || []) };
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
