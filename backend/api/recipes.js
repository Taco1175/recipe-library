const {
  pbList, pbCreate, pbUpdate, pbDelete, pbFirst,
  getUserFromRequest, unauthorized, badRequest, serverError, ok, CORS, pbEscape,
} = require("./_pb-helper");

module.exports = async function recipesHandler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, {});

  const auth = await getUserFromRequest(req);
  if (!auth) return send(res, 401, { error: "Unauthorized" });
  const { user, token } = auth;

  // ── GET /api/recipes ──────────────────────────────────────────────────────
  if (req.method === "GET") {
    // 1. Fetch user's own recipes
    const { ok: recOk, data: recData } = await pbList(
      "recipes",
      {},
      token
    );

    if (!recOk) {
      console.error("PB List Error:", recData);
      return send(res, 500, { error: "DB error", detail: recData });
    }

    // 2. Fetch shared recipes
    const { data: shareData } = await pbList(
      "library_shares",
      { filter: `shared_with="${pbEscape(user.id)}"` },
      token
    );
    
    const shares = shareData?.items || [];
    const ownerIds = [...new Set(shares.map(s => s.owner))];
    let sharedRecipes = [];

    for (const ownerId of ownerIds) {
      const ownerShare = shares.find(s => s.owner === ownerId);
      const { data: owned } = await pbList(
        "recipes",
        { filter: `user="${pbEscape(ownerId)}"` },
        token
      );
      
      const ownerEmail = ownerShare?.owner_email || "Shared";
      const ownerName = ownerEmail.split("@")[0];
      
      (owned?.items || []).forEach(r => {
        sharedRecipes.push({ ...r, _owner_label: ownerName + "'s" });
      });
    }

    // 3. Combine and wrap in an 'items' object for frontend compatibility
    const allRecipes = [...(recData?.items || []), ...sharedRecipes];
    return send(res, 200, { items: allRecipes, totalItems: allRecipes.length });
  }

  // ── POST /api/recipes ─────────────────────────────────────────────────────
  if (req.method === "POST") {
    const body = req.body || {};
    const { id, ...fields } = body;

    // Partial update
    if (id && !fields.name) {
      const result = await pbUpdate("recipes", id, fields, token);
      if (!result.ok) return send(res, 500, { error: "Update failed" });
      return send(res, 200, { success: true });
    }

    // Full upsert
    if (id) {
      const existing = await pbFirst("recipes", `id="${pbEscape(id)}" && user="${pbEscape(user.id)}"`, token);
      if (existing) {
        const result = await pbUpdate("recipes", id, { ...fields, user: user.id }, token);
        if (!result.ok) return send(res, 500, { error: "Update failed", detail: result.data });
        return send(res, 200, result.data);
      }
    }

    // Create new
    const result = await pbCreate("recipes", { ...fields, id: id || undefined, user: user.id }, token);
    if (!result.ok) return send(res, 500, { error: "Create failed", detail: result.data });
    return send(res, 200, result.data);
  }

  // ── DELETE /api/recipes?id=xxx ────────────────────────────────────────────
  if (req.method === "DELETE") {
    const id = new URL(req.url, "http://x").searchParams.get("id");
    if (!id) return send(res, 400, { error: "Missing id" });

    const existing = await pbFirst("recipes", `id="${pbEscape(id)}" && user="${pbEscape(user.id)}"`, token);
    if (!existing) return send(res, 404, { error: "Not found" });

    await pbDelete("recipes", id, token);
    return send(res, 200, { success: true });
  }

  return send(res, 405, { error: "Method Not Allowed" });
};

function send(res, status, body) {
  res.writeHead(status, { 
    ...CORS, 
    "Content-Type": "application/json" 
  });
  res.end(JSON.stringify(body));
}
