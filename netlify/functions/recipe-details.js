const { supabase, getUserFromRequest, unauthorized, CORS } = require("./_supabase-helper");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS };

  const auth = await getUserFromRequest(event);
  if (!auth) return unauthorized();
  const { user, token } = auth;

  if (event.httpMethod === "GET") {
    const id = event.queryStringParameters?.id;
    const path = id
      ? `/recipe_details?recipe_id=eq.${id}&user_id=eq.${user.id}&select=*`
      : `/recipe_details?user_id=eq.${user.id}&select=*`;
    const { ok, data } = await supabase(path, "GET", null, token);
    if (!ok) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "DB error" }) };
    return { statusCode: 200, headers: CORS, body: JSON.stringify(data) };
  }

  if (event.httpMethod === "POST") {
    const { recipe_id, ingredients, steps, servings } = JSON.parse(event.body || "{}");
    if (!recipe_id || !ingredients || !steps) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing fields" }) };
    const { ok, data } = await supabase("/recipe_details?on_conflict=recipe_id", "POST", {
      recipe_id, ingredients, steps, servings: servings || 4,
      user_id: user.id, updated_at: new Date().toISOString()
    }, token);
    if (!ok) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "DB error", detail: data }) };
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
  }

  if (event.httpMethod === "DELETE") {
    const id = event.queryStringParameters?.id;
    if (!id) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing id" }) };
    await supabase(`/recipe_details?recipe_id=eq.${id}&user_id=eq.${user.id}`, "DELETE", null, token);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };
};
