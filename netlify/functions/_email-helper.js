const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";
const APP_URL = process.env.URL || "https://cowpushing-meals.netlify.app";

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn("[Email] No RESEND_API_KEY set — skipping");
    return { ok: false, error: "No API key" };
  }
  console.log(`[Email] Sending to=${to} from=${FROM_EMAIL} key=${RESEND_API_KEY.slice(0,8)}...`);
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
    console.log(`[Email] Resend ${res.status}:`, JSON.stringify(data));
    return { ok: res.ok, data };
  } catch(e) {
    console.error("[Email] Fetch error:", e.message);
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
      <div style="background:linear-gradient(135deg,#1a1f2e,#0F1117);padding:32px 32px 24px;border-bottom:1px solid #2a2f3e;text-align:center">
        <div style="font-size:36px;margin-bottom:8px">&#127869;</div>
        <h1 style="margin:0;font-size:22px;color:#F5F0E8;font-weight:700">Recipe Library</h1>
      </div>
      <div style="padding:32px">
        <p style="margin:0 0 16px;font-size:15px;color:#b0b5c4;line-height:1.6">
          <strong style="color:#E8E4DC">${ownerEmail}</strong> has invited you to <strong style="color:#E8E4DC">${permLabel}</strong> their recipe library.
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#8a8f9e;line-height:1.6">
          You'll have access to their full collection of meal prep recipes, ingredients, and cooking steps.
        </p>
        <div style="text-align:center;margin:28px 0">
          <a href="${loginUrl}" style="display:inline-block;background:#6e8efb;color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:15px;font-weight:600">
            Open Recipe Library &#8594;
          </a>
        </div>
        <p style="margin:24px 0 0;font-size:12px;color:#556;text-align:center;font-family:monospace">
          Sign in with <strong>${recipientEmail}</strong> to access the shared library.
        </p>
      </div>
      <div style="padding:16px 32px;border-top:1px solid #2a2f3e;text-align:center">
        <p style="margin:0;font-size:11px;color:#445;font-family:monospace">
          Recipe Library &middot; <a href="${appUrl || APP_URL}/privacy.html" style="color:#6e8efb;text-decoration:none">Privacy Policy</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`.trim()
  };
}

module.exports = { sendEmail, shareInviteEmail };
