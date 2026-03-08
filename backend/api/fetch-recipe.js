// backend/api/fetch-recipe.js
// Replaces: netlify/functions/fetch-recipe.js
// Same parser logic — only the handler wrapper changes.

const https = require("https");
const http  = require("http");
const { getUserFromRequest, CORS } = require("./_pb-helper");

// ── fetchUrl (with Cloudflare detection) ──────────────────────────────────
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        if (
          res.statusCode === 403 ||
          (res.statusCode === 200 && (
            data.includes("Enable JavaScript and cookies to continue") ||
            data.includes("cf-browser-verification") ||
            data.includes("cf_chl_opt") ||
            data.includes("Checking your browser")
          ))
        ) {
          return reject(new Error("CLOUDFLARE_BLOCKED"));
        }
        resolve(data);
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

// ── Parsers (identical to Netlify function) ───────────────────────────────
function parseJsonLd(html) {
  const result = { name: null, ingredients: [], steps: [] };
  const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const s of scripts) {
    try {
      let json = JSON.parse(s[1]);
      const candidates = [];
      if (Array.isArray(json)) { json.flatMap(j => j["@graph"] ? j["@graph"] : [j]).forEach(j => candidates.push(j)); }
      else if (json["@graph"]) { json["@graph"].forEach(j => candidates.push(j)); }
      else { candidates.push(json); }
      for (const r of candidates) {
        const type = Array.isArray(r["@type"]) ? r["@type"] : [r["@type"]];
        if (!type.some(t => t === "Recipe")) continue;
        if (r.name) result.name = r.name;
        if (r.recipeIngredient?.length) result.ingredients = r.recipeIngredient.map(i => String(i).trim());
        if (r.recipeInstructions?.length) {
          result.steps = r.recipeInstructions.flatMap(s => {
            if (typeof s === "string") return [s.trim()];
            if (s["@type"] === "HowToStep") return [s.text?.trim() || s.name?.trim()].filter(Boolean);
            if (s["@type"] === "HowToSection" && Array.isArray(s.itemListElement)) {
              return s.itemListElement.map(sub => sub.text?.trim() || sub.name?.trim()).filter(Boolean);
            }
            return [];
          });
        }
        if (r.recipeYield) {
          const num = parseInt(String(r.recipeYield).match(/\d+/)?.[0]);
          if (num) result.servings = num;
        }
        if (result.ingredients.length) return result;
      }
    } catch {}
  }
  return result;
}

function parseWPRM(html) {
  const result = { name: null, ingredients: [], steps: [] };
  const nameM = html.match(/class="wprm-recipe-name[^"]*"[^>]*>([^<]+)</);
  if (nameM) result.name = nameM[1].trim();
  const ingBlocks = [...html.matchAll(/class="wprm-recipe-ingredient "[^>]*>([\s\S]*?)<\/li>/g)];
  ingBlocks.forEach(m => {
    const amt   = (m[1].match(/wprm-recipe-ingredient-amount[^>]*>([^<]+)/) || [])[1] || "";
    const unit  = (m[1].match(/wprm-recipe-ingredient-unit[^>]*>([^<]+)/)   || [])[1] || "";
    const name  = (m[1].match(/wprm-recipe-ingredient-name[^>]*>([^<]+)/)   || [])[1] || "";
    const notes = (m[1].match(/wprm-recipe-ingredient-notes[^>]*>([^<]+)/)  || [])[1] || "";
    const full  = [amt, unit, name, notes ? `(${notes})` : ""].filter(Boolean).join(" ").trim();
    if (full) result.ingredients.push(full);
  });
  const stepContainers = [...html.matchAll(/class="wprm-recipe-instruction-text"[^>]*>([\s\S]*?)<\/(?:p|div|span)>/g)];
  stepContainers.forEach(m => {
    const text = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length > 5) result.steps.push(text);
  });
  if (!result.steps.length) {
    const stepRows = [...html.matchAll(/class="wprm-recipe-step[^"]*"[^>]*>([\s\S]*?)<\/li>/g)];
    stepRows.forEach(m => {
      const text = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text.length > 5) result.steps.push(text);
    });
  }
  return result;
}

function parseTasty(html) {
  const result = { name: null, ingredients: [], steps: [] };
  const nameM = html.match(/class="tasty-recipes-title[^"]*"[^>]*>([^<]+)</);
  if (nameM) result.name = nameM[1].trim();
  const ingSection = html.match(/class="tasty-recipes-ingredients[^"]*"[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/);
  if (ingSection) {
    [...ingSection[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].forEach(m => {
      const t = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (t.length > 2) result.ingredients.push(t);
    });
  }
  const stpSection = html.match(/class="tasty-recipes-instructions[^"]*"[\s\S]*?<ol[^>]*>([\s\S]*?)<\/ol>/);
  if (stpSection) {
    [...stpSection[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].forEach(m => {
      const t = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (t.length > 5) result.steps.push(t);
    });
  }
  return result;
}

function parseGeneric(html) {
  const result = { name: null, ingredients: [], steps: [] };
  const h = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  if (h) result.name = h[1].trim();
  const ingSection = html.match(/(?:ingredient)[^<]{0,300}?<ul[^>]*>([\s\S]*?)<\/ul>/i);
  if (ingSection) {
    [...ingSection[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].forEach(m => {
      const t = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (t.length > 2) result.ingredients.push(t);
    });
  }
  if (!result.ingredients.length) {
    const MEAS = /\b(\d+[\s\u00BC-\u00BE\u2150-\u2189]?|cup|tsp|tbsp|teaspoon|tablespoon|pound|lb|oz|ounce|gram|kg|ml|clove|bunch|pinch|slice|can|bag|package)\b/i;
    const allUls = [...html.matchAll(/<ul[^>]*>([\s\S]*?)<\/ul>/g)];
    let best = null, bestScore = 0;
    for (const ul of allUls) {
      const items = [...ul[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)]
        .map(m => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).filter(t => t.length > 2);
      const score = items.filter(t => MEAS.test(t)).length;
      if (score > bestScore && items.length >= 3) { best = items; bestScore = score; }
    }
    if (best) result.ingredients = best;
  }
  const stpM = html.match(/(?:instruction|direction|method|how to)[^<]{0,300}?<ol[^>]*>([\s\S]*?)<\/ol>/i);
  if (stpM) {
    [...stpM[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].forEach(m => {
      const t = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (t.length > 5) result.steps.push(t);
    });
  }
  if (!result.steps.length) {
    const allOls = [...html.matchAll(/<ol[^>]*>([\s\S]*?)<\/ol>/g)];
    let best = null;
    for (const ol of allOls) {
      const items = [...ol[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)]
        .map(m => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).filter(t => t.length > 10);
      if (!best || items.length > best.length) best = items;
    }
    if (best && best.length >= 2) result.steps = best;
  }
  return result;
}

function parsePrintPage(html) {
  const result = { name: null, ingredients: [], steps: [] };
  const h = html.match(/<h[12][^>]*>([^<]+)<\/h[12]>/);
  if (h) result.name = h[1].trim();
  const plain = html.replace(/<[^>]+>/g, "\n").replace(/&amp;/g,"&").replace(/&nbsp;/g," ").replace(/&#\d+;/g,"").replace(/\n{3,}/g,"\n\n");
  const ingSection = plain.match(/ingredient[^\n]*\n([\s\S]*?)(?:\n\n|\nInstruction|\nDirection|\nMethod|\nNote)/i);
  if (ingSection) {
    ingSection[1].split("\n").map(l => l.replace(/^[\*\-\u2022]\s*/, "").trim()).filter(l => l.length > 2).forEach(l => result.ingredients.push(l));
  }
  const stpSection = plain.match(/(?:instruction|direction|method)[^\n]*\n([\s\S]*?)(?:\n\nNote|\n\nNutrition|$)/i);
  if (stpSection) {
    stpSection[1].split("\n").map(l => l.replace(/^\d+[\.\)]\s*/, "").trim()).filter(l => l.length > 10).forEach(l => result.steps.push(l));
  }
  const yieldM = plain.match(/(?:yield|serves?|serving)[^\n:]*[:\s]+(\d+)/i);
  if (yieldM) result.servings = parseInt(yieldM[1]);
  return result;
}

function parseNumberedSteps(html) {
  const result = { name: null, ingredients: [], steps: [] };
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  if (h1) result.name = h1[1].trim();
  const plain = html.replace(/<script[\s\S]*?<\/script>/gi,"").replace(/<style[\s\S]*?<\/style>/gi,"")
    .replace(/<[^>]+>/g,"\n").replace(/&amp;/g,"&").replace(/&nbsp;/g," ").replace(/&#\d+;/g,"").replace(/\n{3,}/g,"\n\n");
  const ingM = plain.match(/Ingredients[^\n]*\n([\s\S]*?)(?:\n\s*(?:Directions?|Instructions?|Steps?))/i);
  if (ingM) {
    ingM[1].split("\n").map(l => l.replace(/^[\*\-\u2022]\s*/, "").trim())
      .filter(l => l.length > 2 && !/^make[s]?\s*\d/i.test(l)).forEach(l => result.ingredients.push(l));
  }
  const dirM = plain.match(/(?:Directions?|Instructions?|Steps?)[^\n]*\n([\s\S]*?)(?:\n\s*(?:Recipe Video|Notes?|Nutrition|$))/i);
  if (dirM) {
    const lines = dirM[1].split("\n").map(l => l.trim()).filter(Boolean);
    let current = null;
    for (const line of lines) {
      if (/^(?:Step\s*)?\d+[\.\):]/.test(line)) {
        if (current) result.steps.push(current);
        current = line.replace(/^(?:Step\s*)?\d+[\.\):]\s*/, "");
      } else if (current && line.length > 3) { current += " " + line; }
    }
    if (current) result.steps.push(current);
  }
  return result;
}

function guessSource(url) {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    const map = {
      "hungryhobby.net": "Hungry Hobby", "kaynutrition.com": "Kay Nutrition",
      "budgetbytes.com": "Budget Bytes", "cleananddelicious.com": "Clean & Delicious",
      "tasteofhome.com": "Taste of Home", "sisufitness.com": "SISU Fitness",
      "awaken180weightloss.com": "Awaken180", "flexibledietinglifestyle.com": "Flexible Dieting Lifestyle",
      "eatingbirdfood.com": "Eating Bird Food", "allrecipes.com": "AllRecipes",
      "halfbakedharvest.com": "Half Baked Harvest", "skinnytaste.com": "Skinnytaste",
      "pinchofyum.com": "Pinch of Yum", "cookieandkate.com": "Cookie and Kate",
      "minimalistbaker.com": "Minimalist Baker", "seriouseats.com": "Serious Eats",
      "simplyrecipes.com": "Simply Recipes", "recipetineats.com": "RecipeTin Eats",
    };
    return map[host] || host.split(".")[0].replace(/-/g," ").replace(/\b\w/g, c => c.toUpperCase());
  } catch { return "Unknown"; }
}

// ── Handler ────────────────────────────────────────────────────────────────
module.exports = async function fetchRecipeHandler(req, res) {
  if (req.method === "OPTIONS") { res.writeHead(200, CORS); res.end(); return; }
  if (req.method !== "POST")    { res.writeHead(405, CORS); res.end("Method Not Allowed"); return; }

  const auth = await getUserFromRequest(req);
  if (!auth) { res.writeHead(401, CORS); res.end(JSON.stringify({ error: "Unauthorized" })); return; }

  const { url } = req.body || {};
  if (!url) { res.writeHead(400, CORS); res.end(JSON.stringify({ error: "Missing url" })); return; }

  try {
    let fetchUrl2 = url.replace(/[/]print[/]\d+[/]?$/, "/").replace(/[/]print[/]?$/, "/");
    fetchUrl2 = fetchUrl2.replace(/[?&](print|amp|format)=[^&]*/g, "").replace(/[?]$/, "");

    let result = { name: null, ingredients: [], steps: [], servings: null };

    try {
      const jtrRes = await fetch("https://justtherecipe.com/extractRecipeAtUrl?url=" + encodeURIComponent(url), {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (jtrRes.ok) {
        const jtr = await jtrRes.json();
        if (jtr.ingredients?.length) {
          result.ingredients = jtr.ingredients.map(i => typeof i === "string" ? i : [i.quantity, i.unit, i.name, i.comment].filter(Boolean).join(" ").trim()).filter(Boolean);
        }
        if (jtr.instructions?.length) result.steps = jtr.instructions.map(s => typeof s === "string" ? s : (s.text || "")).filter(Boolean);
        if (jtr.name) result.name = jtr.name;
        if (jtr.yields) { const num = parseInt(String(jtr.yields).match(/\d+/)?.[0]); if (num) result.servings = num; }
      }
    } catch(e) { console.warn("[fetch-recipe] JustTheRecipe failed:", e.message); }

    const needIngredients = !result.ingredients.length;
    const needSteps = !result.steps.length;
    if (needIngredients || needSteps) {
      const html = await fetchUrl(fetchUrl2);
      const parsers = [parseJsonLd, parseWPRM, parseTasty, parsePrintPage, parseNumberedSteps, parseGeneric];
      let bestIng = result.ingredients, bestSteps = result.steps;
      for (const parse of parsers) {
        if (bestIng.length && bestSteps.length) break;
        const p = parse(html);
        if (!bestIng.length && p.ingredients?.length) bestIng = p.ingredients;
        if (!bestSteps.length && p.steps?.length) bestSteps = p.steps;
        if (!result.name && p.name) result.name = p.name;
        if (!result.servings && p.servings) result.servings = p.servings;
      }
      result.ingredients = bestIng;
      result.steps = bestSteps;
    }

    const payload = JSON.stringify({
      name: result.name || "", ingredients: result.ingredients, steps: result.steps,
      source: guessSource(url), servings: result.servings || 4,
      success: result.ingredients.length > 0,
    });
    res.writeHead(200, CORS); res.end(payload);
  } catch (e) {
    if (e.message === "CLOUDFLARE_BLOCKED") {
      res.writeHead(200, CORS);
      res.end(JSON.stringify({
        name: "", ingredients: [], steps: [], source: guessSource(url), servings: 4, success: false,
        error: "This site uses bot protection (Cloudflare) that blocks automated fetching. Try visiting the site directly and copying the ingredients manually.",
      })); return;
    }
    res.writeHead(500, CORS); res.end(JSON.stringify({ error: e.message }));
  }
};
