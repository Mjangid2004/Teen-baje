const postgres = require("postgres");

const ADMIN_KEY = process.env.TB_ADMIN_KEY || "TB_SECRET_304_alpha9z";

const connectionString =
  process.env.STORAGE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

const sql = connectionString ? postgres(connectionString, { max: 1 }) : null;

function fmtTime(ts) {
  const n = Number(ts);
  if (!isFinite(n)) return "–";
  return new Date(n).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const key = (req.query && req.query.key) || "";
  if (key !== ADMIN_KEY) {
    return res.status(403).json({ error: "forbidden" });
  }

  if (!sql) {
    return res.status(500).json({ error: "no database configured" });
  }

  try {
    await sql`CREATE TABLE IF NOT EXISTS visit_locations (
      id TEXT PRIMARY KEY,
      source TEXT,
      lat DOUBLE PRECISION,
      lon DOUBLE PRECISION,
      city TEXT,
      region TEXT,
      first_seen BIGINT NOT NULL,
      last_seen BIGINT NOT NULL
    )`;

    const rows = await sql`SELECT source, lat, lon, city, region, first_seen, last_seen
                           FROM visit_locations
                           ORDER BY last_seen DESC
                           LIMIT 200`;

    if (req.query.fmt === "json") {
      const visits = rows.map((r) => ({
        source: r.source || "",
        lat: r.lat,
        lon: r.lon,
        city: r.city || "",
        region: r.region || "",
        firstSeen: fmtTime(r.first_seen),
        lastSeen: fmtTime(r.last_seen)
      }));
      return res.status(200).json({ total: visits.length, visits });
    }

    const rowsHtml = rows
      .map((r) => {
        const source = r.source === "gps" ? "🎯 GPS" : r.source === "ip" ? "📡 IP" : "–";
        const city = r.city ? esc(r.city) : "–";
        const region = r.region ? esc(r.region) : "";
        const coords =
          r.lat != null && r.lon != null
            ? `<a class="map-link" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${Number(r.lat)},${Number(r.lon)}">📍 ${Number(r.lat).toFixed(4)}, ${Number(r.lon).toFixed(4)}</a>`
            : "–";
        return `<tr>
          <td>${source}</td>
          <td>${city}${region ? "<span class='sub'>" + region + "</span>" : ""}</td>
          <td class="mono">${coords}</td>
          <td class="mono">${fmtTime(r.last_seen)}</td>
          <td class="mono">${fmtTime(r.first_seen)}</td>
        </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>Teen Baje — Visitor Locations (private)</title>
<style>
  body { margin:0; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; background:#0a0c10; color:#e8e8e8; padding:16px; }
  h1 { color:#ffb703; font-size:20px; margin:0 0 4px; }
  .sub { color:#888; font-size:12px; }
  .mono { font-family: 'JetBrains Mono', Consolas, monospace; font-size:12px; color:#9db4ff; }
  .map-link { color:#ffb703; text-decoration:none; }
  .map-link:hover { text-decoration:underline; }
  .card { background:#161820; border:1px solid rgba(255,183,3,0.25); border-radius:12px; padding:14px; margin-bottom:14px; }
  .meta { color:#aaa; font-size:12px; margin-bottom:10px; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th, td { text-align:left; padding:8px; border-bottom:1px solid rgba(255,255,255,0.07); vertical-align:top; }
  th { color:#ffb703; font-size:11px; text-transform:uppercase; letter-spacing:.5px; }
  tr:last-child td { border-bottom:none; }
</style>
</head>
<body>
  <div class="card">
    <h1>🌙 Teen Baje — where are they?</h1>
    <div class="meta">${rows.length} recorded visitor(s) • time zone: IST</div>
  </div>
  <div class="card">
    <table>
      <thead><tr><th>Source</th><th>Place</th><th>Coords</th><th>Last seen</th><th>First seen</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err) {
    console.error("stats error:", err);
    return res.status(500).json({ error: "unavailable" });
  }
};