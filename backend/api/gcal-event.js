// backend/api/gcal-event.js
// Creates an all-day Google Calendar event using the user's access token.
// Body: { date: "YYYY-MM-DD", title: string, description?: string }

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

function gcalPost(calendarId, eventBody, accessToken) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(eventBody);
    const req = https.request({
      hostname: "www.googleapis.com",
      path: `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    }, r => {
      let data = "";
      r.on("data", c => data += c);
      r.on("end", () => {
        try { resolve({ status: r.statusCode, data: JSON.parse(data) }); }
        catch(e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

module.exports = async function gcalEventHandler(req, res) {
  if (req.method === "OPTIONS") { res.writeHead(200, CORS); res.end("{}"); return; }
  if (req.method !== "POST") return send(res, 405, { error: "Method Not Allowed" });

  const authHeader = req.headers["authorization"] || "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "");
  if (!accessToken) return send(res, 401, { error: "Missing access token" });

  const { date, title, description } = req.body || {};
  if (!date || !title) return send(res, 400, { error: "date and title required" });

  // All-day event: end date is the day after
  const endDate = new Date(date + "T00:00:00Z");
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  const endStr = endDate.toISOString().slice(0, 10);

  const eventBody = {
    summary: title,
    description: description || "",
    start: { date },
    end:   { date: endStr },
  };

  try {
    const { status, data } = await gcalPost("primary", eventBody, accessToken);
    if (status >= 300) return send(res, status, { error: data.error?.message || "Failed to create event" });
    return send(res, 200, { ok: true, eventId: data.id });
  } catch(e) {
    return send(res, 502, { error: "Event creation failed: " + e.message });
  }
};
