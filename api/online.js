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
      device TEXT,
      first_seen BIGINT NOT NULL,
      last_seen BIGINT NOT NULL
    )`;

    await sql`ALTER TABLE visit_locations ADD COLUMN IF NOT EXISTS device TEXT`;

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
      const device = typeof body.device === "string" ? body.device.slice(0, 16) : "";
      let source = hasLoc && typeof body.source === "string" ? body.source.slice(0, 16) : "";
      let city = hasLoc && typeof body.city === "string" ? body.city.slice(0, 100) : "";
      let region = hasLoc && typeof body.region === "string" ? body.region.slice(0, 100) : "";
      let finalLat = hasLoc ? lat : null;
      let finalLon = hasLoc ? lon : null;

      if (!hasLoc) {
        const ff = req.headers["x-forwarded-for"];
        const ip = typeof ff === "string" ? ff.split(",")[0].trim() : "";
        if (ip) {
          try {
            const ctl = new AbortController();
            setTimeout(() => ctl.abort(), 3000);
            const geoRes = await fetch(`https://ip-api.com/json/${ip}?lang=en`, {
              signal: ctl.signal,
              headers: { "User-Agent": "teen-baje/1.0" }
            });
            const geo = await geoRes.json();
            if (geo && geo.status === "success") {
              finalLat = geo.lat;
              finalLon = geo.lon;
              source = "ip";
              city = geo.city || "";
              region = geo.regionName || "";
            }
          } catch (e) {}
        }
      }

      if (finalLat != null && finalLon != null) {
        await sql`INSERT INTO visit_locations (id, source, lat, lon, city, region, device, first_seen, last_seen)
                  VALUES (${cleanId}, ${source}, ${finalLat}, ${finalLon}, ${city}, ${region}, ${device}, ${now}, ${now})
                  ON CONFLICT (id) DO UPDATE
                    SET source = ${source}, lat = ${finalLat}, lon = ${finalLon},
                        city = ${city}, region = ${region}, device = ${device}, last_seen = ${now}`;
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