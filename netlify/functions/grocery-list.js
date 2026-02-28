
const { getUserFromRequest, unauthorized, CORS } = require("./_supabase-helper");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };
  const auth = await getUserFromRequest(event);
  if (!auth) return unauthorized();
  const headers = CORS;

  const { ingredients } = JSON.parse(event.body || "{}");
  if (!ingredients?.length) return { statusCode: 400, headers, body: JSON.stringify({ error: "No ingredients" }) };

  const prompt = `Organize these grocery ingredients into store categories. Consolidate duplicates.\n\n${ingredients.map(x => `- ${x.ing} (from: ${x.recipe})`).join("\n")}\n\nReturn ONLY valid JSON (no markdown):\n{"Meat & Seafood":[{"item":"Chicken breast, ~2 lbs","recipes":["Recipe A"]}],"Produce":[...],"Dairy & Eggs":[...],"Pantry & Dry Goods":[...],"Canned & Jarred":[...],"Frozen":[...],"Condiments & Sauces":[...],"Bread & Tortillas":[...],"Spices & Seasonings":[...],"Other":[...]}\nOnly include categories with items.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4096, messages: [{ role: "user", content: prompt }] }),
  });

  const data = await res.json();
  if (data.error) return { statusCode: 500, headers, body: JSON.stringify({ error: data.error.message }) };
  const text = data.content[0].text.replace(/^```json\n?|^```\n?|```$/gm, "").trim();
  try { return { statusCode: 200, headers, body: text }; }
  catch { return { statusCode: 500, headers, body: JSON.stringify({ error: "Parse error" }) }; }
};