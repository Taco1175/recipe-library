// Google OAuth token exchange
exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  const { code, action } = JSON.parse(event.body || "{}");

  // Refresh token exchange
  if (action === "refresh") {
    const { refresh_token } = JSON.parse(event.body);
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token,
        grant_type: "refresh_token",
      }),
    });
    const data = await res.json();
    if (data.error) return { statusCode: 401, headers, body: JSON.stringify({ error: data.error }) };
    return { statusCode: 200, headers, body: JSON.stringify({ access_token: data.access_token, expires_in: data.expires_in }) };
  }

  // Initial code exchange
  if (!code) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing code" }) };

  const origin = event.headers.origin || event.headers.referer?.split("/").slice(0,3).join("/") || "";
  const redirectUri = `${origin}/planner.html`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const data = await res.json();
  if (data.error) return { statusCode: 401, headers, body: JSON.stringify({ error: data.error, detail: data.error_description }) };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    }),
  };
};
