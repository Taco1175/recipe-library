const https = require("https");
const http = require("http");

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
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

// Best method: JSON-LD schema.org/Recipe (used by 90%+ of recipe sites)
function parseJsonLd(html) {
  const result = { name: null, ingredients: [], steps: [] };
  const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const s of scripts) {
    try {
      let data = JSON.parse(s[1].trim());
      // Handle @graph arrays
      if (data["@graph"]) data = data["@graph"].find(i => i["@type"] === "Recipe") || {};
      if (Array.isArray(data)) data = data.find(i => i["@type"] === "Recipe") || {};
      if (data["@type"] !== "Recipe") continue;

      if (data.name) result.name = data.name.trim();

      if (Array.isArray(data.recipeIngredient)) {
        result.ingredients = data.recipeIngredient
          .map(i => String(i).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
          .filter(Boolean);
      }

      if (data.recipeYield) {
        const yieldStr = Array.isArray(data.recipeYield) ? data.recipeYield[0] : data.recipeYield;
        const num = parseInt(String(yieldStr).match(/\d+/)?.[0]);
        if (num) result.servings = num;
      }

      if (Array.isArray(data.recipeInstructions)) {
        result.steps = data.recipeInstructions.map(s => {
          if (typeof s === "string") return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
          if (s["@type"] === "HowToSection" && Array.isArray(s.itemListElement)) {
            return s.itemListElement.map(i => (i.text || i.name || "").replace(/\s+/g, " ").trim()).join(" ");
          }
          return (s.text || s.name || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        }).filter(i => i.length > 3);
      }

      // Servings
      const yieldRaw = data.recipeYield;
      if (yieldRaw) {
        const yieldStr = Array.isArray(yieldRaw) ? yieldRaw[0] : yieldRaw;
        const num = parseInt(String(yieldStr).match(/\d+/)?.[0]);
        if (num) result.servings = num;
      }

      if (result.ingredients.length) return result;
    } catch (e) {}
  }
  return result;
}

// Fallback: WPRM plugin HTML (HungryHobby, FoodDolls, many others)
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

  const stepBlocks = [...html.matchAll(/class="wprm-recipe-instruction-text"[^>]*>([\s\S]*?)<\/p>/g)];
  stepBlocks.forEach(m => {
    const text = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text) result.steps.push(text);
  });

  return result;
}

// Fallback: Tasty Recipes plugin (BudgetBytes, etc.)
function parseTasty(html) {
  const result = { name: null, ingredients: [], steps: [] };

  const nameM = html.match(/class="tasty-recipes-title"[^>]*>([\s\S]*?)<\/h/);
  if (nameM) result.name = nameM[1].replace(/<[^>]+>/g, "").trim();

  const ingSection = html.match(/class="tasty-recipes-ingredients[^"]*"[\s\S]*?<\/div>/);
  if (ingSection) {
    [...ingSection[0].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].forEach(m => {
      const text = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text) result.ingredients.push(text);
    });
  }

  const stepsSection = html.match(/class="tasty-recipes-instructions[^"]*"[\s\S]*?<\/div>/);
  if (stepsSection) {
    [...stepsSection[0].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].forEach(m => {
      const text = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text) result.steps.push(text);
    });
  }

  return result;
}

// Last resort: generic <ul>/<ol> near keywords
function parseGeneric(html) {
  const result = { name: null, ingredients: [], steps: [] };

  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  if (h1) result.name = h1[1].trim();

  const ingM = html.match(/ingredient[^<]{0,100}<ul[^>]*>([\s\S]*?)<\/ul>/i);
  if (ingM) {
    [...ingM[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].forEach(m => {
      const t = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (t.length > 2) result.ingredients.push(t);
    });
  }

  const stpM = html.match(/(?:instruction|direction)[^<]{0,100}<ol[^>]*>([\s\S]*?)<\/ol>/i);
  if (stpM) {
    [...stpM[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].forEach(m => {
      const t = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (t.length > 5) result.steps.push(t);
    });
  }

  return result;
}

function guessSource(url) {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    const map = {
      "hungryhobby.net": "Hungry Hobby",
      "kaynutrition.com": "Kay Nutrition",
      "budgetbytes.com": "Budget Bytes",
      "eatingonadime.com": "Eating on a Dime",
      "cleananddelicious.com": "Clean & Delicious",
      "tasteofhome.com": "Taste of Home",
      "fooddolls.com": "Food Dolls",
      "sisufitness.com": "SISU Fitness",
      "awaken180weightloss.com": "Awaken180",
      "flexibledietinglifestyle.com": "Flexible Dieting Lifestyle",
      "cookinginthemidwest.com": "Cooking in the Midwest",
      "eatingbirdfood.com": "Eating Bird Food",
      "allrecipes.com": "AllRecipes",
      "food52.com": "Food52",
      "halfbakedharvest.com": "Half Baked Harvest",
      "skinnytaste.com": "Skinnytaste",
      "pinchofyum.com": "Pinch of Yum",
    };
    return map[host] || host.split(".")[0].replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  } catch (e) { return "Unknown"; }
}

exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: "Method Not Allowed" };

  const { url } = JSON.parse(event.body || "{}");
  if (!url) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing url" }) };

  try {
    const html = await fetchUrl(url);

    // Try parsers in order of reliability
    let result = parseJsonLd(html);
    if (!result.ingredients.length) result = { ...result, ...parseWPRM(html) };
    if (!result.ingredients.length) result = { ...result, ...parseTasty(html) };
    if (!result.ingredients.length) result = { ...result, ...parseGeneric(html) };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        name: result.name || "",
        ingredients: result.ingredients,
        steps: result.steps,
        source: guessSource(url),
        servings: result.servings || 4,
        success: result.ingredients.length > 0,
      }),
    };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
