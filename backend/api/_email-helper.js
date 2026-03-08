const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM;
const APP_URL = process.env.APP_URL || "https://mealplannr.xyz";

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) { console.warn("[Email] No RESEND_API_KEY set — skipping"); return { ok: false, error: "No API key" }; }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    const data = await res.json();
    if (!res.ok) console.error(`[Email] FAILED:`, JSON.stringify(data));
    return { ok: res.ok, data };
  } catch(e) { return { ok: false, error: e.message }; }
}

function shareInviteEmail({ ownerEmail, recipientEmail, permission, appUrl }) {
  const permLabel = permission === "edit" ? "view and edit" : "view";
  const loginUrl = `${appUrl || APP_URL}/login.html`;
  return {
    subject: `${ownerEmail} shared their recipe library with you`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0F1117;font-family:Arial,sans-serif"><div style="max-width:560px;margin:40px auto;padding:0 16px"><div style="background:#1a1f2e;border:1px solid #2a2f3e;border-radius:16px;overflow:hidden"><div style="padding:32px;border-bottom:1px solid #2a2f3e;text-align:center"><div style="font-size:36px">&#127869;</div><h1 style="margin:0;font-size:22px;color:#F5F0E8">Recipe Library</h1></div><div style="padding:32px"><p style="color:#b0b5c4"><strong style="color:#E8E4DC">${ownerEmail}</strong> has invited you to <strong style="color:#E8E4DC">${permLabel}</strong> their recipe library.</p><div style="text-align:center;margin:28px 0"><a href="${loginUrl}" style="background:#6e8efb;color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:15px;font-weight:600">Open Recipe Library</a></div><p style="font-size:12px;color:#556;text-align:center">Sign in with <strong>${recipientEmail}</strong> to access the shared library.</p></div></div></div></body></html>`
  };
}

module.exports = { sendEmail, shareInviteEmail };
