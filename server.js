const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = process.env.PORT || 3000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

const server = http.createServer((request, response) => {
  const requestedUrl = new URL(request.url, `http://${request.headers.host}`);
  const pathname = decodeURIComponent(requestedUrl.pathname);
  const safePath = path.normalize(path.join(root, pathname === "/" ? "index.html" : pathname));

  if (!safePath.startsWith(root)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  fs.readFile(safePath, (error, data) => {
    if (error) {
      fs.readFile(path.join(root, "index.html"), (fallbackError, fallbackData) => {
        if (fallbackError) {
          response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          response.end("Not found");
          return;
        }

        response.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, max-age=0"
        });
        response.end(fallbackData);
      });
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(safePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store, max-age=0"
    });
    response.end(data);
  });
});

server.listen(port, () => {
  console.log(`The.AI.blog is running on port ${port}`);
});
