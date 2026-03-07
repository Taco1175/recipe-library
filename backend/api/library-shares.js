// backend/api/library-shares.js
// Replaces: netlify/functions/library-shares.js

const {
  pbList, pbCreate, pbUpdate, pbDelete, pbFirst,
  findUserByEmail, getUserFromRequest, CORS,
} = require("./_pb-helper");

const { sendEmail, shareInviteEmail } = require("./_email-helper");

module.exports = async function librarySharesHandler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, {});

  const auth = await getUserFromRequest(req);
  if (!auth) return send(res, 401, { error: "Unauthorized" });
  const { user, token } = auth;

  // ── GET — shares I own ────────────────────────────────────────────────────
  if (req.method === "GET") {
    const { ok, data } = await pbList(
      "library_shares",
      { filter: `owner="${user.id}"`, sort: "-created" },
      token
    );
    if (!ok) return send(res, 500, { error: "DB error" });
    return send(res, 200, data?.items || []);
  }

  // ── POST — create or update share ────────────────────────────────────────
  if (req.method === "POST") {
    const { email, permission } = req.body || {};
    if (!email || !permission) return send(res, 400, { error: "Missing email or permission" });
    if (!["view","edit"].includes(permission)) return send(res, 400, { error: "Invalid permission" });
    if (email.toLowerCase() === user.email?.toLowerCase()) return send(res, 400, { error: "Cannot share with yourself" });

    // Look up the recipient user record
    const recipientRecord = await findUserByEmail(email);
    const recipientId = recipientRecord?.id || null;

    // Check if share already exists
    const existing = await pbFirst(
      "library_shares",
      `owner="${user.id}" && shared_with_email="${email}"`,
      token
    );

    if (existing) {
      const patch = { permission };
      if (recipientId) patch.shared_with = recipientId;
      await pbUpdate("library_shares", existing.id, patch, token);
      return send(res, 200, { success: true, updated: true, userFound: !!recipientId });
    }

    const { ok, data } = await pbCreate("library_shares", {
      owner:             user.id,
      owner_email:       user.email,
      shared_with_email: email,
      shared_with:       recipientId,
      permission,
    }, token);
    if (!ok) return send(res, 500, { error: "DB error", detail: data });

    // Send invite email
    try {
      const { subject, html } = shareInviteEmail({
        ownerEmail:     user.email,
        recipientEmail: email,
        permission,
        appUrl:         process.env.APP_URL || "https://mealplannr.xyz",
      });
      await sendEmail({ to: email, subject, html });
    } catch (e) { console.error("Email send failed:", e.message); }

    return send(res, 200, { success: true, created: true, userFound: !!recipientId });
  }

  // ── PATCH — update permission ─────────────────────────────────────────────
  if (req.method === "PATCH") {
    const { id, permission } = req.body || {};
    if (!id || !permission) return send(res, 400, { error: "Missing fields" });

    // Verify ownership
    const existing = await pbFirst("library_shares", `id="${id}" && owner="${user.id}"`, token);
    if (!existing) return send(res, 404, { error: "Share not found" });

    const { ok } = await pbUpdate("library_shares", id, { permission }, token);
    if (!ok) return send(res, 500, { error: "Update failed" });
    return send(res, 200, { success: true });
  }

  // ── DELETE — remove share ─────────────────────────────────────────────────
  if (req.method === "DELETE") {
    const id = new URL(req.url, "http://x").searchParams.get("id");
    if (!id) return send(res, 400, { error: "Missing id" });

    const existing = await pbFirst("library_shares", `id="${id}" && owner="${user.id}"`, token);
    if (!existing) return send(res, 404, { error: "Share not found" });

    await pbDelete("library_shares", id, token);
    return send(res, 200, { success: true });
  }

  return send(res, 405, { error: "Method Not Allowed" });
};

function send(res, status, body) {
  res.writeHead(status, CORS);
  res.end(JSON.stringify(body));
}
