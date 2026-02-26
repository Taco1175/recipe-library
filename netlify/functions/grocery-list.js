const { verifyToken, getToken } = require("./_auth-helper");

exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
  if (!verifyToken(getToken(event))) return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: "Method Not Allowed" };

  const { ingredients } = JSON.parse(event.body || "{}");
  if (!ingredients || !ingredients.length) return { statusCode: 400, headers, body: JSON.stringify({ error: "No ingredients" }) };

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  const prompt = `Organize these grocery ingredients into store categories. Consolidate duplicates intelligently (combine similar items, sum quantities where possible).

Ingredients:
${ingredients.map(x => `- ${x.ing} (from: ${x.recipe})`).join("\n")}

Return ONLY valid JSON (no markdown):
{
  "Meat & Seafood": [{"item": "Chicken breast, ~2 lbs", "recipes": ["Recipe A", "Recipe B"]}],
  "Produce": [...],
  "Dairy & Eggs": [...],
  "Pantry & Dry Goods": [...],
  "Canned & Jarred": [...],
  "Frozen": [...],
  "Condiments & Sauces": [...],
  "Bread & Tortillas": [...],
  "Spices & Seasonings": [...],
  "Other": [...]
}

Only include categories with items. Sort items within each category alphabetically.`;

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
    return { statusCode: 200, headers, body: text };
  } catch {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Parse error" }) };
  }
};
