const { sql } = require("@vercel/postgres");

const STALE_AFTER_MS = 90000;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  try {
    await sql`CREATE TABLE IF NOT EXISTS online_users (
      id TEXT PRIMARY KEY,
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
    }

    const staleCutoff = now - STALE_AFTER_MS;
    await sql`DELETE FROM online_users WHERE last_seen < ${staleCutoff}`;

    const { rows } = await sql`SELECT COUNT(*)::int AS count FROM online_users`;
    return res.status(200).json({ count: rows[0].count });
  } catch (err) {
    console.error("online counter error:", err);
    return res.status(500).json({ error: "unavailable" });
  }
};