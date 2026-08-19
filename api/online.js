const postgres = require("postgres");

const STALE_AFTER_MS = 90000;

const connectionString =
  process.env.STORAGE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

const sql = connectionString ? postgres(connectionString, { max: 1 }) : null;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (!sql) {
    return res.status(500).json({ error: "no database configured" });
  }

  try {
    await sql`CREATE TABLE IF NOT EXISTS online_users (
      id TEXT PRIMARY KEY,
      last_seen BIGINT NOT NULL
    )`;

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

    const now = Date.now();

    if (req.method === "POST") {
      const id = (req.body && req.body.id) || req.query.id;
      if (!id || typeof id !== "string" || id.length > 200) {
        return res.status(400).json({ error: "missing id" });
      }
      const cleanId = id.slice(0, 200);
      await sql`INSERT INTO online_users (id, last_seen) VALUES (${cleanId}, ${now})
                ON CONFLICT (id) DO UPDATE SET last_seen = ${now}`;

      const body = req.body || {};
      const lat = Number(body.lat);
      const lon = Number(body.lon);
      const hasLoc = !isNaN(lat) && !isNaN(lon) && isFinite(lat) && isFinite(lon);
      if (hasLoc) {
        const source = typeof body.source === "string" ? body.source.slice(0, 16) : "";
        const city = typeof body.city === "string" ? body.city.slice(0, 100) : "";
        const region = typeof body.region === "string" ? body.region.slice(0, 100) : "";
        await sql`INSERT INTO visit_locations (id, source, lat, lon, city, region, first_seen, last_seen)
                  VALUES (${cleanId}, ${source}, ${lat}, ${lon}, ${city}, ${region}, ${now}, ${now})
                  ON CONFLICT (id) DO UPDATE
                    SET source = ${source}, lat = ${lat}, lon = ${lon},
                        city = ${city}, region = ${region}, last_seen = ${now}`;
      }
    }

    const staleCutoff = now - STALE_AFTER_MS;
    await sql`DELETE FROM online_users WHERE last_seen < ${staleCutoff}`;

    const result = await sql`SELECT COUNT(*)::int AS count FROM online_users`;
    return res.status(200).json({ count: result[0].count });
  } catch (err) {
    console.error("online counter error:", err);
    return res.status(500).json({ error: "unavailable" });
  }
};