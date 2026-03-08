const { supabase, getUserFromRequest } = require("./_supabase-helper");

const HEADERS = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: HEADERS };

  const { user, error: authErr } = await getUserFromRequest(event);
  if (authErr || !user) return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: "Unauthorized" }) };

  const token = (event.headers.authorization || event.headers.Authorization || "").replace("Bearer ", "").trim();

  // GET — return saved theme (default "dark" if no row yet)
  if (event.httpMethod === "GET") {
    const res = await supabase("/user_preferences?select=theme&limit=1", "GET", null, token);
    const theme = res.data?.[0]?.theme || "dark";
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ theme }) };
  }

  // POST — upsert theme
  if (event.httpMethod === "POST") {
    const { theme } = JSON.parse(event.body || "{}");
    if (!["dark", "light", "fun"].includes(theme)) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "Invalid theme" }) };
    }

    // PATCH existing row, if nothing updated (empty array) do an INSERT
    const upd = await supabase(
      `/user_preferences?user_id=eq.${user.id}`,
      "PATCH",
      { theme, updated_at: new Date().toISOString() },
      token
    );
    if (!upd.data || upd.data.length === 0) {
      await supabase("/user_preferences", "POST", { user_id: user.id, theme }, token);
    }

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers: HEADERS, body: "Method Not Allowed" };
};
