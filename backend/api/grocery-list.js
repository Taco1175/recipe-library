// backend/api/grocery-list.js
const { pbList, getUserFromRequest, send } = require("./_pb-helper");

module.exports = async function groceryListHandler(req, res) {
  // Handle CORS preflight for Cloudflare
  if (req.method === "OPTIONS") return send(res, 200, {});

  const auth = await getUserFromRequest(req);
  if (!auth) return send(res, 401, { error: "Unauthorized" });
  const { token } = auth;

  // Expects { "recipe_ids": [1, 2, 3...] }
  if (req.method === "POST") {
    const { recipe_ids } = req.body || {};
    
    if (!Array.isArray(recipe_ids) || recipe_ids.length === 0) {
      return send(res, 200, []);
    }

    try {
      // Create a PocketBase filter string: (recipe="id1" || recipe="id2" || ...)
      const idFilter = recipe_ids.map(id => `recipe="${id}"`).join(" || ");
      
      const { ok, data } = await pbList("structured_ingredients", { 
        filter: `(${idFilter})`,
        perPage: 500 
      }, token);

      if (!ok) {
        console.error("Grocery Fetch Error:", data);
        throw new Error("Failed to fetch structured ingredients");
      }

      // Return the items array to the frontend
      return send(res, 200, data.items || []);
    } catch (e) {
      console.error("[GroceryList] Error:", e.message);
      return send(res, 500, { error: "DB error", message: e.message });
    }
  }

  return send(res, 405, { error: "Method Not Allowed" });
};
