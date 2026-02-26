const { verifyToken, getToken } = require("./_auth-helper");
const { supabase } = require("./_supabase-helper");

exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
  if (!verifyToken(getToken(event))) return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };

  if (event.httpMethod === "GET") {
    const id = event.queryStringParameters?.id;
    const path = id ? `/recipe_details?recipe_id=eq.${id}&select=*` : `/recipe_details?select=*`;
    const { ok, data } = await supabase(path);
    if (!ok) return { statusCode: 500, headers, body: JSON.stringify({ error: "DB error" }) };
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  }

  if (event.httpMethod === "POST") {
    const { recipe_id, ingredients, steps } = JSON.parse(event.body || "{}");
    if (!recipe_id || !ingredients || !steps) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing fields" }) };
    const { ok, data } = await supabase("/recipe_details?on_conflict=recipe_id", "POST", { recipe_id, ingredients, steps, updated_at: new Date().toISOString() });
    if (!ok) return { statusCode: 500, headers, body: JSON.stringify({ error: "DB error", detail: data }) };
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  if (event.httpMethod === "DELETE") {
    const id = event.queryStringParameters?.id;
    if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing id" }) };
    await supabase(`/recipe_details?recipe_id=eq.${id}`, "DELETE");
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 405, headers, body: "Method Not Allowed" };
};