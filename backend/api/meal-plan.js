// backend/api/meal-plan.js
// Persists the weekly meal plan to PocketBase.
//
// GET    /api/meal-plan?from=YYYY-MM-DD&to=YYYY-MM-DD
//   → Returns all active entries for the user in the given date range.
//
// POST   /api/meal-plan  { recipe: "<id>", date: "YYYY-MM-DD" }
//   → Creates a new active meal plan entry. Returns the created record.
//
// DELETE /api/meal-plan?id=<recordId>
//   → Archives the entry (sets status="archived") instead of hard-deleting.

const { pbList, pbCreate, pbUpdate, pbFirst, getUserFromRequest, pbEscape, send } = require("./_pb-helper");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

module.exports = async function mealPlanHandler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, {});

  const auth = await getUserFromRequest(req);
  if (!auth) return send(res, 401, { error: "Unauthorized" });
  const { user, token } = auth;

  // ── GET: fetch active entries for a date range ─────────────────────────────
  if (req.method === "GET") {
    const url = new URL(req.url, "http://localhost");
    const from = url.searchParams.get("from");
    const to   = url.searchParams.get("to");

    let filter = `owner="${pbEscape(user.id)}" && status="active"`;
    if (from && DATE_RE.test(from)) filter += ` && date>="${pbEscape(from)}"`;
    if (to   && DATE_RE.test(to))   filter += ` && date<="${pbEscape(to)}"`;

    const { ok, data } = await pbList("meal_plans", { filter, sort: "date", perPage: 500 }, token);
    if (!ok) return send(res, 500, { error: "Failed to fetch meal plan" });
    return send(res, 200, data.items || []);
  }

  // ── POST: add a meal to the plan ───────────────────────────────────────────
  if (req.method === "POST") {
    const { recipe, date } = req.body || {};
    if (!recipe || !date || !DATE_RE.test(date)) {
      return send(res, 400, { error: "Missing or invalid recipe/date" });
    }

    // Upsert: if an archived entry exists for this user+recipe+date, reactivate it
    const existing = await pbFirst(
      "meal_plans",
      `owner="${pbEscape(user.id)}" && recipe="${pbEscape(recipe)}" && date="${pbEscape(date)}"`,
      token
    );

    if (existing) {
      if (existing.status === "active") return send(res, 200, existing); // already active
      const { ok, data } = await pbUpdate("meal_plans", existing.id, { status: "active" }, token);
      if (!ok) return send(res, 500, { error: "Failed to reactivate entry" });
      return send(res, 200, data);
    }

    const { ok, data } = await pbCreate("meal_plans", {
      owner:  user.id,
      recipe,
      date,
      status: "active",
    }, token);

    if (!ok) return send(res, 500, { error: "Failed to create meal plan entry" });
    return send(res, 201, data);
  }

  // ── DELETE: archive an entry ───────────────────────────────────────────────
  if (req.method === "DELETE") {
    const url = new URL(req.url, "http://localhost");
    const id  = url.searchParams.get("id");
    if (!id) return send(res, 400, { error: "Missing id" });

    // Verify ownership before archiving
    const existing = await pbFirst(
      "meal_plans",
      `id="${pbEscape(id)}" && owner="${pbEscape(user.id)}"`,
      token
    );
    if (!existing) return send(res, 404, { error: "Entry not found" });

    const { ok } = await pbUpdate("meal_plans", id, { status: "archived" }, token);
    if (!ok) return send(res, 500, { error: "Failed to archive entry" });
    return send(res, 200, { ok: true });
  }

  return send(res, 405, { error: "Method Not Allowed" });
};
