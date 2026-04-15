import express from "express";
import { Storage } from "@google-cloud/storage";

const app = express();
const port = parseInt(process.env.PORT || "8080", 10);
const BUCKET = process.env.GCS_CDN_BUCKET || "sunriseobx-cdn";

const storage = new Storage();
const bucket = storage.bucket(BUCKET);

// CORS
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  next();
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Autoindex — list files/dirs at a prefix
app.get("/{*splat}", async (req, res) => {
  const rawPath = decodeURIComponent(req.path).replace(/^\/+/, "");

  // If path looks like a file (has extension), serve it
  if (rawPath && /\.\w{2,5}$/.test(rawPath)) {
    try {
      const file = bucket.file(rawPath);
      const [exists] = await file.exists();
      if (!exists) { res.status(404).json({ error: "Not found" }); return; }

      const [metadata] = await file.getMetadata();
      res.set("Content-Type", metadata.contentType || "application/octet-stream");
      res.set("Cache-Control", "public, max-age=86400, s-maxage=604800");
      res.set("ETag", metadata.etag || "");
      file.createReadStream().pipe(res);
    } catch (err) {
      console.error("File serve error:", err);
      res.status(500).json({ error: "Internal error" });
    }
    return;
  }

  // Directory listing
  const prefix = rawPath ? (rawPath.endsWith("/") ? rawPath : rawPath + "/") : "";
  try {
    const [files] = await bucket.getFiles({ prefix, delimiter: "/" });

    // Get "subdirectories" from the API prefixes
    const [, , apiMeta] = await bucket.getFiles({ prefix, delimiter: "/", autoPaginate: false });
    const prefixes = apiMeta?.prefixes || [];

    const dirs = prefixes.map((p) => {
      const name = p.replace(prefix, "").replace(/\/$/, "");
      return { name: name + "/", type: "dir", path: "/" + p };
    });

    const fileEntries = files
      .filter((f) => f.name !== prefix) // exclude the prefix itself
      .map((f) => {
        const name = f.name.replace(prefix, "");
        if (name.includes("/")) return null; // skip nested
        const meta = f.metadata;
        return {
          name,
          type: "file",
          path: "/" + f.name,
          size: parseInt(meta.size || "0", 10),
          contentType: meta.contentType || "",
          updated: meta.updated || "",
        };
      })
      .filter(Boolean);

    const entries = [...dirs, ...fileEntries];

    // JSON response if requested
    if (req.headers.accept?.includes("application/json")) {
      res.json({ prefix: "/" + prefix, entries });
      return;
    }

    // HTML autoindex
    const parent = prefix ? "/" + prefix.split("/").slice(0, -2).join("/") + "/" : null;
    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Index of /${prefix}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 2rem; background: #f8fafc; color: #334e68; }
  h1 { color: #1a3550; font-size: 1.2rem; margin-bottom: 1.5rem; }
  h1 span { color: #f97316; }
  .listing { background: white; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
  .entry { display: flex; align-items: center; padding: 0.6rem 1rem; border-bottom: 1px solid #f0f4f8; gap: 0.75rem; }
  .entry:last-child { border-bottom: none; }
  .entry:hover { background: #f8fafc; }
  .icon { width: 20px; text-align: center; font-size: 1rem; }
  .name { flex: 1; }
  .name a { color: #2563eb; text-decoration: none; font-weight: 500; }
  .name a:hover { text-decoration: underline; }
  .size { color: #627d98; font-size: 0.8rem; min-width: 70px; text-align: right; }
  .date { color: #9fb3c8; font-size: 0.75rem; min-width: 140px; text-align: right; }
  .preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; margin-top: 1.5rem; }
  .preview-card { border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; background: white; }
  .preview-card img { width: 100%; height: 140px; object-fit: cover; display: block; }
  .preview-card .label { padding: 0.4rem 0.6rem; font-size: 0.7rem; color: #334e68; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
</head><body>
<h1><span>Sunrise</span> CDN &mdash; /${prefix || ""}</h1>
<div class="listing">
${parent !== null ? `<div class="entry"><span class="icon">📁</span><span class="name"><a href="${parent.replace(/\/+/g, "/") || "/"}">..</a></span><span class="size"></span><span class="date"></span></div>` : ""}
${entries.map((e) => {
  if (!e) return "";
  const icon = e.type === "dir" ? "📁" : (e.contentType?.startsWith("image/") ? "🖼️" : "📄");
  const size = e.type === "file" && e.size ? formatSize(e.size) : "";
  const date = e.type === "file" && e.updated ? new Date(e.updated).toLocaleString() : "";
  return `<div class="entry"><span class="icon">${icon}</span><span class="name"><a href="${e.path}">${e.name}</a></span><span class="size">${size}</span><span class="date">${date}</span></div>`;
}).join("\n")}
</div>
${renderPreviewGrid(entries, prefix)}
</body></html>`;
    res.set("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    console.error("List error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function renderPreviewGrid(entries, prefix) {
  const images = entries.filter((e) => e && e.type === "file" && e.contentType?.startsWith("image/"));
  if (images.length === 0) return "";
  return `<div class="preview-grid">${images.map((e) => `<div class="preview-card"><a href="${e.path}"><img src="${e.path}" loading="lazy" alt="${e.name}"></a><div class="label">${e.name}</div></div>`).join("")}</div>`;
}

app.listen(port, () => {
  console.log(`sunriseobx-cdn listening on port ${port}`);
});
