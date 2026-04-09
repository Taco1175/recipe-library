// backend/api/fetch-social-recipe.js
// Extracts recipes from Instagram/Facebook posts via oEmbed + Claude AI parsing.
// Also accepts raw text (manual paste fallback) when no URL is provided.

const { getUserFromRequest, send } = require("./_pb-helper");

const OEMBED_ENDPOINTS = {
  instagram: "https://api.instagram.com/oembed/?url=",
  facebook: "https://www.facebook.com/plugins/post/oembed.json/?url=",
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

function detectPlatform(url) {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("facebook.com") || host.includes("fb.watch") || host.includes("fb.com")) return "facebook";
  } catch {}
  return null;
}

async function getCaption(url, platform) {
  // 1. Try oEmbed
  const oembedUrl = OEMBED_ENDPOINTS[platform] + encodeURIComponent(url);
  try {
    const res = await fetch(oembedUrl, { headers: { "User-Agent": UA } });
    if (res.ok) {
      const data = await res.json();
      const caption = data.title || "";
      const thumbnail = data.thumbnail_url || null;
      const author = data.author_name || "";
      if (caption) return { caption, thumbnail, author, method: "oembed" };
    }
  } catch {}

  // 2. Fallback: direct page fetch + og:description
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) {
      const html = await res.text();
      const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
      const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i);
      const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
      const caption = ogDesc ? ogDesc[1] : ogTitle ? ogTitle[1] : "";
      const thumbnail = ogImage ? ogImage[1] : null;
      if (caption) return { caption, thumbnail, author: "", method: "og-meta" };
    }
  } catch {}

  return { caption: "", thumbnail: null, author: "", method: "none" };
}

async function parseRecipeWithClaude(text) {
  const prompt = `You are a recipe extraction assistant. Given this social media post text, extract the recipe into structured JSON.

Post text:
"""
${text}
"""

Return ONLY valid JSON (no markdown code blocks):
{
  "name": "Recipe Name",
  "ingredients": ["1 cup flour", "2 eggs"],
  "steps": ["Preheat oven to 350F", "Mix dry ingredients"],
  "servings": 4,
  "confidence": "high",
  "linked_url": null
}

Rules:
- Strip hashtags, emojis, and @mentions from ingredient and step text
- Convert informal measurements ("a handful of", "some") to approximate standard measurements
- If the post contains a link to a full recipe blog/website, include it as linked_url
- confidence: "high" if full recipe with ingredients+steps found, "medium" if partial, "low" if very incomplete, "none" if no recipe content at all
- If no recipe is found, return {"confidence":"none","name":"","ingredients":[],"steps":[],"servings":4,"linked_url":null}
- servings: extract if mentioned, otherwise default to 4`;

  const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await apiRes.json();
  if (data.error) throw new Error(data.error.message);

  const raw = data.content[0].text.replace(/^```json\n?|^```\n?|```$/gm, "").trim();
  return JSON.parse(raw);
}

// Reuse JSON-LD extraction from fetch-recipe.js for following linked URLs
async function fetchLinkedRecipe(linkedUrl) {
  try {
    const res = await fetch(linkedUrl, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const html = await res.text();

    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
    if (!jsonLdMatch) return null;

    for (const script of jsonLdMatch) {
      try {
        const raw = script.replace(/<script[^>]*>|<\/script>/gi, "");
        let d = JSON.parse(raw);
        if (d["@graph"]) d = d["@graph"].find(i => i["@type"] === "Recipe") || d;
        if (Array.isArray(d)) d = d.find(i => i["@type"] === "Recipe") || d;

        if (d["@type"] === "Recipe" || d["@type"]?.includes("Recipe")) {
          return {
            name: d.name || "",
            ingredients: d.recipeIngredient || [],
            steps: (d.recipeInstructions || []).map(s => s.text || s.name || s),
            image_url: Array.isArray(d.image) ? d.image[0] : (d.image?.url || d.image || null),
            servings: parseInt(d.recipeYield) || 4,
          };
        }
      } catch { continue; }
    }
  } catch {}
  return null;
}

module.exports = async function fetchSocialRecipeHandler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, {});
  if (req.method !== "POST") return send(res, 405, { error: "Method Not Allowed" });

  const auth = await getUserFromRequest(req);
  if (!auth) return send(res, 401, { error: "Unauthorized" });

  const { url, text } = req.body || {};

  // Manual text paste mode — skip oEmbed, go straight to Claude
  if (text && !url) {
    try {
      const parsed = await parseRecipeWithClaude(text);
      return send(res, 200, {
        url: null,
        name: parsed.name || "",
        ingredients: parsed.ingredients || [],
        steps: parsed.steps || [],
        image_url: null,
        servings: parsed.servings || 4,
        source_type: "manual",
        confidence: parsed.confidence || "medium",
      });
    } catch (e) {
      return send(res, 500, { error: "AI parsing failed", message: e.message });
    }
  }

  if (!url) return send(res, 400, { error: "URL or text is required" });

  const platform = detectPlatform(url);
  if (!platform) return send(res, 400, { error: "URL must be from Instagram or Facebook" });

  try {
    // Step 1: Get caption from social media post
    const { caption, thumbnail, author, method } = await getCaption(url, platform);

    if (!caption) {
      return send(res, 200, {
        url, name: "", ingredients: [], steps: [],
        image_url: thumbnail, servings: 4,
        source_type: platform, confidence: "none",
        raw_caption: "",
        message: "Could not extract caption from post. Try pasting the recipe text manually.",
      });
    }

    // Step 2: Parse recipe from caption with Claude
    const parsed = await parseRecipeWithClaude(caption);

    // Step 3: If low confidence and a linked URL was found, try fetching it
    if ((parsed.confidence === "low" || parsed.confidence === "none") && parsed.linked_url) {
      const blogRecipe = await fetchLinkedRecipe(parsed.linked_url);
      if (blogRecipe && blogRecipe.ingredients?.length) {
        return send(res, 200, {
          url,
          name: blogRecipe.name,
          ingredients: blogRecipe.ingredients,
          steps: blogRecipe.steps,
          image_url: blogRecipe.image_url || thumbnail,
          servings: blogRecipe.servings || 4,
          source_type: platform,
          confidence: "high",
          linked_url: parsed.linked_url,
        });
      }
    }

    return send(res, 200, {
      url,
      name: parsed.name || "",
      ingredients: parsed.ingredients || [],
      steps: parsed.steps || [],
      image_url: thumbnail,
      servings: parsed.servings || 4,
      source_type: platform,
      confidence: parsed.confidence || "medium",
      raw_caption: caption,
      linked_url: parsed.linked_url || null,
    });
  } catch (e) {
    console.error("[FetchSocialRecipe] Error:", e.message);
    return send(res, 500, { error: "Social recipe fetch failed", message: e.message });
  }
};
