// backend/api/match-ingredients.js
// Replaces: netlify/functions/match-ingredients.js

const { getUserFromRequest, CORS } = require("./_pb-helper");

module.exports = async function matchIngredientsHandler(req, res) {
  if (req.method === "OPTIONS") { res.writeHead(200, CORS); res.end(); return; }
  if (req.method !== "POST")   { res.writeHead(405, CORS); res.end("Method Not Allowed"); return; }

  const auth = await getUserFromRequest(req);
  if (!auth) { res.writeHead(401, CORS); res.end(JSON.stringify({ error: "Unauthorized" })); return; }

  const { userIngredients, recipes } = req.body || {};
  if (!userIngredients || !recipes) { res.writeHead(400, CORS); res.end(JSON.stringify({ error: "Missing fields" })); return; }

  const recipeList = recipes.map(r => `ID:${r.id} | ${r.name} | Ingredients: ${r.ingredients ? r.ingredients.join(", ") : "(no details)"}`).join("\n");
  const prompt = `You are a meal planning assistant. User has these ingredients: ${userIngredients}\n\nRecipes:\n${recipeList}\n\nReturn ONLY valid JSON (no markdown):\n{"results":[{"id":17,"match":"full","score":95,"note":"You have everything!"},{"id":21,"match":"partial","score":60,"note":"Missing: beef chuck, chipotle peppers"}]}\nmatch: full(>=85%), partial(40-84%), none(<40%). score:0-100. Only include score>20. Sort by score desc.`;

  try {
    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4096, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await apiRes.json();
    if (data.error) { res.writeHead(500, CORS); res.end(JSON.stringify({ error: data.error.message })); return; }
    const text = data.content[0].text.replace(/^```json\n?|^```\n?|```$/gm, "").trim();
    res.writeHead(200, CORS); res.end(JSON.stringify(JSON.parse(text)));
  } catch (e) {
    res.writeHead(500, CORS); res.end(JSON.stringify({ error: e.message }));
  }
};
