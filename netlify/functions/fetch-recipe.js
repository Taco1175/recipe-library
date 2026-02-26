const { verifyToken, getToken } = require("./_auth-helper");

exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
  if (!verifyToken(getToken(event))) return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: "Method Not Allowed" };

  const { url, mode } = JSON.parse(event.body || "{}");
  if (!url) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing url" }) };

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  const prompt = mode === "details"
    ? `You are a recipe parser. Visit and extract the recipe at: ${url}

Return ONLY valid JSON (no markdown, no fences):
{
  "ingredients": ["2 lbs chicken breast", "3 cloves garlic, minced", ...],
  "steps": ["Preheat oven to 375°F.", "Season chicken with salt and pepper.", ...]
}

Get ALL ingredients with exact quantities. Get ALL steps as clear, complete sentences.`

    : `You are a recipe parser. Visit and extract info from: ${url}

Return ONLY valid JSON (no markdown, no fences):
{
  "name": "Recipe Name",
  "source": "Blog or Website Name",
  "protein": "main protein (e.g. Chicken, Beef, Eggs, Vegetarian, Turkey, Pork, Shrimp)",
  "method": "cooking method — use ONLY one of: Slow Cooker, Oven, Stovetop, Air Fryer, No Cook, Microwave, or combos like Stovetop / Oven",
  "cost": "$X-Y",
  "ingredients": ["2 lbs chicken breast", "3 cloves garlic", ...],
  "steps": ["Preheat oven to 375°F.", "Season chicken.", ...]
}

For cost: estimate total ingredient cost shopping at Aldi (US budget grocery store).`;

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
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Could not parse recipe", raw: text }) };
  }
};
