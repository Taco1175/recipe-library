exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  const token = (event.headers["authorization"] || "").replace("Bearer ", "").trim();
  if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: "No token" }) };

  const { action, calendarId, timeMin, timeMax } = event.queryStringParameters || {};

  // List all calendars
  if (action === "list-calendars") {
    const res = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.error) return { statusCode: 401, headers, body: JSON.stringify({ error: data.error.message }) };
    return { statusCode: 200, headers, body: JSON.stringify(data.items || []) };
  }

  // Fetch events from specific calendar(s) for a time range
  if (action === "events") {
    const ids = (calendarId || "primary").split(",");
    const allEvents = [];

    for (const id of ids) {
      const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events`);
      url.searchParams.set("timeMin", timeMin);
      url.searchParams.set("timeMax", timeMax);
      url.searchParams.set("singleEvents", "true");
      url.searchParams.set("orderBy", "startTime");
      url.searchParams.set("maxResults", "50");

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.items) {
        allEvents.push(...data.items.map(e => ({
          id: e.id,
          title: e.summary || "(No title)",
          start: e.start?.dateTime || e.start?.date,
          end: e.end?.dateTime || e.end?.date,
          allDay: !e.start?.dateTime,
          color: e.colorId,
          calendarId: id,
        })));
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify(allEvents) };
  }

  return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown action" }) };
};
