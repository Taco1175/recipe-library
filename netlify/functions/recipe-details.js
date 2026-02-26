const { verifyToken, getToken } = require("./_auth-helper");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

async function supabase(path, method = "GET", body = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: method === "POST" ? "return=representation" : undefined,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  if (!verifyToken(getToken(event))) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  // GET /recipe-details?id=123
  if (event.httpMethod === "GET") {
    const id = event.queryStringParameters?.id;
    const path = id
      ? `/recipe_details?recipe_id=eq.${id}&select=*`
      : `/recipe_details?select=*`;
    const { ok, data } = await supabase(path);
    if (!ok) return { statusCode: 500, headers, body: JSON.stringify({ error: "DB error" }) };
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  }

  // POST - save/update details
  if (event.httpMethod === "POST") {
    const { recipe_id, ingredients, steps } = JSON.parse(event.body || "{}");
    if (!recipe_id || !ingredients || !steps) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing fields" }) };
    }

    // Upsert
    const { ok, data } = await supabase(
      "/recipe_details?on_conflict=recipe_id",
      "POST",
      { recipe_id, ingredients, steps, updated_at: new Date().toISOString() }
    );
    if (!ok) return { statusCode: 500, headers, body: JSON.stringify({ error: "DB error", detail: data }) };
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  // DELETE
  if (event.httpMethod === "DELETE") {
    const id = event.queryStringParameters?.id;
    if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing id" }) };
    await supabase(`/recipe_details?recipe_id=eq.${id}`, "DELETE");
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 405, headers, body: "Method Not Allowed" };
};
