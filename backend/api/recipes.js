// backend/api/recipes.js
// Replaces: netlify/functions/extra-recipes.js
// Handles GET (list), POST (create/update), DELETE

const {
  pbList, pbCreate, pbUpdate, pbDelete, pbFirst,
  getUserFromRequest, unauthorized, badRequest, serverError, ok, CORS,
} = require("./_pb-helper");

module.exports = async function recipesHandler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, {});

  const auth = await getUserFromRequest(req);
  if (!auth) return send(res, 401, { error: "Unauthorized" });
  const { user, token } = auth;

  // ── GET /api/recipes ──────────────────────────────────────────────────────
  if (req.method === "GET") {
    // Fetch recipes owned by this user
    const { ok: recOk, data: recData } = await pbList(
      "recipes",
      { filter: `user="${user.id}"`, sort: "created" },
      token
    );
    if (!recOk) return send(res, 500, { error: "DB error" });

    // Fetch library shares where I am the recipient
    const { data: shareData } = await pbList(
      "library_shares",
      { filter: `shared_with="${user.id}"` },
      token
    );
    const shares = shareData?.items || [];

    // Collect owner IDs so we can label shared recipes
    const ownerIds = [...new Set(shares.map(s => s.owner))];

    // For each share, fetch that owner's recipes too
    let sharedRecipes = [];
    for (const ownerId of ownerIds) {
      const ownerShare = shares.find(s => s.owner === ownerId);
      const { data: owned } = await pbList(
        "recipes",
        { filter: `user="${ownerId}"` },
        token
      );
      const ownerEmail = ownerShare?.owner_email || ownerId;
      const ownerName  = ownerEmail.split("@")[0];
      (owned?.items || []).forEach(r => {
        sharedRecipes.push({ ...r, _owner_label: ownerName + "'s" });
      });
    }

    const allRecipes = [...(recData?.items || []), ...sharedRecipes];
    return send(res, 200, allRecipes);
  }

  // ── POST /api/recipes ─────────────────────────────────────────────────────
  if (req.method === "POST") {
    const body = req.body || {};
    const { id, ...fields } = body;

    // Partial update (e.g. archived toggle) — has id but no name
    if (id && !fields.name) {
      const result = await pbUpdate("recipes", id, fields, token);
      if (!result.ok) return send(res, 500, { error: "Update failed" });
      return send(res, 200, { success: true });
    }

    // Full upsert — if id exists update, otherwise create
    if (id) {
      // Check if record exists and belongs to user
      const existing = await pbFirst("recipes", `id="${id}" && user="${user.id}"`, token);
      if (existing) {
        const result = await pbUpdate("recipes", id, { ...fields, user: user.id }, token);
        if (!result.ok) return send(res, 500, { error: "Update failed", detail: result.data });
        return send(res, 200, result.data);
      }
    }

    // Create new record
    const result = await pbCreate("recipes", { ...fields, id: id || undefined, user: user.id }, token);
    if (!result.ok) return send(res, 500, { error: "Create failed", detail: result.data });
    return send(res, 200, result.data);
  }

  // ── DELETE /api/recipes?id=xxx ────────────────────────────────────────────
  if (req.method === "DELETE") {
    const id = new URL(req.url, "http://x").searchParams.get("id");
    if (!id) return send(res, 400, { error: "Missing id" });

    // Verify ownership before delete
    const existing = await pbFirst("recipes", `id="${id}" && user="${user.id}"`, token);
    if (!existing) return send(res, 404, { error: "Not found" });

    await pbDelete("recipes", id, token);
    return send(res, 200, { success: true });
  }

  return send(res, 405, { error: "Method Not Allowed" });
};

function send(res, status, body) {
  res.writeHead(status, CORS);
  res.end(JSON.stringify(body));
}
