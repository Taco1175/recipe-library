// backend/server.js
// Express server that:
//   1. Routes /api/* calls to handler modules
//   2. Serves static files from pb_public/ (the built frontend)
//   3. Proxies PocketBase's own /api/* routes transparently
//
// PocketBase itself runs on :8090 (internal only).
// This server runs on :3000 and is fronted by nginx/Caddy on :80/:443.
//
// Start: node backend/server.js
// PM2:   pm2 start backend/server.js --name mealplannr-api

const http    = require("http");
const https   = require("https");
const fs      = require("fs");
const path    = require("path");
const url     = require("url");

// ── Route handlers ─────────────────────────────────────────────────────────
const recipesHandler        = require("./api/recipes");
const recipeDetailsHandler  = require("./api/recipe-details");
const librarySharesHandler  = require("./api/library-shares");
const fetchRecipeHandler    = require("./api/fetch-recipe");
const groceryListHandler    = require("./api/grocery-list");
const matchIngredientsHandler = require("./api/match-ingredients");
const userPreferencesHandler  = require("./api/user-preferences");

const PORT        = process.env.PORT || 3000;
const PB_INTERNAL = process.env.PB_URL || "http://localhost:8090";
const STATIC_DIR  = path.join(__dirname, "pb_public");

// ── MIME types for static serving ─────────────────────────────────────────
const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "application/javascript",
  ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".webp": "image/webp", ".woff2": "font/woff2",
};

// ── Body parser ────────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => { data += chunk; if (data.length > 2e6) reject(new Error("Body too large")); });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { resolve({}); }
    });
    req.on("error", reject);
  });
}

// ── Static file server ─────────────────────────────────────────────────────
function serveStatic(req, res, pathname) {
  // Map / → /index.html, strip query
  let filePath = pathname === "/" ? "/index.html" : pathname;
  filePath = path.join(STATIC_DIR, filePath);

  // Security: prevent path traversal
  if (!filePath.startsWith(STATIC_DIR)) {
    res.writeHead(403); res.end("Forbidden"); return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // SPA fallback: serve index.html for unknown paths
      const indexPath = path.join(STATIC_DIR, "index.html");
      fs.readFile(indexPath, (err2, data) => {
        if (err2) { res.writeHead(404); res.end("Not found"); return; }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      });
      return;
    }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || "application/octet-stream";
    const headers = { "Content-Type": mime };
    // Cache static assets aggressively, never cache HTML
    if (ext === ".html") {
      headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    } else {
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
}

// ── PocketBase transparent proxy (for /api/collections/*, /api/admins/*, etc.) ──
// We expose PocketBase's own API at /pb-api/* to avoid conflicting with our /api/*
function proxyToPocketBase(req, res) {
  const pbUrl = new URL(req.url.replace("/pb-api/", "/api/"), PB_INTERNAL);
  const client = pbUrl.protocol === "https:" ? https : http;
  const proxyReq = client.request(
    { hostname: pbUrl.hostname, port: pbUrl.port, path: pbUrl.pathname + pbUrl.search, method: req.method, headers: req.headers },
    proxyRes => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );
  proxyReq.on("error", () => { res.writeHead(502); res.end("Bad Gateway"); });
  req.pipe(proxyReq);
}

// ── Route table ────────────────────────────────────────────────────────────
const API_ROUTES = {
  "/api/recipes":            recipesHandler,
  "/api/recipe-details":     recipeDetailsHandler,
  "/api/library-shares":     librarySharesHandler,
  "/api/fetch-recipe":       fetchRecipeHandler,
  "/api/grocery-list":       groceryListHandler,
  "/api/match-ingredients":  matchIngredientsHandler,
  "/api/user-preferences":   userPreferencesHandler,
};

// ── Main server ────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const { pathname } = url.parse(req.url);

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end(); return;
  }

  // PocketBase pass-through (for admin UI and direct SDK use)
  if (pathname.startsWith("/pb-api/")) {
    return proxyToPocketBase(req, res);
  }

  // Our API routes
  const handler = API_ROUTES[pathname];
  if (handler) {
    try {
      req.body = await readBody(req);
      await handler(req, res);
    } catch (e) {
      console.error(`[${pathname}] Error:`, e.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Static files
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`Mealplannr API running on port ${PORT}`);
  console.log(`PocketBase internal: ${PB_INTERNAL}`);
  console.log(`Static files: ${STATIC_DIR}`);
});

process.on("uncaughtException", err => console.error("Uncaught:", err.message));
process.on("unhandledRejection", err => console.error("Unhandled:", err?.message || err));
