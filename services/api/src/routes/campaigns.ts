import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getPool } from "../lib/db.js";
import { queryParcels } from "../lib/darecounty.js";

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

// Populate recipients from Dare County GIS data
campaignsRouter.post("/:id/populate", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not available" });
    return;
  }
  const pool = getPool();

  // Get campaign
  const campaign = await pool.query(
    "SELECT * FROM campaigns WHERE id = $1 AND status = 'draft'",
    [req.params.id]
  );
  if (campaign.rows.length === 0) {
    res.status(404).json({ error: "Campaign not found or not draft" });
    return;
  }

  const c = campaign.rows[0];

  // Build CQL filter from campaign filter settings
  let cqlFilter: string | null = null;
  if (c.filter_type && c.filter_value) {
    const val = c.filter_value.toUpperCase().replace(/'/g, "''");
    switch (c.filter_type) {
      case "owner":
        cqlFilter = `owner1 LIKE '%${val}%'`;
        break;
      case "street":
        cqlFilter = `stname LIKE '%${val}%'`;
        break;
      case "subdivision":
        cqlFilter = `subdivision LIKE '%${val}%'`;
        break;
      case "town":
        cqlFilter = `zipname LIKE '%${val}%'`;
        break;
      case "cql":
        cqlFilter = c.filter_value;
        break;
    }
  }

  // Fetch parcels from Dare County GIS
  const { parcels } = await queryParcels(cqlFilter);

  // Clear existing recipients
  await pool.query(
    "DELETE FROM campaign_recipients WHERE campaign_id = $1",
    [req.params.id]
  );

  // Insert recipients (only those with mailing addresses)
  let inserted = 0;
  for (const p of parcels) {
    const addr = (p.mailaddr1 as string || "").trim();
    if (!addr) continue;

    await pool.query(
      `INSERT INTO campaign_recipients (campaign_id, owner_name, mail_address, mail_city, mail_state, mail_zip, parcel)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.params.id,
        ((p.owner1 as string) || "").trim(),
        [addr, ((p.mailaddr2 as string) || "").trim()].filter(Boolean).join(", "),
        ((p.mailcity as string) || "").trim(),
        ((p.mailstate as string) || "").trim(),
        ((p.mailzip as string) || "").trim(),
        ((p.parcel as string) || "").trim(),
      ]
    );
    inserted++;
  }

  // Update campaign recipient count
  await pool.query(
    "UPDATE campaigns SET total_recipients = $1, updated_at = NOW() WHERE id = $2",
    [inserted, req.params.id]
  );

  res.json({ populated: inserted, total_parcels: parcels.length });
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
