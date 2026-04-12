// backend/api/scan-recipe.js
// Accepts a base64-encoded image, runs server-side Tesseract OCR,
// parses the extracted text into a structured recipe, and returns it.

const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { getUserFromRequest, send } = require("./_pb-helper");

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

module.exports = async function scanRecipeHandler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, {});
  if (req.method !== "POST") return send(res, 405, { error: "Method Not Allowed" });

  const auth = await getUserFromRequest(req);
  if (!auth) return send(res, 401, { error: "Unauthorized" });

  const { image } = req.body || {};
  if (!image || typeof image !== "string") {
    return send(res, 400, { error: "Missing image (base64)" });
  }

  // Strip data URI prefix if present
  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  const buf = Buffer.from(base64Data, "base64");

  if (buf.length > MAX_IMAGE_SIZE) {
    return send(res, 400, { error: "Image too large (max 10 MB)" });
  }

  // Write to temp file, run tesseract, clean up
  const tmpFile = path.join(os.tmpdir(), `recipe-scan-${Date.now()}.png`);
  try {
    fs.writeFileSync(tmpFile, buf);
    const ocrText = await runTesseract(tmpFile);
    const recipe = parseOcrText(ocrText);
    recipe._raw = ocrText; // include raw text so frontend can show/edit it
    return send(res, 200, recipe);
  } catch (e) {
    console.error("[scan-recipe] Error:", e.message);
    return send(res, 500, { error: "OCR failed", message: e.message });
  } finally {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
};

// ── Run Tesseract CLI ─────────────────────────────────────────────────────
function runTesseract(imagePath) {
  return new Promise((resolve, reject) => {
    // --psm 3 = fully automatic page segmentation (best for recipe pages)
    // stdout output via "-" as output base
    execFile(
      "tesseract",
      [imagePath, "stdout", "--psm", "3", "-l", "eng"],
      { timeout: 30000, maxBuffer: 2 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        resolve(stdout);
      }
    );
  });
}

// ── Parse OCR text into structured recipe ─────────────────────────────────
function parseOcrText(text) {
  const result = { name: "", ingredients: [], steps: [], servings: null,
                   cuisine: null, protein: null, method: null };
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Skip ad/spam/garbage lines
  function isSpam(line) {
    if (/[©™®]/.test(line)) return true;
    if (/https?:\/\/|www\.|\.com\/|\.net\//i.test(line)) return true;
    if (/\b(save up to|% off|bundle|earn up to|bonus|card members?|terms apply|get a quote|visa|mastercard|amex|disney|netflix|subscribe|newsletter|insurance)\b/i.test(line)) return true;
    const letters = (line.match(/[a-zA-Z]/g) || []).length;
    if (letters < 3 && line.length > 4) return true;
    if (/^[~>*^]/.test(line)) return true;
    const noise = (line.match(/[^a-zA-Z0-9\s,.()\-/½¼¾⅓⅔⅛°'"]/g) || []).length;
    if (noise / line.length > 0.35) return true;
    return false;
  }

  let section = null;
  for (const raw of lines) {
    if (isSpam(raw)) continue;
    const line = fixOcrTypos(raw);

    // Section headers
    if (/^ingredients?\s*[:.]?\s*$/i.test(line)) { section = "ing"; continue; }
    if (/^(instructions?|directions?|method|steps?|how to( make)?|preparation|procedure)\s*[:.]?\s*$/i.test(line)) { section = "steps"; continue; }
    if (/^(notes?|nutrition|tips?|serving suggestions?|storage|make ahead|faq|per serving|calories)\s*[:.]?\s*/i.test(line)) { section = null; continue; }

    // Detect inline section headers: "Ingredients: 1 cup flour..."
    if (section === null && /^ingredients?\s*[:]\s*.+/i.test(line)) {
      section = "ing";
      const after = line.replace(/^ingredients?\s*[:]\s*/i, "").trim();
      if (after.length > 2) result.ingredients.push(cleanIngredient(after));
      continue;
    }
    if (section === null && /^(instructions?|directions?)\s*[:]\s*.+/i.test(line)) {
      section = "steps";
      const after = line.replace(/^(instructions?|directions?)\s*[:]\s*/i, "").trim();
      if (after.length > 8) result.steps.push(cleanStep(after));
      continue;
    }

    // Name: first plausible title line before any section header
    if (!result.name && section === null) {
      const looksLikeName = line.length > 4 && line.length < 80
        && !/^\d/.test(line)
        && !/\d{3,}/.test(line)
        && (line.match(/[a-zA-Z]/g) || []).length > line.length * 0.6;
      if (looksLikeName) { result.name = line; continue; }
    }

    // Auto-detect section by content pattern if no header was found
    if (section === null && looksLikeIngredient(line)) {
      section = "ing";
    }

    if (section === "ing") {
      const clean = cleanIngredient(line);
      if (clean.length > 2 && clean.length < 150) result.ingredients.push(clean);
    } else if (section === "steps") {
      const clean = cleanStep(line);
      if (clean.length > 8) result.steps.push(clean);
    }
  }

  // Servings
  const svMatch = text.match(/serves?\s*:?\s*(\d+)/i)
               || text.match(/(\d+)\s*servings?/i)
               || text.match(/yield\s*:?\s*(\d+)/i);
  if (svMatch) result.servings = parseInt(svMatch[1]);

  // Try to detect protein from ingredients
  result.protein = detectProtein(result.ingredients);

  return result;
}

// ── Fix common OCR misreads ───────────────────────────────────────────────
function fixOcrTypos(line) {
  return line
    // Common fraction misreads
    .replace(/\bl\/2\b/g, "1/2")
    .replace(/\bl\/4\b/g, "1/4")
    .replace(/\bl\/3\b/g, "1/3")
    .replace(/\b0\/2\b/g, "1/2")
    // "l" misread as "1" at start of measurement
    .replace(/^l\s+(cup|tsp|tbsp|tablespoon|teaspoon|pound|lb|oz|ounce|clove)/i, "1 $1")
    // "tsp" / "tbsp" mangled
    .replace(/\btbsp?\.?\b/gi, "tbsp")
    .replace(/\btsp\.?\b/gi, "tsp")
    // Fractions rendered as Unicode
    .replace(/½/g, "1/2").replace(/¼/g, "1/4").replace(/¾/g, "3/4")
    .replace(/⅓/g, "1/3").replace(/⅔/g, "2/3").replace(/⅛/g, "1/8")
    .trim();
}

// ── Does this line look like an ingredient? ───────────────────────────────
function looksLikeIngredient(line) {
  // Starts with a number or fraction
  if (/^\d/.test(line)) return true;
  // Contains measurement words
  if (/\b(cups?|tsp|tbsp|teaspoons?|tablespoons?|pounds?|lbs?|oz|ounces?|grams?|cloves?|bunch|pinch|cans?|slices?|strips?|large|medium|small|whole|handful|dash)\b/i.test(line)) return true;
  return false;
}

// ── Clean an ingredient line ──────────────────────────────────────────────
function cleanIngredient(line) {
  return line
    .replace(/^[•\-*·▪▸→¢©oO]\s*/, "")  // bullets (OCR reads • as ¢, o, O)
    .replace(/^[a-z¢]\s+(?=\d)/, "")       // lone letter before a number
    .replace(/\s+/g, " ")
    .trim();
}

// ── Clean a step line ─────────────────────────────────────────────────────
function cleanStep(line) {
  return line
    .replace(/^\d+[.):\s]+/, "")  // strip leading step numbers
    .replace(/\s+/g, " ")
    .trim();
}

// ── Detect protein from ingredient list ───────────────────────────────────
function detectProtein(ingredients) {
  const text = ingredients.join(" ").toLowerCase();
  const proteins = [
    ["chicken", "Chicken"], ["beef", "Beef"], ["pork", "Pork"],
    ["salmon", "Salmon"], ["shrimp", "Shrimp"], ["fish", "Fish"],
    ["turkey", "Turkey"], ["lamb", "Lamb"], ["tofu", "Tofu"],
    ["sausage", "Sausage"], ["bacon", "Bacon"],
  ];
  for (const [keyword, label] of proteins) {
    if (text.includes(keyword)) return label;
  }
  return null;
}
