// backend/api/fetch-recipe.js
const { getUserFromRequest, send } = require("./_pb-helper");

module.exports = async function fetchRecipeHandler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, {});

  const auth = await getUserFromRequest(req);
  if (!auth) return send(res, 401, { error: "Unauthorized" });

  if (req.method !== "POST") return send(res, 405, { error: "Method Not Allowed" });

  const { url } = req.body || {};
  if (!url) return send(res, 400, { error: "URL is required" });

  try {
    const html = await fetchHTML(url);
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

// ── Main parser — tries strategies in order ────────────────────────────────
function parseRecipe(html, url) {
  const result = { url, name: "", ingredients: [], steps: [], image_url: null, servings: 4 };

  // 1. JSON-LD (most reliable when present)
  tryJsonLd(html, result);

  // 2. WPRM embedded JS object (RecipeTin Eats, many WP sites)
  if (!result.ingredients.length) tryWprmJson(html, result);

  // 3. WPRM HTML classes
  if (!result.ingredients.length) tryWprmHtml(html, result);

  // 4. Tasty / Mediavine / generic schema HTML classes
  if (!result.ingredients.length) trySchemaHtml(html, result);

  // 5. Generic <ul> scored by measurement words
  if (!result.ingredients.length) tryGenericUl(html, result);

  // 6. Plain-text section fallback
  if (!result.ingredients.length) tryPlainText(html, result);

  // Steps fallback: first large <ol>
  if (!result.steps.length) tryGenericOl(html, result);

  // Name fallback
  if (!result.name) {
    const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1) result.name = clean(h1[1]);
    else {
      const title = html.match(/<title>([^<]+)<\/title>/i);
      if (title) result.name = clean(title[1].split(/[|\-–]/)[0]);
    }
  }

  // Image fallback chain: og:image → twitter:image
  if (!result.image_url) {
    const og = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
             || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
    if (og) result.image_url = og[1];
  }
  if (!result.image_url) {
    const tw = html.match(/<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i);
    if (tw) result.image_url = tw[1];
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

      if (data.name) result.name = clean(data.name);

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

    if (recipe.name && !result.name) result.name = clean(recipe.name);

    if (Array.isArray(recipe.ingredients)) {
      // WPRM ingredients can be grouped
      const flat = recipe.ingredients.flatMap(g =>
        Array.isArray(g.ingredients) ? g.ingredients : [g]
      );
      result.ingredients = flat.map(i => {
        const parts = [i.amount, i.unit, i.name, i.notes ? `(${i.notes.trim()})` : ""];
        return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
      }).filter(Boolean);
    }

    if (Array.isArray(recipe.instructions)) {
      const flat = recipe.instructions.flatMap(g =>
        Array.isArray(g.instructions) ? g.instructions : [g]
      );
      result.steps = flat.map(i => clean(i.text || "")).filter(s => s.length > 5);
    }

    if (!result.servings && recipe.servings) result.servings = parseInt(recipe.servings) || 4;
  } catch (e) { /* ignore */ }
}

// ── Strategy 3: WPRM HTML class scraping ──────────────────────────────────
function tryWprmHtml(html, result) {
  const blocks = [...html.matchAll(/class="wprm-recipe-ingredient[\s"][^>]*>([\s\S]*?)<\/li>/g)];
  if (!blocks.length) return;
  result.ingredients = blocks.map(m => {
    const amt   = (m[1].match(/wprm-recipe-ingredient-amount[^>]*>([^<]+)/) || [])[1] || "";
    const unit  = (m[1].match(/wprm-recipe-ingredient-unit[^>]*>([^<]+)/)   || [])[1] || "";
    const name  = (m[1].match(/wprm-recipe-ingredient-name[^>]*>([^<(]+)/)  || [])[1] || "";
    const notes = (m[1].match(/wprm-recipe-ingredient-notes[^>]*>([^<]+)/)  || [])[1] || "";
    return [amt, unit, name.trim(), notes ? `(${notes.trim()})` : ""]
      .filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  }).map(decodeEntities).filter(Boolean);
}

// ── Strategy 4: Generic schema HTML class patterns ─────────────────────────
function trySchemaHtml(html, result) {
  // Covers Tasty, Mediavine Create, Delicious Recipes, etc.
  const patterns = [
    /class="[^"]*ingredient[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
    /itemprop="recipeIngredient"[^>]*>([\s\S]*?)<\//gi,
  ];
  for (const pat of patterns) {
    const matches = [...html.matchAll(pat)];
    if (matches.length >= 3) {
      result.ingredients = matches
        .map(m => cleanIngredient(m[1]))
        .filter(Boolean);
      return;
    }
  }
}

// ── Strategy 5: Generic <ul> scored by measurement words ──────────────────
function tryGenericUl(html, result) {
  const MEAS = /(\d[\d\s\/.]*\s*(cup|tsp|tbsp|teaspoon|tablespoon|pound|lb|oz|ounce|gram|g\b|clove|bunch|pinch|can|slice|strip|large|medium|small|whole))/i;
  const allUls = [...html.matchAll(/<ul[^>]*>([\s\S]*?)<\/ul>/gi)];
  let best = null, bestScore = 0;
  for (const ul of allUls) {
    const items = [...ul[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
      .map(m => cleanIngredient(m[1])).filter(t => t.length > 2 && t.length < 200);
    const score = items.filter(t => MEAS.test(t) || /^\d/.test(t)).length;
    if (score > bestScore && items.length >= 3) { best = items; bestScore = score; }
  }
  if (best && bestScore >= 2) result.ingredients = best;
}

// ── Strategy 6: Plain-text section fallback ───────────────────────────────
function tryPlainText(html, result) {
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
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

// ── Steps: first large <ol> ────────────────────────────────────────────────
function tryGenericOl(html, result) {
  const allOls = [...html.matchAll(/<ol[^>]*>([\s\S]*?)<\/ol>/gi)];
  let best = null;
  for (const ol of allOls) {
    const items = [...ol[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
      .map(m => clean(m[1])).filter(t => t.length > 10);
    if (!best || items.length > best.length) best = items;
  }
  if (best && best.length >= 2) result.steps = best;
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
    if (typeof s === "string") { const t = clean(s); if (t.length > 5) steps.push(t); }
    else if (s["@type"] === "HowToSection" && Array.isArray(s.itemListElement)) {
      // Recurse into sections
      steps.push(...flattenInstructions(s.itemListElement));
    } else {
      const t = clean(s.text || s.name || "");
      if (t.length > 5) steps.push(t);
    }
  }
  return steps;
}

function clean(str) {
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
