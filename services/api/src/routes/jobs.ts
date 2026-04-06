import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requirePrivilege } from "../middleware/rbac.js";
import { getPool } from "../lib/db.js";
import { sendJobUpdate } from "../lib/email.js";

export const jobsRouter = Router();
jobsRouter.use(authMiddleware);

// Generate next job number
async function nextJobNumber(): Promise<string> {
  const pool = getPool();
  const year = new Date().getFullYear();
  const prefix = `SUN-${year}-`;
  const result = await pool.query(
    `SELECT job_number FROM jobs WHERE job_number LIKE $1 ORDER BY job_number DESC LIMIT 1`,
    [`${prefix}%`]
  );
  if (result.rows.length === 0) return `${prefix}001`;
  const lastNum = parseInt(result.rows[0].job_number.slice(prefix.length), 10);
  return `${prefix}${String(lastNum + 1).padStart(3, "0")}`;
}

// List jobs
jobsRouter.get("/", requirePrivilege("manage_jobs"), async (_req, res) => {
  const pool = getPool();
  const result = await pool.query(
    `SELECT j.*, c.full_name AS customer_name, c.email AS customer_email
     FROM jobs j LEFT JOIN customers c ON j.customer_id = c.id
     ORDER BY j.created_at DESC`
  );
  res.json(result.rows);
});

// Create job
jobsRouter.post("/", requirePrivilege("manage_jobs"), async (req, res) => {
  const {
    customer_id, customer_email, customer_name,
    title, description, service_type,
    job_address_line1, job_address_city, job_address_state, job_address_zip,
    contract_amount, deposit_amount,
    estimated_start, estimated_end,
    assigned_to, permit_status, notes,
  } = req.body;

  const pool = getPool();
  let custId = customer_id;

  // Create customer inline if email provided but no ID
  if (!custId && customer_email) {
    const existing = await pool.query(
      `SELECT id FROM customers WHERE email = $1`,
      [customer_email.toLowerCase().trim()]
    );
    if (existing.rows.length > 0) {
      custId = existing.rows[0].id;
    } else {
      const created = await pool.query(
        `INSERT INTO customers (email, full_name) VALUES ($1, $2) RETURNING id`,
        [customer_email.toLowerCase().trim(), customer_name || null]
      );
      custId = created.rows[0].id;
    }
  }

  const jobNumber = await nextJobNumber();

  const result = await pool.query(
    `INSERT INTO jobs (job_number, customer_id, title, description, service_type,
       job_address_line1, job_address_city, job_address_state, job_address_zip,
       contract_amount, deposit_amount, estimated_start, estimated_end,
       assigned_to, permit_status, notes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     RETURNING *`,
    [
      jobNumber, custId, title, description, service_type,
      job_address_line1, job_address_city, job_address_state, job_address_zip,
      contract_amount || null, deposit_amount || null,
      estimated_start || null, estimated_end || null,
      assigned_to || null, permit_status || "na", notes || null,
      req.user?.userId,
    ]
  );

  res.status(201).json(result.rows[0]);
});

// Get single job with related data
jobsRouter.get("/:id", requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  const job = await pool.query(
    `SELECT j.*, c.full_name AS customer_name, c.email AS customer_email,
            c.phone AS customer_phone, c.address_line1 AS customer_address
     FROM jobs j LEFT JOIN customers c ON j.customer_id = c.id
     WHERE j.id = $1`,
    [req.params.id]
  );
  if (job.rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [milestones, events, changeOrders, agreements, payments, invoices, photos, documents, messages, punchList] =
    await Promise.all([
      pool.query(`SELECT * FROM job_milestones WHERE job_id = $1 ORDER BY sort_order, created_at`, [req.params.id]),
      pool.query(`SELECT * FROM job_events WHERE job_id = $1 ORDER BY start_time`, [req.params.id]),
      pool.query(`SELECT * FROM job_change_orders WHERE job_id = $1 ORDER BY created_at`, [req.params.id]),
      pool.query(`SELECT id, status, signed_at, created_at FROM job_agreements WHERE job_id = $1 ORDER BY created_at`, [req.params.id]),
      pool.query(`SELECT * FROM job_payments WHERE job_id = $1 ORDER BY created_at`, [req.params.id]),
      pool.query(`SELECT id, invoice_number, client_name, total, status, issue_date, due_date, pdf_path, created_at FROM invoices WHERE job_id = $1 ORDER BY issue_date DESC`, [req.params.id]),
      pool.query(`SELECT * FROM job_photos WHERE job_id = $1 ORDER BY created_at`, [req.params.id]),
      pool.query(`SELECT * FROM job_documents WHERE job_id = $1 ORDER BY created_at`, [req.params.id]),
      pool.query(`SELECT * FROM job_messages WHERE job_id = $1 ORDER BY created_at`, [req.params.id]),
      pool.query(`SELECT * FROM job_punch_list WHERE job_id = $1 ORDER BY created_at`, [req.params.id]),
    ]);

  res.json({
    ...job.rows[0],
    milestones: milestones.rows,
    events: events.rows,
    change_orders: changeOrders.rows,
    agreements: agreements.rows,
    payments: payments.rows,
    invoices: invoices.rows,
    photos: photos.rows,
    documents: documents.rows,
    messages: messages.rows,
    punch_list: punchList.rows,
  });
});

// Update job
jobsRouter.put("/:id", requirePrivilege("manage_jobs"), async (req, res) => {
  const {
    title, description, status, service_type,
    job_address_line1, job_address_city, job_address_state, job_address_zip,
    contract_amount, deposit_amount, deposit_paid,
    estimated_start, estimated_end, actual_start, actual_end,
    assigned_to, permit_number, permit_status, notes,
  } = req.body;

  const pool = getPool();
  const result = await pool.query(
    `UPDATE jobs SET
       title = COALESCE($1, title), description = COALESCE($2, description),
       status = COALESCE($3, status), service_type = COALESCE($4, service_type),
       job_address_line1 = COALESCE($5, job_address_line1),
       job_address_city = COALESCE($6, job_address_city),
       job_address_state = COALESCE($7, job_address_state),
       job_address_zip = COALESCE($8, job_address_zip),
       contract_amount = COALESCE($9, contract_amount),
       deposit_amount = COALESCE($10, deposit_amount),
       deposit_paid = COALESCE($11, deposit_paid),
       estimated_start = COALESCE($12, estimated_start),
       estimated_end = COALESCE($13, estimated_end),
       actual_start = COALESCE($14, actual_start),
       actual_end = COALESCE($15, actual_end),
       assigned_to = COALESCE($16, assigned_to),
       permit_number = COALESCE($17, permit_number),
       permit_status = COALESCE($18, permit_status),
       notes = COALESCE($19, notes),
       updated_at = NOW()
     WHERE id = $20 RETURNING *`,
    [
      title, description, status, service_type,
      job_address_line1, job_address_city, job_address_state, job_address_zip,
      contract_amount, deposit_amount, deposit_paid,
      estimated_start, estimated_end, actual_start, actual_end,
      assigned_to, permit_number, permit_status, notes,
      req.params.id,
    ]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(result.rows[0]);
});

// --- Milestones ---

jobsRouter.get("/:id/milestones", requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM job_milestones WHERE job_id = $1 ORDER BY sort_order, created_at`,
    [req.params.id]
  );
  res.json(result.rows);
});

jobsRouter.post("/:id/milestones", requirePrivilege("manage_jobs"), async (req, res) => {
  const { title, description, due_date, sort_order } = req.body;
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO job_milestones (job_id, title, description, due_date, sort_order)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.params.id, title, description, due_date || null, sort_order || 0]
  );
  res.status(201).json(result.rows[0]);
});

jobsRouter.put("/:id/milestones/:mid", requirePrivilege("manage_jobs"), async (req, res) => {
  const { title, description, status, due_date } = req.body;
  const pool = getPool();
  const completedAt = status === "completed" ? new Date() : null;
  const completedBy = status === "completed" ? req.user?.userId : null;

  const result = await pool.query(
    `UPDATE job_milestones SET
       title = COALESCE($1, title), description = COALESCE($2, description),
       status = COALESCE($3, status), due_date = COALESCE($4, due_date),
       completed_at = COALESCE($5, completed_at), completed_by = COALESCE($6, completed_by)
     WHERE id = $7 AND job_id = $8 RETURNING *`,
    [title, description, status, due_date, completedAt, completedBy, req.params.mid, req.params.id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  // Email customer about the milestone update
  const milestone = result.rows[0];
  try {
    const job = await pool.query(
      `SELECT j.job_number, j.title AS job_title, c.email, c.full_name
       FROM jobs j LEFT JOIN customers c ON j.customer_id = c.id
       WHERE j.id = $1`,
      [req.params.id]
    );
    const j = job.rows[0];
    if (j?.email) {
      const statusLabel = milestone.status === "completed" ? "Completed" : milestone.status === "in_progress" ? "In Progress" : "Upcoming";
      const msg = milestone.description || `Status updated to: ${statusLabel}`;
      await sendJobUpdate(j.email, j.full_name, j.job_number, milestone.title, msg);
    }
  } catch (err) {
    console.error("Milestone email failed (non-blocking):", err);
  }

  res.json(result.rows[0]);
});

// --- Calendar Events ---

jobsRouter.get("/:id/events", requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM job_events WHERE job_id = $1 ORDER BY start_time`,
    [req.params.id]
  );
  res.json(result.rows);
});

jobsRouter.post("/:id/events", requirePrivilege("manage_jobs"), async (req, res) => {
  const { title, description, start_time, end_time, all_day, event_type } = req.body;
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO job_events (job_id, title, description, start_time, end_time, all_day, event_type, created_by_type, created_by_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'admin', $8) RETURNING *`,
    [req.params.id, title, description, start_time, end_time || null, all_day || false, event_type || "work", req.user?.userId]
  );
  res.status(201).json(result.rows[0]);
});

jobsRouter.delete("/:id/events/:eid", requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  await pool.query(`DELETE FROM job_events WHERE id = $1 AND job_id = $2`, [req.params.eid, req.params.id]);
  res.json({ success: true });
});

// --- Change Orders ---

jobsRouter.get("/:id/change-orders", requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM job_change_orders WHERE job_id = $1 ORDER BY created_at`,
    [req.params.id]
  );
  res.json(result.rows);
});

jobsRouter.post("/:id/change-orders", requirePrivilege("manage_jobs"), async (req, res) => {
  const { title, description, amount } = req.body;
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO job_change_orders (job_id, title, description, amount)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.params.id, title, description, amount || null]
  );
  res.status(201).json(result.rows[0]);
});

jobsRouter.put("/:id/change-orders/:coid", requirePrivilege("manage_jobs"), async (req, res) => {
  const { status } = req.body;
  const pool = getPool();
  const approvedAt = status === "approved" ? new Date() : null;
  const result = await pool.query(
    `UPDATE job_change_orders SET status = $1, approved_at = COALESCE($2, approved_at), approved_by = $3
     WHERE id = $4 AND job_id = $5 RETURNING *`,
    [status, approvedAt, req.user?.userId, req.params.coid, req.params.id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(result.rows[0]);
});

// --- Photos ---

jobsRouter.get("/:id/photos", requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM job_photos WHERE job_id = $1 ORDER BY created_at`,
    [req.params.id]
  );
  res.json(result.rows);
});

jobsRouter.post("/:id/photos", requirePrivilege("manage_jobs"), async (req, res) => {
  const { url, caption, phase } = req.body;
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO job_photos (job_id, url, caption, phase, uploaded_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.params.id, url, caption || null, phase || null, req.user?.userId]
  );
  res.status(201).json(result.rows[0]);
});

jobsRouter.delete("/:id/photos/:pid", requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  await pool.query(`DELETE FROM job_photos WHERE id = $1 AND job_id = $2`, [req.params.pid, req.params.id]);
  res.json({ success: true });
});

// --- Documents ---

jobsRouter.get("/:id/documents", requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM job_documents WHERE job_id = $1 ORDER BY created_at`,
    [req.params.id]
  );
  res.json(result.rows);
});

jobsRouter.post("/:id/documents", requirePrivilege("manage_jobs"), async (req, res) => {
  const { name, doc_type, url } = req.body;
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO job_documents (job_id, name, doc_type, url, uploaded_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.params.id, name, doc_type || null, url, req.user?.userId]
  );
  res.status(201).json(result.rows[0]);
});

jobsRouter.delete("/:id/documents/:did", requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  await pool.query(`DELETE FROM job_documents WHERE id = $1 AND job_id = $2`, [req.params.did, req.params.id]);
  res.json({ success: true });
});

// --- Messages ---

jobsRouter.get("/:id/messages", requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM job_messages WHERE job_id = $1 ORDER BY created_at`,
    [req.params.id]
  );
  res.json(result.rows);
});

jobsRouter.post("/:id/messages", requirePrivilege("manage_jobs"), async (req, res) => {
  const { body } = req.body;
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO job_messages (job_id, sender_type, sender_id, sender_name, body)
     VALUES ($1, 'admin', $2, $3, $4) RETURNING *`,
    [req.params.id, req.user?.userId, req.user?.displayName || "Admin", body]
  );
  res.status(201).json(result.rows[0]);
});

// --- Punch List ---

jobsRouter.get("/:id/punch-list", requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM job_punch_list WHERE job_id = $1 ORDER BY created_at`,
    [req.params.id]
  );
  res.json(result.rows);
});

jobsRouter.post("/:id/punch-list", requirePrivilege("manage_jobs"), async (req, res) => {
  const { item } = req.body;
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO job_punch_list (job_id, item) VALUES ($1, $2) RETURNING *`,
    [req.params.id, item]
  );
  res.status(201).json(result.rows[0]);
});

jobsRouter.put("/:id/punch-list/:plid", requirePrivilege("manage_jobs"), async (req, res) => {
  const { status } = req.body;
  const pool = getPool();
  const completedAt = status === "done" ? new Date() : null;
  const result = await pool.query(
    `UPDATE job_punch_list SET status = $1, completed_at = COALESCE($2, completed_at), completed_by = $3
     WHERE id = $4 AND job_id = $5 RETURNING *`,
    [status, completedAt, req.user?.userId, req.params.plid, req.params.id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(result.rows[0]);
});

// --- Customers list (for job creation lookup) ---

jobsRouter.get("/customers/search", requirePrivilege("manage_jobs"), async (req, res) => {
  const { q } = req.query;
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, email, full_name, phone FROM customers
     WHERE email ILIKE $1 OR full_name ILIKE $1
     ORDER BY full_name LIMIT 20`,
    [`%${q || ""}%`]
  );
  res.json(result.rows);
});
