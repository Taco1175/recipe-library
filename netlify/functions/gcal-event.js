const { getAuthHeader } = require("./_auth-helper");

exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: "Method Not Allowed" };

  try {
    const { date, title, description } = JSON.parse(event.body || "{}");
    if (!date || !title) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing date or title" }) };

    // Build Google Calendar API request
    const authHeader = await getAuthHeader(event);
    const calEvent = {
      summary: title,
      description: description || "",
      start: { date },  // all-day event
      end: { date },
    };

    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(calEvent),
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Google Calendar error", detail: err }) };
    }

    const created = await res.json();
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, id: created.id }) };

  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
