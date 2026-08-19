const postgres = require("postgres");

const ADMIN_KEY = process.env.TB_ADMIN_KEY || "TB_SECRET_304_alpha9z";

const connectionString =
  process.env.STORAGE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

const sql = connectionString ? postgres(connectionString, { max: 1 }) : null;

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

    const visits = rows.map((r) => ({
      source: r.source || "",
      lat: r.lat,
      lon: r.lon,
      city: r.city || "",
      region: r.region || "",
      firstSeen: new Date(r.first_seen).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      lastSeen: new Date(r.last_seen).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    }));

    return res.status(200).json({ total: visits.length, visits });
  } catch (err) {
    console.error("stats error:", err);
    return res.status(500).json({ error: "unavailable" });
  }
};