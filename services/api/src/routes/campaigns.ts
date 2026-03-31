import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getPool } from "../lib/db.js";

export const campaignsRouter = Router();

campaignsRouter.use(authMiddleware);

// List campaigns
campaignsRouter.get("/", async (_req, res) => {
  if (!process.env.DATABASE_URL) {
    res.json([]);
    return;
  }
  const pool = getPool();
  const result = await pool.query(
    "SELECT * FROM campaigns ORDER BY created_at DESC"
  );
  res.json(result.rows);
});

// Get single campaign with recipient count
campaignsRouter.get("/:id", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not available" });
    return;
  }
  const pool = getPool();
  const result = await pool.query("SELECT * FROM campaigns WHERE id = $1", [
    req.params.id,
  ]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const recipients = await pool.query(
    "SELECT count(*) as total, count(*) FILTER (WHERE status='sent') as sent FROM campaign_recipients WHERE campaign_id = $1",
    [req.params.id]
  );
  res.json({ ...result.rows[0], ...recipients.rows[0] });
});

// Create campaign
campaignsRouter.post("/", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not available" });
    return;
  }
  const { name, subject, body_html, filter_type, filter_value } = req.body;
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO campaigns (name, subject, body_html, filter_type, filter_value, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, subject, body_html, filter_type, filter_value, req.user?.userId]
  );
  res.status(201).json(result.rows[0]);
});

// Update campaign (draft only)
campaignsRouter.put("/:id", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not available" });
    return;
  }
  const { name, subject, body_html, filter_type, filter_value } = req.body;
  const pool = getPool();
  const result = await pool.query(
    `UPDATE campaigns SET name=$1, subject=$2, body_html=$3, filter_type=$4, filter_value=$5, updated_at=NOW()
     WHERE id=$6 AND status='draft' RETURNING *`,
    [name, subject, body_html, filter_type, filter_value, req.params.id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Not found or already sent" });
    return;
  }
  res.json(result.rows[0]);
});

// Populate recipients from LOCAL parcels database
campaignsRouter.post("/:id/populate", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not available" });
    return;
  }
  const pool = getPool();

  const campaign = await pool.query(
    "SELECT * FROM campaigns WHERE id = $1 AND status = 'draft'",
    [req.params.id]
  );
  if (campaign.rows.length === 0) {
    res.status(404).json({ error: "Campaign not found or not draft" });
    return;
  }

  // Accept advanced filter from request body, or fall back to campaign's stored filter
  const body = req.body || {};
  const c = campaign.rows[0];

  const towns: string[] = body.towns || (c.filter_type === "town" && c.filter_value ? [c.filter_value.toUpperCase()] : []);
  const excludeTowns: string[] = body.excludeTowns || [];
  const minValue: number | null = body.minValue ?? null;
  const maxValue: number | null = body.maxValue ?? null;
  const outOfTownOnly: boolean = body.outOfTownOnly ?? false;
  const search: string | null = body.search || (c.filter_type === "owner" ? c.filter_value : null);

  // Build SQL query against local parcels table
  const conditions: string[] = ["TRIM(COALESCE(mailaddr1, '')) != ''"];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (towns.length > 0) {
    conditions.push(`UPPER(TRIM(zipname)) IN (${towns.map(() => `$${paramIdx++}`).join(",")})`);
    params.push(...towns.map((t: string) => t.toUpperCase()));
  }
  for (const t of excludeTowns) {
    conditions.push(`UPPER(TRIM(zipname)) != $${paramIdx++}`);
    params.push(t.toUpperCase());
  }
  if (minValue != null) { conditions.push(`totval >= $${paramIdx++}`); params.push(minValue); }
  if (maxValue != null) { conditions.push(`totval <= $${paramIdx++}`); params.push(maxValue); }
  if (outOfTownOnly) { conditions.push(`TRIM(mailstate) NOT IN ('NC', '')`); }
  if (search) { conditions.push(`owner1 ILIKE $${paramIdx++}`); params.push(`%${search}%`); }

  const where = conditions.join(" AND ");
  const parcelsResult = await pool.query(`SELECT * FROM parcels WHERE ${where}`, params);
  const parcels = parcelsResult.rows;

  // Clear existing recipients
  await pool.query("DELETE FROM campaign_recipients WHERE campaign_id = $1", [req.params.id]);

  // Batch insert recipients
  let inserted = 0;
  for (const p of parcels) {
    const addr = (p.mailaddr1 || "").trim();
    if (!addr) continue;
    await pool.query(
      `INSERT INTO campaign_recipients (campaign_id, owner_name, mail_address, mail_city, mail_state, mail_zip, parcel)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.params.id,
        (p.owner1 || "").trim(),
        [addr, (p.mailaddr2 || "").trim()].filter(Boolean).join(", "),
        (p.mailcity || "").trim(),
        (p.mailstate || "").trim(),
        (p.mailzip || "").trim(),
        (p.parcel || "").trim(),
      ]
    );
    inserted++;
  }

  await pool.query(
    "UPDATE campaigns SET total_recipients = $1, updated_at = NOW() WHERE id = $2",
    [inserted, req.params.id]
  );

  res.json({ populated: inserted, total_parcels: parcels.length });
});

// Export campaign recipients as CSV
campaignsRouter.get("/:id/export", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not available" });
    return;
  }
  const pool = getPool();
  const result = await pool.query(
    "SELECT * FROM campaign_recipients WHERE campaign_id = $1 ORDER BY owner_name",
    [req.params.id]
  );

  const headers = "owner_name,mail_address,mail_city,mail_state,mail_zip,parcel\n";
  const rows = result.rows.map((r: Record<string, unknown>) =>
    [r.owner_name, r.mail_address, r.mail_city, r.mail_state, r.mail_zip, r.parcel]
      .map((v) => `"${String(v || "").replace(/"/g, '""')}"`)
      .join(",")
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=campaign-${req.params.id}-recipients.csv`);
  res.send(headers + rows.join("\n"));
});

// Get campaign recipients
campaignsRouter.get("/:id/recipients", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.json([]);
    return;
  }
  const pool = getPool();
  const limit = parseInt((req.query.limit as string) || "100", 10);
  const offset = parseInt((req.query.offset as string) || "0", 10);
  const result = await pool.query(
    "SELECT * FROM campaign_recipients WHERE campaign_id = $1 ORDER BY owner_name LIMIT $2 OFFSET $3",
    [req.params.id, limit, offset]
  );
  res.json(result.rows);
});

// Delete campaign
campaignsRouter.delete("/:id", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not available" });
    return;
  }
  const pool = getPool();
  await pool.query("DELETE FROM campaigns WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});
