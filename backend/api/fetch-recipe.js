// backend/api/fetch-recipe.js
const { getUserFromRequest, send } = require("./_pb-helper");

module.exports = async function fetchRecipeHandler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") return send(res, 200, {});

  const auth = await getUserFromRequest(req);
  if (!auth) return send(res, 401, { error: "Unauthorized" });

  if (req.method === "POST") {
    const { url } = req.body || {};
    if (!url) return send(res, 400, { error: "URL is required" });

    try {
      // Use native fetch (available in Node 18+) or node-fetch
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) throw new Error(`Target site returned ${response.status}`);
      const html = await response.text();

      // Basic extraction logic
      const result = {
        url,
        name: "",
        ingredients: [],
        steps: [],
        image_url: null,
        servings: 4
      };

      // 1. Try JSON-LD (Standard for recipe blogs)
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
      if (jsonLdMatch) {
        for (const script of jsonLdMatch) {
          try {
            const raw = script.replace(/<script[^>]*>|<\/script>/gi, '');
            let data = JSON.parse(raw);
            
            // Handle @graph or arrays
            if (data['@graph']) data = data['@graph'].find(i => i['@type'] === 'Recipe') || data;
            if (Array.isArray(data)) data = data.find(i => i['@type'] === 'Recipe') || data;

            if (data['@type'] === 'Recipe' || data['@type']?.includes('Recipe')) {
              result.name = data.name || result.name;
              result.ingredients = data.recipeIngredient || result.ingredients;
              result.steps = (data.recipeInstructions || []).map(s => s.text || s.name || s);
              result.image_url = Array.isArray(data.image) ? data.image[0] : (data.image?.url || data.image);
              break;
            }
          } catch (e) { continue; }
        }
      }

      // 2. Fallback: Title tag if name is still empty
      if (!result.name) {
        const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
        result.name = titleMatch ? titleMatch[1].split('|')[0].split('-')[0].trim() : "Unknown Recipe";
      }

      return send(res, 200, result);
    } catch (e) {
      console.error("[FetchRecipe] Scrape Error:", e.message);
      return send(res, 500, { error: "Fetch failed", message: e.message });
    }
  }

  return send(res, 405, { error: "Method Not Allowed" });
};
