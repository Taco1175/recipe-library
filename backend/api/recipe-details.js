// backend/api/recipe-details.js
const { pbList, pbCreate, pbUpdate, pbFirst, getUserFromRequest, send } = require("./_pb-helper");

module.exports = async function recipeDetailsHandler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") return send(res, 200, {});

  const auth = await getUserFromRequest(req);
  if (!auth) return send(res, 401, { error: "Unauthorized" });
  const { user, token } = auth;

  // ── GET /api/recipe-details ────────────────────────────────────────────────
  // Returns all recipe details accessible to the user
  if (req.method === "GET") {
    const { ok: detOk, data: detData } = await pbList("recipe_details", { perPage: 500 }, token);
    
    if (!detOk) {
      console.error("Details Fetch Error:", detData);
      return send(res, 500, { error: "Failed to fetch details", detail: detData });
    }

    // Return the items array so index.html can map them to the details object
    return send(res, 200, { items: detData.items || [] });
  }

  // ── POST /api/recipe-details ───────────────────────────────────────────────
  // Upsert (Create or Update) recipe details
  if (req.method === "POST") {
    const body = req.body || {};
    const { recipe_id, ingredients, steps, servings } = body;

    if (!recipe_id) return send(res, 400, { error: "Missing recipe_id" });

    // 1. Check if details already exist for this recipe
    // Note: In your PB schema, ensure the relation field is named 'recipe'
    const existing = await pbFirst("recipe_details", `recipe="${recipe_id}"`, token);

    const payload = {
      recipe: recipe_id,
      user: user.id,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      steps: Array.isArray(steps) ? steps : [],
      servings: servings || 4
    };

    if (existing) {
      // 2. Update existing record
      const result = await pbUpdate("recipe_details", existing.id, payload, token);
      if (!result.ok) return send(res, 500, { error: "Update failed", detail: result.data });
      return send(res, 200, result.data);
    } else {
      // 3. Create new record
      const result = await pbCreate("recipe_details", payload, token);
      if (!result.ok) return send(res, 500, { error: "Create failed", detail: result.data });
      return send(res, 200, result.data);
    }
  }

  return send(res, 405, { error: "Method Not Allowed" });
};
