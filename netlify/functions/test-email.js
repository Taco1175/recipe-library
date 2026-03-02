const { sendEmail } = require("./_email-helper");
const { getUserFromRequest, unauthorized, CORS } = require("./_supabase-helper");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS };

  const auth = await getUserFromRequest(event);
  if (!auth) return unauthorized();

  const to = auth.user.email;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@mealplannr.xyz";

  // Log env state
  const envInfo = {
    hasResendKey: !!RESEND_API_KEY,
    keyPrefix: RESEND_API_KEY ? RESEND_API_KEY.slice(0, 8) + "..." : "MISSING",
    fromEmail: FROM_EMAIL,
    netlifyUrl: process.env.URL || "not set",
    to,
  };

  console.log("[test-email] env:", JSON.stringify(envInfo));

  if (!RESEND_API_KEY) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: "RESEND_API_KEY is not set in Netlify env vars", envInfo }),
    };
  }

  // Make raw Resend call so we can return the full response
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject: "Mealplannr email test",
      html: "<p>If you're reading this, email is working! ✅</p>",
    }),
  });

  const data = await res.json();
  console.log("[test-email] Resend response:", res.status, JSON.stringify(data));

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({ resendStatus: res.status, resendOk: res.ok, resendData: data, envInfo }),
  };
};
