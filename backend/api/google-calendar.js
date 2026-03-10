// backend/api/google-calendar.js
// Proxies Google Calendar API requests using the user's access token.
// Supports: list-calendars, events

const https = require("https");

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function send(res, status, body) {
  res.writeHead(status, CORS);
  res.end(JSON.stringify(body));
}

function gcalFetch(path, accessToken) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "www.googleapis.com",
      path,
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    }, r => {
      let data = "";
      r.on("data", c => data += c);
      r.on("end", () => {
        try { resolve({ status: r.statusCode, data: JSON.parse(data) }); }
        catch(e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

module.exports = async function googleCalendarHandler(req, res) {
  if (req.method === "OPTIONS") { res.writeHead(200, CORS); res.end("{}"); return; }
  if (req.method !== "GET") return send(res, 405, { error: "Method Not Allowed" });

  const authHeader = req.headers["authorization"] || "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "");
  if (!accessToken) return send(res, 401, { error: "Missing access token" });

  const { searchParams } = new URL(req.url, "http://localhost");
  const action = searchParams.get("action");

  // ── List calendars ──────────────────────────────────────────────────────
  if (action === "list-calendars") {
    try {
      const { status, data } = await gcalFetch("/calendar/v3/users/me/calendarList", accessToken);
      if (status !== 200) return send(res, status, { error: data.error?.message || "Failed to list calendars" });
      const cals = (data.items || []).map(c => ({
        id:              c.id,
        summary:         c.summary,
        backgroundColor: c.backgroundColor,
        colorId:         c.colorId,
      }));
      return send(res, 200, cals);
    } catch(e) {
      return send(res, 502, { error: "Calendar list failed: " + e.message });
    }
  }

  // ── Fetch events ────────────────────────────────────────────────────────
  if (action === "events") {
    const calendarIds = (searchParams.get("calendarId") || "primary").split(",");
    const timeMin = searchParams.get("timeMin");
    const timeMax = searchParams.get("timeMax");

    if (!timeMin || !timeMax) return send(res, 400, { error: "timeMin and timeMax required" });

    try {
      const allEvents = [];
      for (const calId of calendarIds) {
        const path = `/calendar/v3/calendars/${encodeURIComponent(calId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=50`;
        const { status, data } = await gcalFetch(path, accessToken);
        if (status !== 200) continue;
        for (const ev of (data.items || [])) {
          allEvents.push({
            title: ev.summary || "(no title)",
            start: ev.start?.date || ev.start?.dateTime || "",
            color: ev.colorId ? null : ev.backgroundColor,
            colorId: ev.colorId,
          });
        }
      }
      return send(res, 200, allEvents);
    } catch(e) {
      return send(res, 502, { error: "Events fetch failed: " + e.message });
    }
  }

  return send(res, 400, { error: "Unknown action. Use action=list-calendars or action=events" });
};
