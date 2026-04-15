import { Router } from "express";
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
