
exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: "Method Not Allowed" };

  const { userIngredients, recipes } = JSON.parse(event.body || "{}");
  if (!userIngredients || !recipes) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing fields" }) };

  const recipeList = recipes.map(r => `ID:${r.id} | ${r.name} | Ingredients: ${r.ingredients ? r.ingredients.join(", ") : "(no details)"}`).join("\n");
  const prompt = `You are a meal planning assistant. User has these ingredients: ${userIngredients}\n\nRecipes:\n${recipeList}\n\nReturn ONLY valid JSON (no markdown):\n{"results":[{"id":17,"match":"full","score":95,"note":"You have everything!"},{"id":21,"match":"partial","score":60,"note":"Missing: beef chuck, chipotle peppers"}]}\nmatch: full(>=85%), partial(40-84%), none(<40%). score:0-100. Only include score>20. Sort by score desc.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4096, messages: [{ role: "user", content: prompt }] }),
  });

  const data = await res.json();
  if (data.error) return { statusCode: 500, headers, body: JSON.stringify({ error: data.error.message }) };
  const text = data.content[0].text.replace(/^```json\n?|^```\n?|```$/gm, "").trim();
  try { return { statusCode: 200, headers, body: JSON.stringify(JSON.parse(text)) }; }
  catch { return { statusCode: 500, headers, body: JSON.stringify({ error: "Parse error" }) }; }
};