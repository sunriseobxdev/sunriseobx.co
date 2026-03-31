import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getPool } from "../lib/db.js";

export const cmsRouter = Router();

// Public: list published posts
cmsRouter.get("/posts", async (_req, res) => {
  if (!process.env.DATABASE_URL) {
    res.json([]);
    return;
  }
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, slug, title, excerpt, image_url, published_at
     FROM cms_posts WHERE status = 'published'
     ORDER BY published_at DESC`
  );
  res.json(result.rows);
});

// Public: get single post by slug
cmsRouter.get("/posts/:slug", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const pool = getPool();
  const result = await pool.query(
    "SELECT * FROM cms_posts WHERE slug = $1 AND status = 'published'",
    [req.params.slug]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(result.rows[0]);
});

// Public: list published projects
cmsRouter.get("/projects", async (_req, res) => {
  if (!process.env.DATABASE_URL) {
    res.json([]);
    return;
  }
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, slug, title, description, images, services, location, featured
     FROM cms_projects WHERE status = 'published'
     ORDER BY featured DESC, created_at DESC`
  );
  res.json(result.rows);
});

// Public: get single project by slug
cmsRouter.get("/projects/:slug", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const pool = getPool();
  const result = await pool.query(
    "SELECT * FROM cms_projects WHERE slug = $1 AND status = 'published'",
    [req.params.slug]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(result.rows[0]);
});

// --- Admin CMS routes (auth required) ---

// List all posts (including drafts)
cmsRouter.get("/admin/posts", authMiddleware, async (_req, res) => {
  if (!process.env.DATABASE_URL) {
    res.json([]);
    return;
  }
  const pool = getPool();
  const result = await pool.query(
    "SELECT * FROM cms_posts ORDER BY updated_at DESC"
  );
  res.json(result.rows);
});

// Create post
cmsRouter.post("/admin/posts", authMiddleware, async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not available" });
    return;
  }
  const { slug, title, excerpt, content, image_url, status } = req.body;
  const pool = getPool();
  const publishedAt = status === "published" ? new Date() : null;
  const result = await pool.query(
    `INSERT INTO cms_posts (slug, title, excerpt, content, image_url, status, author_id, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [slug, title, excerpt, content ? JSON.stringify(content) : "{}", image_url, status || "draft", req.user?.userId, publishedAt]
  );
  res.status(201).json(result.rows[0]);
});

// Update post
cmsRouter.put("/admin/posts/:id", authMiddleware, async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not available" });
    return;
  }
  const { slug, title, excerpt, content, image_url, status } = req.body;
  const pool = getPool();
  const publishedAt = status === "published" ? new Date() : null;
  const result = await pool.query(
    `UPDATE cms_posts SET slug=$1, title=$2, excerpt=$3, content=$4, image_url=$5, status=$6, published_at=COALESCE($7, published_at), updated_at=NOW()
     WHERE id=$8 RETURNING *`,
    [slug, title, excerpt, content ? JSON.stringify(content) : "{}", image_url, status, publishedAt, req.params.id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(result.rows[0]);
});

// Delete post
cmsRouter.delete("/admin/posts/:id", authMiddleware, async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not available" });
    return;
  }
  const pool = getPool();
  await pool.query("DELETE FROM cms_posts WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});

// List all projects (admin)
cmsRouter.get("/admin/projects", authMiddleware, async (_req, res) => {
  if (!process.env.DATABASE_URL) {
    res.json([]);
    return;
  }
  const pool = getPool();
  const result = await pool.query(
    "SELECT * FROM cms_projects ORDER BY updated_at DESC"
  );
  res.json(result.rows);
});

// Create project
cmsRouter.post("/admin/projects", authMiddleware, async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not available" });
    return;
  }
  const { slug, title, description, images, services, location, status, featured } = req.body;
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO cms_projects (slug, title, description, images, services, location, status, featured)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [slug, title, description, images ? JSON.stringify(images) : "[]", services, location, status || "draft", featured || false]
  );
  res.status(201).json(result.rows[0]);
});

// Update project
cmsRouter.put("/admin/projects/:id", authMiddleware, async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not available" });
    return;
  }
  const { slug, title, description, images, services, location, status, featured } = req.body;
  const pool = getPool();
  const result = await pool.query(
    `UPDATE cms_projects SET slug=$1, title=$2, description=$3, images=$4, services=$5, location=$6, status=$7, featured=$8, updated_at=NOW()
     WHERE id=$9 RETURNING *`,
    [slug, title, description, images ? JSON.stringify(images) : "[]", services, location, status, featured, req.params.id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(result.rows[0]);
});

// Delete project
cmsRouter.delete("/admin/projects/:id", authMiddleware, async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not available" });
    return;
  }
  const pool = getPool();
  await pool.query("DELETE FROM cms_projects WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});
