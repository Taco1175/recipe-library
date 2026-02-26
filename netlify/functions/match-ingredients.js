const { verifyToken, getToken } = require("./_auth-helper");

exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
  if (!verifyToken(getToken(event))) return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: "Method Not Allowed" };

  const { userIngredients, recipes } = JSON.parse(event.body || "{}");
  if (!userIngredients || !recipes) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing fields" }) };

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  // Build a compact recipe list for the prompt
  const recipeList = recipes.map(r => {
    const ings = r.ingredients ? r.ingredients.join(", ") : "(no details saved)";
    return `ID:${r.id} | ${r.name} | Ingredients: ${ings}`;
  }).join("\n");

  const prompt = `You are a meal planning assistant. The user has these ingredients available:
${userIngredients}

Here are the recipes to evaluate:
${recipeList}

For each recipe, determine how well the user can make it with what they have.
Return ONLY valid JSON (no markdown):
{
  "results": [
    {
      "id": 17,
      "match": "full",
      "score": 95,
      "note": "You have everything needed!"
    },
    {
      "id": 21,
      "match": "partial",
      "score": 60,
      "note": "Missing: beef chuck roast, chipotle peppers"
    },
    {
      "id": 5,
      "match": "none",
      "score": 10,
      "note": "Missing most ingredients"
    }
  ]
}

match values: "full" (≥85% ingredients present), "partial" (40-84%), "none" (<40%).
score: 0-100 integer.
note: brief, helpful, specific about what's missing if partial/none.
Only include recipes that scored above 20 — skip clearly impossible ones.
Sort by score descending.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  if (data.error) return { statusCode: 500, headers, body: JSON.stringify({ error: data.error.message }) };

  const text = data.content[0].text.replace(/^```json\n?|^```\n?|```$/gm, "").trim();
  try {
    const parsed = JSON.parse(text);
    return { statusCode: 200, headers, body: JSON.stringify(parsed) };
  } catch {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Parse error", raw: text }) };
  }
};
