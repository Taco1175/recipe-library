const { verifyToken, getToken } = require("./_auth-helper");
const { supabase } = require("./_supabase-helper");

exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
  if (!verifyToken(getToken(event))) return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };

  if (event.httpMethod === "GET") {
    const { ok, data } = await supabase("/extra_recipes?select=*&order=id.asc");
    if (!ok) return { statusCode: 500, headers, body: JSON.stringify({ error: "DB error" }) };
    return { statusCode: 200, headers, body: JSON.stringify(data || []) };
  }

  if (event.httpMethod === "POST") {
    const recipe = JSON.parse(event.body || "{}");
    const { ok, data } = await supabase("/extra_recipes?on_conflict=id", "POST", recipe);
    if (!ok) return { statusCode: 500, headers, body: JSON.stringify({ error: "DB error", detail: data }) };
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  if (event.httpMethod === "DELETE") {
    const id = event.queryStringParameters?.id;
    await supabase(`/extra_recipes?id=eq.${id}`, "DELETE");
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 405, headers, body: "Method Not Allowed" };
};