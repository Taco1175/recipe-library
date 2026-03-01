// Email via Resend (https://resend.com) — free tier: 100 emails/day
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || "recipes@cowpushing-meals.netlify.app";
const APP_URL = process.env.URL || "https://cowpushing-meals.netlify.app";

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn("No RESEND_API_KEY — skipping email");
    return { ok: false, error: "No email API key configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

function shareInviteEmail({ ownerEmail, recipientEmail, permission, appUrl }) {
  const permLabel = permission === "edit" ? "view and edit" : "view";
  const loginUrl = `${appUrl || APP_URL}/login.html`;
  return {
    subject: `${ownerEmail} shared their recipe library with you`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0F1117;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;padding:0 16px">
    <div style="background:#1a1f2e;border:1px solid #2a2f3e;border-radius:16px;overflow:hidden">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1a1f2e,#0F1117);padding:32px 32px 24px;border-bottom:1px solid #2a2f3e;text-align:center">
        <div style="font-size:36px;margin-bottom:8px">🍽</div>
        <h1 style="margin:0;font-size:22px;color:#F5F0E8;font-weight:700">Recipe Library</h1>
      </div>
      <!-- Body -->
      <div style="padding:32px">
        <p style="margin:0 0 16px;font-size:15px;color:#b0b5c4;line-height:1.6">
          <strong style="color:#E8E4DC">${ownerEmail}</strong> has invited you to <strong style="color:#E8E4DC">${permLabel}</strong> their recipe library.
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#8a8f9e;line-height:1.6">
          You'll have access to their full collection of meal prep recipes, ingredients, and cooking steps.
        </p>
        <!-- CTA -->
        <div style="text-align:center;margin:28px 0">
          <a href="${loginUrl}" style="display:inline-block;background:#6e8efb;color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:15px;font-weight:600">
            Open Recipe Library →
          </a>
        </div>
        <p style="margin:24px 0 0;font-size:12px;color:#556;text-align:center;font-family:monospace">
          Sign in with <strong>${recipientEmail}</strong> to access the shared library.
        </p>
      </div>
      <!-- Footer -->
      <div style="padding:16px 32px;border-top:1px solid #2a2f3e;text-align:center">
        <p style="margin:0;font-size:11px;color:#445;font-family:monospace">
          Recipe Library · <a href="${appUrl || APP_URL}/privacy.html" style="color:#6e8efb;text-decoration:none">Privacy Policy</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim()
  };
}

module.exports = { sendEmail, shareInviteEmail };
