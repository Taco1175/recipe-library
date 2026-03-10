// backend/setup-meal-plans.js
// One-time script: creates the `meal_plans` collection in PocketBase.
// Run once after deploying:  node backend/setup-meal-plans.js
//
// Safe to re-run — skips creation if the collection already exists.
// If the collection exists but has no rules (from a failed previous run),
// delete it via the PocketBase Admin UI first, then re-run.

require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const PB = process.env.PB_URL || "http://localhost:8090";
const ADMIN_EMAIL    = process.env.PB_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD in backend/.env");
  process.exit(1);
}

async function pb(path, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = token;
  const res = await fetch(`${PB}/api/${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { _raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  console.log("Authenticating as admin…");
  const { ok: authOk, data: authData } = await pb("collections/_superusers/auth-with-password", "POST", {
    identity: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (!authOk || !authData.token) {
    console.error("Admin auth failed:", authData);
    process.exit(1);
  }
  const adminToken = authData.token;
  console.log("Admin auth OK.");

  const { ok: listOk } = await pb("collections/meal_plans", "GET", null, adminToken);
  if (listOk) {
    console.log("Collection `meal_plans` already exists — nothing to do.");
    return;
  }

  // Create collection with owner field (avoid reserved word "user") + rules in one shot
  console.log("Creating `meal_plans` collection…");
  const { ok, data } = await pb("collections", "POST", {
    name: "meal_plans",
    type: "base",
    fields: [
      { name: "owner",  type: "text", required: true  },
      { name: "recipe", type: "text", required: true  },
      { name: "date",   type: "text", required: true  },
      { name: "status", type: "text", required: false },
    ],
    listRule:   "@request.auth.id != \"\" && owner = @request.auth.id",
    viewRule:   "@request.auth.id != \"\" && owner = @request.auth.id",
    createRule: "@request.auth.id != \"\"",
    updateRule: "@request.auth.id != \"\" && owner = @request.auth.id",
    deleteRule: "@request.auth.id != \"\" && owner = @request.auth.id",
  }, adminToken);

  if (!ok) {
    console.error("Failed to create collection:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log("Collection `meal_plans` created successfully.");
}

main().catch(e => { console.error(e); process.exit(1); });
