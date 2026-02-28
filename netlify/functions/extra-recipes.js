const { supabase } = require("./_supabase-helper");

exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  if (event.httpMethod === "GET") {
    const { ok, data } = await supabase("/extra_recipes?select=*&order=id.asc");
    if (!ok) return { statusCode: 500, headers, body: JSON.stringify({ error: "DB error" }) };
    return { statusCode: 200, headers, body: JSON.stringify(data || []) };
  }

  if (event.httpMethod === "POST") {
    const recipe = JSON.parse(event.body || "{}");
    const { id, ...fields } = recipe;

    // If only updating specific fields (like archived), use PATCH
    if (id && Object.keys(fields).length > 0 && !fields.name) {
      const { ok, data } = await supabase(`/extra_recipes?id=eq.${id}`, "PATCH", fields);
      if (!ok) return { statusCode: 500, headers, body: JSON.stringify({ error: "DB error", detail: data }) };
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // Full upsert for new/updated recipes
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