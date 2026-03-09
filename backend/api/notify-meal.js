// backend/api/notify-meal.js
// Called by the frontend when:
//   type="save"   — a recipe was added to the meal planner
//   type="digest" — the user wants this morning's plan texted to them
//
// Reads notification preferences from the user's user_preferences record.
// Requires "notifications" text field in PocketBase's user_preferences collection.

const { pbFirst, getUserFromRequest } = require("./_pb-helper");
const { sendSMS } = require("./_notify");

const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

function send(res, status, body) {
  res.writeHead(status, CORS);
  res.end(JSON.stringify(body));
}

function parseNotifs(pref) {
  try { return JSON.parse(pref?.notifications || "{}"); } catch { return {}; }
}

module.exports = async function notifyMealHandler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, {});
  if (req.method !== "POST")   return send(res, 405, { error: "Method Not Allowed" });

  const auth = await getUserFromRequest(req);
  if (!auth) return send(res, 401, { error: "Unauthorized" });
  const { token } = auth;

  const { type, recipeId, date, meals } = req.body || {};

  const pref   = await pbFirst("user_preferences", "", token);
  const notifs = parseNotifs(pref);

  if (!notifs.phone || !notifs.carrier) {
    return send(res, 400, { error: "No phone number configured. Add it in Settings." });
  }

  let message;

  if (type === "save" && notifs.notify_meal_save) {
    // Look up the recipe name so the SMS is readable
    let mealName = recipeId;
    if (recipeId) {
      const recipe = await pbFirst("recipes", `id="${recipeId}"`, token);
      if (recipe?.name) mealName = recipe.name;
    }
    const dateLabel = date
      ? new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
      : date;
    message = `Mealplannr: "${mealName}" added for ${dateLabel}.`;

  } else if (type === "digest" && notifs.notify_daily_digest) {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    const list  = (meals || []).map(m => `- ${m}`).join("\n");
    message = list
      ? `Mealplannr - Today (${today}):\n${list}`
      : `Mealplannr - No meals planned for today (${today}).`;

  } else {
    // Notification type disabled or unknown — silently succeed
    return send(res, 200, { ok: true, skipped: true });
  }

  const result = await sendSMS({ phone: notifs.phone, carrier: notifs.carrier, message });
  return send(res, result.ok ? 200 : 500, { ok: result.ok, error: result.error });
};
