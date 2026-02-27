const { supabase } = require("./_supabase-helper");

exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  if (event.httpMethod === "POST") {
    const { recipe_ids } = JSON.parse(event.body || "{}");
    if (!recipe_ids || !recipe_ids.length) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing recipe_ids" }) };
    }

    const ids = recipe_ids.join(",");
    const { ok, data } = await supabase(
      `/recipe_ingredients?recipe_id=in.(${ids})&order=recipe_id,sort_order&select=*`
    );

    if (!ok) return { statusCode: 500, headers, body: JSON.stringify({ error: "DB error" }) };
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  }

  return { statusCode: 405, headers, body: "Method Not Allowed" };
};
