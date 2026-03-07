// backend/api/recipe-details.js
// Replaces: netlify/functions/recipe-details.js

const {
  pbList, pbCreate, pbUpdate, pbDelete, pbFirst,
  getUserFromRequest, CORS,
} = require("./_pb-helper");

module.exports = async function recipeDetailsHandler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, {});

  const auth = await getUserFromRequest(req);
  if (!auth) return send(res, 401, { error: "Unauthorized" });
  const { user, token } = auth;

  const urlParams = new URL(req.url, "http://x").searchParams;

  // ── GET /api/recipe-details?id=xxx ────────────────────────────────────────
  if (req.method === "GET") {
    const id = urlParams.get("id");
    const filter = id
      ? `recipe="${id}" && user="${user.id}"`
      : `user="${user.id}"`;

    const { ok, data } = await pbList("recipe_details", { filter }, token);
    if (!ok) return send(res, 500, { error: "DB error" });
    return send(res, 200, data?.items || []);
  }

  // ── POST /api/recipe-details (upsert) ─────────────────────────────────────
  if (req.method === "POST") {
    const { recipe_id, ingredients, steps, servings } = req.body || {};
    if (!recipe_id || !ingredients || !steps) {
      return send(res, 400, { error: "Missing fields: recipe_id, ingredients, steps" });
    }

    // Check if record already exists for this recipe + user
    const existing = await pbFirst(
      "recipe_details",
      `recipe="${recipe_id}" && user="${user.id}"`,
      token
    );

    const payload = {
      recipe:      recipe_id,
      user:        user.id,
      ingredients: JSON.stringify(ingredients), // PocketBase stores as JSON field
      steps:       JSON.stringify(steps),
      servings:    servings || 4,
    };

    let result;
    if (existing) {
      result = await pbUpdate("recipe_details", existing.id, payload, token);
    } else {
      result = await pbCreate("recipe_details", payload, token);
    }

    if (!result.ok) return send(res, 500, { error: "Save failed", detail: result.data });
    return send(res, 200, { success: true });
  }

  // ── DELETE /api/recipe-details?id=xxx ─────────────────────────────────────
  if (req.method === "DELETE") {
    const id = urlParams.get("id");
    if (!id) return send(res, 400, { error: "Missing id" });

    const existing = await pbFirst(
      "recipe_details",
      `recipe="${id}" && user="${user.id}"`,
      token
    );
    if (!existing) return send(res, 404, { error: "Not found" });

    await pbDelete("recipe_details", existing.id, token);
    return send(res, 200, { success: true });
  }

  return send(res, 405, { error: "Method Not Allowed" });
};

function send(res, status, body) {
  res.writeHead(status, CORS);
  res.end(JSON.stringify(body));
}
