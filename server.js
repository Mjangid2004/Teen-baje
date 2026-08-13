const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = 8000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

http
  .createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end();
      return;
    }

    let urlPath;
    try {
      urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch (e) {
      res.writeHead(400);
      res.end();
      return;
    }

    if (urlPath === "/") urlPath = "/index.html";

    const filePath = path.join(ROOT, path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, ""));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end();
      return;
    }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      const mime = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
      const rangeHeader = req.headers.range;
      const total = stat.size;

      if (rangeHeader) {
        const m = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
        if (m) {
          let start = m[1] === "" ? total - parseInt(m[2], 10) : parseInt(m[1], 10);
          let end = m[2] === "" ? total - 1 : parseInt(m[2], 10);
          if (isNaN(start) || start < 0 || start >= total) {
            res.writeHead(416, { "Content-Range": `bytes */${total}` });
            res.end();
            return;
          }
          end = Math.min(end, total - 1);
          res.writeHead(206, {
            "Content-Type": mime,
            "Content-Range": `bytes ${start}-${end}/${total}`,
            "Accept-Ranges": "bytes",
            "Content-Length": end - start + 1,
            "Cache-Control": "no-cache",
          });
          const stream = fs.createReadStream(filePath, { start, end });
          if (req.method === "HEAD") { res.end(); return; }
          stream.pipe(res);
          return;
        }
      }

      res.writeHead(200, {
        "Content-Type": mime,
        "Content-Length": total,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache",
      });
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      fs.createReadStream(filePath).pipe(res);
    });
  })
  .listen(PORT, () => {
    console.log(`Teen Baje server running at http://localhost:${PORT}`);
  });