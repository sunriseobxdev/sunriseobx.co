import { Router, raw } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requirePrivilege } from "../middleware/rbac.js";
import { Storage } from "@google-cloud/storage";
import multer from "multer";

export const mediaRouter = Router();
mediaRouter.use(authMiddleware);

const BUCKET = process.env.GCS_CDN_BUCKET || "sunriseobx-cdn";
const CDN_BASE = process.env.CDN_URL || "https://cdn.sunriseobx.co";

function getStorage() {
  return new Storage();
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// List files/directories at a prefix
mediaRouter.get(
  "/browse",
  requirePrivilege("manage_jobs"),
  async (req, res) => {
    try {
      const prefix = (req.query.path as string || "").replace(/^\/+/, "");
      const bucket = getStorage().bucket(BUCKET);
      const [files, , apiMeta] = await bucket.getFiles({
        prefix: prefix ? (prefix.endsWith("/") ? prefix : prefix + "/") : "",
        delimiter: "/",
        autoPaginate: false,
      });

      const normalizedPrefix = prefix ? (prefix.endsWith("/") ? prefix : prefix + "/") : "";
      const prefixes: string[] = (apiMeta as any)?.prefixes || [];

      const dirs = prefixes.map((p) => ({
        name: p.replace(normalizedPrefix, "").replace(/\/$/, ""),
        type: "dir" as const,
        path: p,
      }));

      const fileEntries = files
        .filter((f) => f.name !== normalizedPrefix)
        .map((f) => {
          const name = f.name.replace(normalizedPrefix, "");
          if (name.includes("/")) return null;
          return {
            name,
            type: "file" as const,
            path: f.name,
            url: `${CDN_BASE}/${f.name}`,
            size: parseInt(String(f.metadata.size || "0"), 10),
            contentType: f.metadata.contentType || "",
            updated: f.metadata.updated || "",
          };
        })
        .filter(Boolean);

      res.json({ prefix: normalizedPrefix, entries: [...dirs, ...fileEntries] });
    } catch (err) {
      console.error("Media browse error:", err);
      res.status(500).json({ error: "Failed to list media" });
    }
  }
);

// Upload file(s)
mediaRouter.post(
  "/upload",
  requirePrivilege("manage_jobs"),
  upload.array("files", 50),
  async (req, res) => {
    try {
      const destPath = (req.body.path || "img/uploads/").replace(/^\/+/, "");
      const bucket = getStorage().bucket(BUCKET);
      const uploaded: { name: string; path: string; url: string }[] = [];

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: "No files provided" });
        return;
      }

      for (const file of files) {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
        const gcsPath = `${destPath.endsWith("/") ? destPath : destPath + "/"}${safeName}`;
        const gcsFile = bucket.file(gcsPath);
        await gcsFile.save(file.buffer, {
          contentType: file.mimetype,
          metadata: { cacheControl: "public, max-age=86400" },
        });
        uploaded.push({ name: safeName, path: gcsPath, url: `${CDN_BASE}/${gcsPath}` });
      }

      res.json({ uploaded });
    } catch (err) {
      console.error("Media upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// Delete file
mediaRouter.delete(
  "/file",
  requirePrivilege("manage_jobs"),
  async (req, res) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) {
        res.status(400).json({ error: "path required" });
        return;
      }
      const bucket = getStorage().bucket(BUCKET);
      await bucket.file(filePath).delete();
      res.json({ deleted: true });
    } catch (err) {
      console.error("Media delete error:", err);
      res.status(500).json({ error: "Delete failed" });
    }
  }
);

// ── FUSE Filesystem endpoints (mount_media privilege) ──

// Stat a file or directory
mediaRouter.get(
  "/fs/stat",
  requirePrivilege("mount_media"),
  async (req, res) => {
    try {
      const filePath = (req.query.path as string || "").replace(/^\/+/, "");
      const bucket = getStorage().bucket(BUCKET);

      // Check if it's a "directory" (prefix with children)
      if (!filePath || filePath.endsWith("/")) {
        const prefix = filePath || "";
        const [files, , meta] = await bucket.getFiles({ prefix, delimiter: "/", maxResults: 1, autoPaginate: false });
        const prefixes: string[] = (meta as any)?.prefixes || [];
        if (files.length > 0 || prefixes.length > 0 || !filePath) {
          res.json({ type: "dir", size: 0, modified: new Date().toISOString() });
          return;
        }
      }

      // Check as file
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      if (!exists) {
        // Maybe it's a directory without trailing slash
        const [, , meta] = await bucket.getFiles({ prefix: filePath + "/", delimiter: "/", maxResults: 1, autoPaginate: false });
        const prefixes: string[] = (meta as any)?.prefixes || [];
        if (prefixes.length > 0) {
          res.json({ type: "dir", size: 0, modified: new Date().toISOString() });
          return;
        }
        res.status(404).json({ error: "Not found" });
        return;
      }

      const [metadata] = await file.getMetadata();
      res.json({
        type: "file",
        size: parseInt(String(metadata.size || "0"), 10),
        contentType: metadata.contentType || "application/octet-stream",
        modified: metadata.updated || metadata.timeCreated || new Date().toISOString(),
      });
    } catch (err) {
      console.error("FS stat error:", err);
      res.status(500).json({ error: "Stat failed" });
    }
  }
);

// Read file content (supports Range header for partial reads)
mediaRouter.get(
  "/fs/read",
  requirePrivilege("mount_media"),
  async (req, res) => {
    try {
      const filePath = (req.query.path as string || "").replace(/^\/+/, "");
      if (!filePath) { res.status(400).json({ error: "path required" }); return; }

      const bucket = getStorage().bucket(BUCKET);
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      if (!exists) { res.status(404).json({ error: "Not found" }); return; }

      const [metadata] = await file.getMetadata();
      const size = parseInt(String(metadata.size || "0"), 10);
      res.set("Content-Type", metadata.contentType || "application/octet-stream");

      // Support Range requests
      const range = req.headers.range;
      if (range) {
        const match = range.match(/bytes=(\d+)-(\d*)/);
        if (match) {
          const start = parseInt(match[1], 10);
          const end = match[2] ? parseInt(match[2], 10) : size - 1;
          res.status(206);
          res.set("Content-Range", `bytes ${start}-${end}/${size}`);
          res.set("Content-Length", String(end - start + 1));
          file.createReadStream({ start, end: end + 1 }).pipe(res);
          return;
        }
      }

      res.set("Content-Length", String(size));
      file.createReadStream().pipe(res);
    } catch (err) {
      console.error("FS read error:", err);
      res.status(500).json({ error: "Read failed" });
    }
  }
);

// Write file content (raw body)
mediaRouter.put(
  "/fs/write",
  requirePrivilege("mount_media"),
  raw({ type: "*/*", limit: "50mb" }),
  async (req, res) => {
    try {
      const filePath = (req.query.path as string || "").replace(/^\/+/, "");
      if (!filePath) { res.status(400).json({ error: "path required" }); return; }

      const bucket = getStorage().bucket(BUCKET);
      const file = bucket.file(filePath);
      const contentType = req.headers["content-type"] || "application/octet-stream";
      await file.save(req.body, {
        contentType,
        metadata: { cacheControl: "public, max-age=86400" },
      });

      res.json({ written: true, size: req.body.length });
    } catch (err) {
      console.error("FS write error:", err);
      res.status(500).json({ error: "Write failed" });
    }
  }
);

// Rename/move file
mediaRouter.post(
  "/fs/rename",
  requirePrivilege("mount_media"),
  async (req, res) => {
    try {
      const { from, to } = req.body;
      if (!from || !to) { res.status(400).json({ error: "from and to required" }); return; }

      const bucket = getStorage().bucket(BUCKET);
      await bucket.file(from.replace(/^\/+/, "")).move(to.replace(/^\/+/, ""));
      res.json({ renamed: true });
    } catch (err) {
      console.error("FS rename error:", err);
      res.status(500).json({ error: "Rename failed" });
    }
  }
);

// Readdir — lightweight listing for FUSE
mediaRouter.get(
  "/fs/readdir",
  requirePrivilege("mount_media"),
  async (req, res) => {
    try {
      const prefix = (req.query.path as string || "").replace(/^\/+/, "");
      const normalizedPrefix = prefix ? (prefix.endsWith("/") ? prefix : prefix + "/") : "";
      const bucket = getStorage().bucket(BUCKET);
      const [files, , meta] = await bucket.getFiles({ prefix: normalizedPrefix, delimiter: "/", autoPaginate: false });
      const prefixes: string[] = (meta as any)?.prefixes || [];

      const entries: { name: string; type: "file" | "dir"; size: number }[] = [];

      for (const p of prefixes) {
        const name = p.replace(normalizedPrefix, "").replace(/\/$/, "");
        if (name) entries.push({ name, type: "dir", size: 0 });
      }

      for (const f of files) {
        const name = f.name.replace(normalizedPrefix, "");
        if (!name || name.includes("/") || name === ".keep") continue;
        entries.push({
          name,
          type: "file",
          size: parseInt(String(f.metadata.size || "0"), 10),
        });
      }

      res.json({ entries });
    } catch (err) {
      console.error("FS readdir error:", err);
      res.status(500).json({ error: "Readdir failed" });
    }
  }
);

// Create directory (just a placeholder object)
mediaRouter.post(
  "/mkdir",
  requirePrivilege("manage_jobs"),
  async (req, res) => {
    try {
      const { path: dirPath } = req.body;
      if (!dirPath) {
        res.status(400).json({ error: "path required" });
        return;
      }
      const normalized = dirPath.replace(/^\/+/, "").replace(/\/*$/, "") + "/";
      const bucket = getStorage().bucket(BUCKET);
      await bucket.file(normalized + ".keep").save("", { contentType: "text/plain" });
      res.json({ created: normalized });
    } catch (err) {
      console.error("Media mkdir error:", err);
      res.status(500).json({ error: "Failed to create directory" });
    }
  }
);
