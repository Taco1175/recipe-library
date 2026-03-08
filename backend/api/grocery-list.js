// backend/api/grocery-list.js
// Replaces: netlify/functions/grocery-list.js

const { getUserFromRequest, CORS } = require("./_pb-helper");

module.exports = async function groceryListHandler(req, res) {
  if (req.method === "OPTIONS") { res.writeHead(200, CORS); res.end(); return; }
  if (req.method !== "POST")   { res.writeHead(405, CORS); res.end("Method Not Allowed"); return; }

  const auth = await getUserFromRequest(req);
  if (!auth) { res.writeHead(401, CORS); res.end(JSON.stringify({ error: "Unauthorized" })); return; }

  const { ingredients } = req.body || {};
  if (!ingredients?.length) { res.writeHead(400, CORS); res.end(JSON.stringify({ error: "No ingredients" })); return; }

  const prompt = `Organize these grocery ingredients into store categories. Consolidate duplicates.\n\n${ingredients.map(x => `- ${x.ing} (from: ${x.recipe})`).join("\n")}\n\nReturn ONLY valid JSON (no markdown):\n{"Meat & Seafood":[{"item":"Chicken breast, ~2 lbs","recipes":["Recipe A"]}],"Produce":[...],"Dairy & Eggs":[...],"Pantry & Dry Goods":[...],"Canned & Jarred":[...],"Frozen":[...],"Condiments & Sauces":[...],"Bread & Tortillas":[...],"Spices & Seasonings":[...],"Other":[...]}\nOnly include categories with items.`;

  try {
    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4096, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await apiRes.json();
    if (data.error) { res.writeHead(500, CORS); res.end(JSON.stringify({ error: data.error.message })); return; }
    const text = data.content[0].text.replace(/^```json\n?|^```\n?|```$/gm, "").trim();
    res.writeHead(200, CORS); res.end(text);
  } catch (e) {
    res.writeHead(500, CORS); res.end(JSON.stringify({ error: e.message }));
  }
};
