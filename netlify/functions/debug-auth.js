const { getUserFromRequest, supabase, CORS } = require("./_supabase-helper");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS };
  
  const auth = await getUserFromRequest(event);
  if (!auth) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "No auth" }) };
  
  const { user, token } = auth;
  
  // Try fetching recipe_details with this token
  const { ok, data } = await supabase("/recipe_details?select=recipe_id,user_id&limit=3", "GET", null, token);
  
  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      auth_user_id: user.id,
      auth_email: user.email,
      details_ok: ok,
      details_count: Array.isArray(data) ? data.length : 0,
      details_sample: data?.slice(0,2),
    })
  };
};
