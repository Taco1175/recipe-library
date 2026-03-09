// backend/api/fetch-recipe.js
let cheerio;
try { cheerio = require("cheerio"); } catch { /* will use regex fallback */ }
const { getUserFromRequest, send } = require("./_pb-helper");

module.exports = async function fetchRecipeHandler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, {});

  const auth = await getUserFromRequest(req);
  if (!auth) return send(res, 401, { error: "Unauthorized" });

  if (req.method !== "POST") return send(res, 405, { error: "Method Not Allowed" });

  const { url } = req.body || {};
  if (!url) return send(res, 400, { error: "URL is required" });

  try {
    let html = await fetchHTML(url);

    // If this is a wprm_print or other print URL, follow the canonical link
    // to the full recipe page which has richer structured data
    const canonical = (html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i) ||
                       html.match(/<link[^>]+href="([^"]+)\"[^>]+rel="canonical"/i))?.[1];
    if (canonical && canonical !== url && !canonical.includes("wprm_print") && !canonical.includes("/print")) {
      try { html = await fetchHTML(canonical); } catch { /* keep original */ }
    }

    const result = parseRecipe(html, url);
    return send(res, 200, result);
  } catch (e) {
    console.error("[FetchRecipe] Error:", e.message);
    return send(res, 500, { error: "Fetch failed", message: e.message });
  }
};

// ── Fetch HTML with realistic browser headers ──────────────────────────────
async function fetchHTML(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
    },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Site returned ${response.status}`);
  return response.text();
}

// ── Main parser ────────────────────────────────────────────────────────────
function parseRecipe(html, url) {
  const result = { url, name: "", ingredients: [], steps: [], image_url: null, servings: 4 };
  const $ = cheerio ? cheerio.load(html) : null;

  // Ingredients — try each strategy until we have some
  tryJsonLd(html, result);
  if (!result.ingredients.length) tryWprmJson(html, result);
  if ($) {
    if (!result.ingredients.length) tryCheerioIngredients($, result);
    if (!result.ingredients.length) tryGenericUl($, result);
  }

  // Steps — always run independently of ingredient strategy
  if ($) {
    if (!result.steps.length) tryCheerioSteps($, result);
  }
  if (!result.steps.length) tryWprmJson(html, result);
  if ($) {
    if (!result.steps.length) tryGenericOl($, result);
    if (!result.steps.length) tryPlainText($, result);
  }

  // Name fallback
  if (!result.name && $) {
    const h1 = $("h1").first().text().trim();
    if (h1) result.name = h1;
    else {
      const title = $("title").text().trim();
      if (title) result.name = title.split(/[|\-–]/)[0].trim();
    }
  }
  if (!result.name) {
    const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (m) result.name = decodeEntities(m[1]).split(/[|\-–]/)[0].trim();
  }

  // Image fallback chain: og:image → twitter:image
  if (!result.image_url && $) {
    result.image_url = $("meta[property='og:image']").attr("content")
                    || $("meta[name='og:image']").attr("content")
                    || null;
  }
  if (!result.image_url) {
    const m = html.match(/<meta[^>]+(?:property="og:image"|name="og:image")[^>]+content="([^"]+)"/i)
           || html.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property="og:image"|name="og:image")/i);
    if (m) result.image_url = m[1];
  }
  if (!result.image_url && $) {
    result.image_url = $("meta[name='twitter:image']").attr("content") || null;
  }

  return result;
}

// ── Strategy 1: JSON-LD ────────────────────────────────────────────────────
function tryJsonLd(html, result) {
  const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const s of scripts) {
    try {
      let data = JSON.parse(s[1].trim());

      // Unwrap @graph or arrays
      if (data["@graph"]) data = data["@graph"].find(isRecipe) || data;
      if (Array.isArray(data)) data = data.find(isRecipe) || {};

      if (!isRecipe(data)) continue;

      if (data.name) result.name = cleanText(data.name);

      if (Array.isArray(data.recipeIngredient) && data.recipeIngredient.length) {
        result.ingredients = data.recipeIngredient
          .map(i => cleanIngredient(typeof i === "string" ? i : (i.text || "")))
          .filter(Boolean);
      }

      if (Array.isArray(data.recipeInstructions) && data.recipeInstructions.length) {
        result.steps = flattenInstructions(data.recipeInstructions);
      }

      const img = data.image;
      if (img) {
        result.image_url = Array.isArray(img)
          ? (img[0]?.url || img[0])
          : (typeof img === "object" ? img.url : img);
        if (result.image_url) result.image_url = String(result.image_url);
      }

      const yld = data.recipeYield;
      if (yld) {
        const n = parseInt(String(Array.isArray(yld) ? yld[0] : yld).match(/\d+/)?.[0]);
        if (n) result.servings = n;
      }

      if (result.ingredients.length) return;
    } catch (e) { /* try next script */ }
  }
}

// ── Strategy 2: window.wprm_recipes JS object ──────────────────────────────
function tryWprmJson(html, result) {
  const m = html.match(/window\.wprm_recipes\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/);
  if (!m) return;
  try {
    const recipes = JSON.parse(m[1]);
    const recipe = Object.values(recipes)[0];
    if (!recipe) return;

    if (recipe.name && !result.name) result.name = cleanText(recipe.name);

    if (!result.ingredients.length && Array.isArray(recipe.ingredients)) {
      const flat = recipe.ingredients.flatMap(g =>
        Array.isArray(g.ingredients) ? g.ingredients : [g]
      );
      result.ingredients = flat.map(i => {
        const parts = [i.amount, i.unit, i.name, i.notes ? `(${i.notes.trim()})` : ""];
        return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
      }).filter(Boolean);
    }

    if (!result.steps.length && Array.isArray(recipe.instructions)) {
      const flat = recipe.instructions.flatMap(g =>
        Array.isArray(g.instructions) ? g.instructions : [g]
      );
      result.steps = flat.map(i => cleanText(i.text || "")).filter(s => s.length > 5);
    }

    if (!result.servings && recipe.servings) result.servings = parseInt(recipe.servings) || 4;
  } catch (e) { /* ignore */ }
}

// ── Strategy 3: Cheerio DOM-based ingredient parsing ──────────────────────
function tryCheerioIngredients($, result) {
  // WPRM ingredients
  const wprmItems = [];
  $(".wprm-recipe-ingredient").each((_, el) => {
    const amt   = $(el).find(".wprm-recipe-ingredient-amount").text().trim();
    const unit  = $(el).find(".wprm-recipe-ingredient-unit").text().trim();
    const name  = $(el).find(".wprm-recipe-ingredient-name").text().trim();
    const notes = $(el).find(".wprm-recipe-ingredient-notes").text().trim();
    const parts = [amt, unit, name, notes ? `(${notes})` : ""];
    const ing = parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    if (ing) wprmItems.push(ing);
  });
  if (wprmItems.length) { result.ingredients = wprmItems; return; }

  // Schema.org itemprop
  const schemaItems = [];
  $("[itemprop='recipeIngredient'], [itemprop='ingredients']").each((_, el) => {
    const text = cleanIngredient($(el).text());
    if (text) schemaItems.push(text);
  });
  if (schemaItems.length >= 2) { result.ingredients = schemaItems; return; }

  // Tasty / Mediavine / common class patterns
  const classPatterns = [
    ".tasty-recipes-ingredients li",
    ".mv-create-ingredients li",
    ".recipe-ingredients li",
    ".ingredients li",
    ".ingredient-list li",
    ".structured-ingredients li",
  ];
  for (const sel of classPatterns) {
    const items = [];
    $(sel).each((_, el) => {
      const text = cleanIngredient($(el).text());
      if (text) items.push(text);
    });
    if (items.length >= 2) { result.ingredients = items; return; }
  }
}

// ── Cheerio DOM-based step parsing ────────────────────────────────────────
function tryCheerioSteps($, result) {
  // WPRM instruction text (most reliable)
  const wprmSteps = [];
  $(".wprm-recipe-instruction-text, .wprm-recipe-instruction").each((_, el) => {
    // Avoid double-counting child elements by checking for instruction-text specifically
    if ($(el).hasClass("wprm-recipe-instruction-text") || !$(el).find(".wprm-recipe-instruction-text").length) {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text.length > 5) wprmSteps.push(text);
    }
  });
  if (wprmSteps.length) { result.steps = wprmSteps; return; }

  // Schema.org itemprop=recipeInstructions
  const schemaSteps = [];
  $("[itemprop='recipeInstructions'] [itemprop='text'], [itemprop='recipeInstructions'] li, [itemprop='step']").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length > 5) schemaSteps.push(text);
  });
  if (schemaSteps.length) { result.steps = schemaSteps; return; }

  // Tasty / Mediavine / common class patterns
  const classPatterns = [
    ".tasty-recipes-instructions li",
    ".mv-create-instructions li",
    ".recipe-instructions li",
    ".instructions li",
    ".recipe-method li",
    ".wprm-recipe-instructions li",
    ".recipe-steps li",
  ];
  for (const sel of classPatterns) {
    const items = [];
    $(sel).each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text.length > 5) items.push(text);
    });
    if (items.length >= 2) { result.steps = items; return; }
  }
}

// ── Strategy 5: Generic <ul> scored by measurement words ──────────────────
function tryGenericUl($, result) {
  const MEAS = /(\d[\d\s\/.]*\s*(cup|tsp|tbsp|teaspoon|tablespoon|pound|lb|oz|ounce|gram|g\b|clove|bunch|pinch|can|slice|strip|large|medium|small|whole))/i;
  let best = null, bestScore = 0;
  $("ul").each((_, ul) => {
    const items = [];
    $(ul).children("li").each((_, li) => {
      const text = cleanIngredient($(li).text());
      if (text.length > 2 && text.length < 200) items.push(text);
    });
    const score = items.filter(t => MEAS.test(t) || /^\d/.test(t)).length;
    if (score > bestScore && items.length >= 3) { best = items; bestScore = score; }
  });
  if (best && bestScore >= 2) result.ingredients = best;
}

// ── Steps: first large <ol> ────────────────────────────────────────────────
function tryGenericOl($, result) {
  let best = null;
  $("ol").each((_, ol) => {
    const items = [];
    $(ol).children("li").each((_, li) => {
      const text = $(li).text().replace(/\s+/g, " ").trim();
      if (text.length > 10) items.push(text);
    });
    if (!best || items.length > best.length) best = items;
  });
  if (best && best.length >= 2) result.steps = best;
}

// ── Plain text fallback ────────────────────────────────────────────────────
function tryPlainText($, result) {
  const plain = $.text().replace(/\s+/g, " ");
  const lines = plain.split(/\n|(?<=[.!?])\s+(?=[A-Z])/).map(l => l.trim()).filter(Boolean);
  let inIng = false, inStep = false;
  for (const line of lines) {
    if (/^ingredients?\s*$/i.test(line)) { inIng = true; inStep = false; continue; }
    if (/^(instructions?|directions?|method|steps?|how to make)/i.test(line)) { inIng = false; inStep = true; continue; }
    if (/^(notes?|nutrition|serving|storage|tips?|faq)/i.test(line)) { inIng = false; inStep = false; continue; }
    if (inIng) {
      const c = decodeEntities(line.replace(/^[*\-·•\d]+[.):]?\s*/, "").trim());
      if (c.length > 2 && c.length < 150) result.ingredients.push(c);
    } else if (inStep && !result.steps.length) {
      const c = line.replace(/^\d+[.):\s]+/, "").trim();
      if (c.length > 10) result.steps.push(c);
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function isRecipe(d) {
  if (!d || !d["@type"]) return false;
  const t = Array.isArray(d["@type"]) ? d["@type"].join(",") : String(d["@type"]);
  return t.includes("Recipe");
}

function flattenInstructions(instructions) {
  const steps = [];
  for (const s of instructions) {
    if (typeof s === "string") { const t = cleanText(s); if (t.length > 5) steps.push(t); }
    else if (s["@type"] === "HowToSection" && Array.isArray(s.itemListElement)) {
      steps.push(...flattenInstructions(s.itemListElement));
    } else {
      const t = cleanText(s.text || s.name || "");
      if (t.length > 5) steps.push(t);
    }
  }
  return steps;
}

function cleanText(str) {
  return decodeEntities(String(str || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function cleanIngredient(str) {
  return decodeEntities(
    String(str || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  ).replace(/^[*\-·•]\s*/, "").trim();
}

function decodeEntities(s) {
  return String(s || "")
    .replace(/&frac12;/g, "½").replace(/&frac14;/g, "¼").replace(/&frac34;/g, "¾")
    .replace(/&frac13;/g, "⅓").replace(/&frac23;/g, "⅔").replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
