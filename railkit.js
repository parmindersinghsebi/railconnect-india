// Vercel serverless function: keeps RAILKIT_API_KEY on the server.
const BASE = "https://api.railkit.in";
const re = (v, pattern, label) => {
  if (typeof v !== "string" || !pattern.test(v)) throw new Error("Invalid " + label + ".");
  return v;
};
const seg = (v) => encodeURIComponent(String(v));
function buildRequest(action, p) {
  switch (action) {
    case "pnr":
      return `/api/v1/pnr/${seg(re(p.pnr, /^\d{10}$/, "10-digit PNR"))}`;
    case "live":
      return `/api/v1/trains/${seg(re(p.trainNo, /^\d{5}$/, "five-digit train number"))}/live/${seg(re(p.date, /^\d{2}-\d{2}-\d{4}$/, "date in DD-MM-YYYY format"))}`;
    case "trainInfo":
      return `/api/v1/trains/${seg(re(p.trainNo, /^\d{1,6}$/, "train number"))}/info`;
    case "between": {
      const from = re((p.from || "").toUpperCase(), /^[A-Z0-9]{2,6}$/, "origin station code");
      const to = re((p.to || "").toUpperCase(), /^[A-Z0-9]{2,6}$/, "destination station code");
      const date = p.date ? `?date=${seg(re(p.date, /^\d{2}-\d{2}-\d{4}$/, "date in DD-MM-YYYY format"))}` : "";
      return `/api/v1/trains/between/${seg(from)}/${seg(to)}${date}`;
    }
    case "availability": {
      const train = re(p.trainNo, /^\d{5}$/, "five-digit train number");
      const from = re((p.from || "").toUpperCase(), /^[A-Z0-9]{2,6}$/, "origin station code");
      const to = re((p.to || "").toUpperCase(), /^[A-Z0-9]{2,6}$/, "destination station code");
      const date = re(p.date, /^\d{2}-\d{2}-\d{4}$/, "date in DD-MM-YYYY format");
      const coach = re(p.coach, /^(SL|3A|2A|1A|CC|EC|2S)$/, "travel class");
      const quota = re(p.quota, /^(GN|TQ|LD|SS)$/, "quota");
      return `/api/v1/seats/${seg(train)}/${seg(from)}/${seg(to)}/${seg(date)}/${seg(coach)}/${seg(quota)}`;
    }
    case "fare": {
      const train = re(p.trainNo, /^\d{5}$/, "five-digit train number");
      const date = re(p.date, /^\d{2}-\d{2}-\d{4}$/, "date in DD-MM-YYYY format");
      const from = re((p.from || "").toUpperCase(), /^[A-Z0-9]{2,6}$/, "origin station code");
      const to = re((p.to || "").toUpperCase(), /^[A-Z0-9]{2,6}$/, "destination station code");
      const cls = re(p.travelClass, /^(SL|3A|2A|1A|CC|EC|2S)$/, "travel class");
      const quota = re(p.quota, /^(GN|TQ|LD|SS)$/, "quota");
      return `/api/v1/fare/${seg(train)}/${seg(date)}/${seg(from)}/${seg(to)}/${seg(cls)}/${seg(quota)}`;
    }
    case "trainNumber":
      return `/api/v1/trains/${seg(re(p.query, /^[A-Za-z0-9 ]{1,20}$/, "train number or prefix"))}`;
    case "trainName":
      return `/api/v1/trains/search?name=${seg(re(p.name, /^[A-Za-z0-9 .'-]{1,60}$/, "train name"))}`;
    case "history":
      return `/api/v1/trains/${seg(re(p.trainNo, /^\d{1,6}$/, "train number"))}/history/${seg(re(p.date, /^\d{2}-\d{2}-\d{4}$/, "date in DD-MM-YYYY format"))}`;
    case "cancelled":
      return `/api/v1/trains/cancelled`;
    case "stationLive": {
      const code = re((p.stationCode || "").toUpperCase(), /^[A-Z0-9]{2,6}$/, "station code");
      const hours = re(String(p.hours || "2"), /^(2|4|8)$/, "time window");
      return `/api/v1/stations/${seg(code)}/live?hrs=${hours}`;
    }
    case "stationCode":
      return `/api/v1/stations/${seg(re((p.stationCode || "").toUpperCase(), /^[A-Z0-9]{2,6}$/, "station code"))}`;
    case "stationSearch":
      return `/api/v1/stations/search?name=${seg(re(p.name, /^[A-Za-z .'-]{1,60}$/, "station name"))}`;
    case "amenities":
      return `/api/v1/stations/${seg(re((p.stationCode || "").toUpperCase(), /^[A-Z0-9]{2,6}$/, "station code"))}/amenities`;
    case "timetable": {
      const code = re((p.stationCode || "").toUpperCase(), /^[A-Z0-9]{2,6}$/, "station code");
      const date = p.date ? `?date=${seg(re(p.date, /^\d{2}-\d{2}-\d{4}$/, "date in DD-MM-YYYY format"))}` : "";
      return `/api/v1/stations/${seg(code)}/timetable${date}`;
    }
    default: throw new Error("Unknown railway service.");
  }
}
module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Use POST for this endpoint." });
  }
  if (!process.env.RAILKIT_API_KEY) {
    return res.status(503).json({ success: false, error: "RailKit API key is not configured. Add RAILKIT_API_KEY in Vercel Project Settings → Environment Variables." });
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const action = body.action;
    const params = body.params || {};
    const path = buildRequest(action, params);
    const upstream = await fetch(BASE + path, {
      method: "GET",
      headers: { "x-api-key": process.env.RAILKIT_API_KEY, "accept": "application/json" },
      signal: AbortSignal.timeout(20000)
    });
    const raw = await upstream.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = { message: raw.slice(0, 1000) }; }
    return res.status(upstream.status).json(data);
  } catch (err) {
    const status = err.name === "TimeoutError" ? 504 : 400;
    return res.status(status).json({ success: false, error: err.message || "Railway API request failed." });
  }
};
