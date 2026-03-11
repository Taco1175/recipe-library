// backend/api/_digest-scheduler.js
// Scheduled daily digest SMS for all users who have:
//   notify_daily_digest: true
//   digest_time: "HH:MM"   (24-hour, e.g. "07:30")
//   phone + carrier set
//
// Checks every minute. Sends once per user per day (tracked in memory).
// Add digest_time to user notification prefs in Settings to opt in.

const nodemailer = require("nodemailer");
const { getAdminToken, pbList, pbFirst, pbEscape } = require("./_pb-helper");

const APP_URL = process.env.APP_URL || "https://mealplannr.xyz";

const CARRIERS = {
  att:        "@txt.att.net",
  verizon:    "@vtext.com",
  tmobile:    "@tmomail.net",
  sprint:     "@messaging.sprintpcs.com",
  uscellular: "@email.uscc.net",
  boost:      "@sms.myboostmobile.com",
  cricket:    "@mms.cricketwireless.net",
  metro:      "@mymetropcs.com",
  spectrum:   "@vtext.com",
};

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, "");

let _transporter = null;
function getTransporter() {
  if (!_transporter && GMAIL_USER && GMAIL_PASS) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });
  }
  return _transporter;
}

async function sendSMS({ phone, carrier, message }) {
  const gateway = CARRIERS[carrier?.toLowerCase()];
  if (!gateway) { console.error("[Digest] Unknown carrier:", carrier); return false; }
  const t = getTransporter();
  if (!t) { console.error("[Digest] GMAIL_USER/GMAIL_APP_PASSWORD not set"); return false; }
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 10) { console.error("[Digest] Invalid phone number"); return false; }
  const to = digits + gateway;
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("SMTP timeout")), 10_000));
  try {
    await Promise.race([
      t.sendMail({ from: GMAIL_USER, to, subject: "Mealplannr Summary", text: message }),
      timeout,
    ]);
    return true;
  } catch (e) {
    console.error("[Digest] Send failed:", e.message);
    return false;
  }
}

// Track which users already got their digest today: "userId:YYYY-MM-DD"
const _sentToday = new Set();

// Clear the sent-set at midnight
function scheduleMidnightReset() {
  const now = new Date();
  const msUntilMidnight =
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
  setTimeout(() => {
    _sentToday.clear();
    scheduleMidnightReset();
  }, msUntilMidnight);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function currentHHMM() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function parseNotifs(pref) {
  try { return JSON.parse(pref?.notifications || "{}"); } catch { return {}; }
}

function formatSteps(steps) {
  if (!Array.isArray(steps) || steps.length === 0) return "";
  return steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
}

async function runDigest() {
  const now = currentHHMM();
  const today = todayStr();

  let adminToken;
  try { adminToken = await getAdminToken(); }
  catch (e) { console.error("[Digest] Admin auth failed:", e.message); return; }

  // Fetch all user_preferences records
  const { ok, data } = await pbList("user_preferences", { perPage: 500 }, adminToken);
  if (!ok) { console.error("[Digest] Failed to fetch user_preferences"); return; }

  const prefs = data.items || [];

  for (const pref of prefs) {
    const notifs = parseNotifs(pref);

    if (!notifs.notify_daily_digest) continue;
    if (!notifs.digest_time || notifs.digest_time !== now) continue;
    if (!notifs.phone || !notifs.carrier) continue;

    const userId = pref.user;
    const sentKey = `${userId}:${today}`;
    if (_sentToday.has(sentKey)) continue;

    // Mark sent immediately to prevent duplicate sends if the loop is slow
    _sentToday.add(sentKey);

    try {
      await sendDigestToUser({ userId, phone: notifs.phone, carrier: notifs.carrier, today, adminToken });
    } catch (e) {
      console.error(`[Digest] Error sending to user ${userId}:`, e.message);
      // Remove the key so it can retry next minute if something went wrong
      _sentToday.delete(sentKey);
    }
  }
}

async function sendDigestToUser({ userId, phone, carrier, today, adminToken }) {
  // Fetch today's active meal plan entries for this user
  const filter = `owner="${pbEscape(userId)}" && date="${pbEscape(today)}" && status="active"`;
  const { ok: mpOk, data: mpData } = await pbList("meal_plans", { filter, sort: "date" }, adminToken);
  if (!mpOk) throw new Error("Failed to fetch meal plans");

  const entries = mpData.items || [];
  if (entries.length === 0) {
    // Nothing planned — skip silently rather than texting an empty digest
    return;
  }

  const dateLabel = new Date(today + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric",
  });

  const sections = [];

  for (const entry of entries) {
    const recipeId = entry.recipe;

    // Fetch recipe name
    const recipe = await pbFirst("recipes", `id="${pbEscape(recipeId)}"`, adminToken);
    const name = recipe?.name || "Unknown recipe";

    // Fetch recipe details (steps)
    const details = await pbFirst("recipe_details", `recipe="${pbEscape(recipeId)}"`, adminToken);
    const steps = formatSteps(details?.steps);

    const link = `${APP_URL}/?recipe=${recipeId}`;

    let section = `--- ${name} ---`;
    if (steps) section += `\n${steps}`;
    section += `\nView: ${link}`;
    sections.push(section);
  }

  const message =
    `Mealplannr Summary - ${dateLabel}\n\n` + sections.join("\n\n");

  const ok = await sendSMS({ phone, carrier, message });
  if (ok) {
    console.log(`[Digest] Sent to user ${userId} (${entries.length} meal(s))`);
  } else {
    console.error(`[Digest] SMS failed for user ${userId}`);
  }
}

function startDigestScheduler() {
  scheduleMidnightReset();

  // Align the first tick to the top of the next minute
  const now = new Date();
  const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

  setTimeout(() => {
    runDigest();
    setInterval(runDigest, 60 * 1000).unref();
  }, msUntilNextMinute);

  console.log("[Digest] Scheduler started — checks every minute for digest_time matches");
}

module.exports = { startDigestScheduler };
