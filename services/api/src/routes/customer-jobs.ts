import { Router } from "express";
import { customerAuthMiddleware } from "../middleware/customer-auth.js";
import { getPool } from "../lib/db.js";

export const customerJobsRouter = Router();
customerJobsRouter.use(customerAuthMiddleware);

// List customer's jobs
customerJobsRouter.get("/", async (req, res) => {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, job_number, title, status, service_type,
            job_address_line1, job_address_city, job_address_state, job_address_zip,
            contract_amount, estimated_start, estimated_end, actual_start, actual_end
     FROM jobs WHERE customer_id = $1
     ORDER BY created_at DESC`,
    [req.customer!.customerId]
  );
  res.json(result.rows);
});

// Get job detail
customerJobsRouter.get("/:id", async (req, res) => {
  const pool = getPool();
  const job = await pool.query(
    `SELECT id, job_number, title, description, status, service_type,
            job_address_line1, job_address_city, job_address_state, job_address_zip,
            contract_amount, deposit_amount, deposit_paid,
            estimated_start, estimated_end, actual_start, actual_end,
            permit_number, permit_status
     FROM jobs WHERE id = $1 AND customer_id = $2`,
    [req.params.id, req.customer!.customerId]
  );

  if (job.rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [milestones, events, changeOrders, agreements, payments, photos, messages, punchList, invoices] =
    await Promise.all([
      pool.query(`SELECT id, title, description, status, due_date, completed_at FROM job_milestones WHERE job_id = $1 ORDER BY sort_order, created_at`, [req.params.id]),
      pool.query(`SELECT id, title, description, start_time, end_time, all_day, event_type FROM job_events WHERE job_id = $1 ORDER BY start_time`, [req.params.id]),
      pool.query(`SELECT id, title, description, amount, status FROM job_change_orders WHERE job_id = $1 ORDER BY created_at`, [req.params.id]),
      pool.query(`SELECT id, status, signed_at, created_at FROM job_agreements WHERE job_id = $1 ORDER BY created_at`, [req.params.id]),
      pool.query(`SELECT id, amount, description, status, payment_type, paid_at FROM job_payments WHERE job_id = $1 ORDER BY created_at`, [req.params.id]),
      pool.query(`SELECT id, url, caption, phase, created_at FROM job_photos WHERE job_id = $1 ORDER BY created_at`, [req.params.id]),
      pool.query(`SELECT id, sender_type, sender_name, body, created_at FROM job_messages WHERE job_id = $1 ORDER BY created_at`, [req.params.id]),
      pool.query(`SELECT id, item, status, completed_at FROM job_punch_list WHERE job_id = $1 ORDER BY created_at`, [req.params.id]),
      pool.query(`SELECT id, invoice_number, total, status, due_date, paid_at FROM invoices WHERE job_id = $1 ORDER BY issue_date`, [req.params.id]),
    ]);

  res.json({
    ...job.rows[0],
    milestones: milestones.rows,
    events: events.rows,
    change_orders: changeOrders.rows,
    agreements: agreements.rows,
    payments: payments.rows,
    photos: photos.rows,
    messages: messages.rows,
    punch_list: punchList.rows,
    invoices: invoices.rows,
  });
});

// Customer can add calendar events (renter availability)
customerJobsRouter.post("/:id/events", async (req, res) => {
  const pool = getPool();
  // Verify ownership
  const job = await pool.query(`SELECT id FROM jobs WHERE id = $1 AND customer_id = $2`, [req.params.id, req.customer!.customerId]);
  if (job.rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const { title, description, start_time, end_time, all_day, event_type } = req.body;
  const result = await pool.query(
    `INSERT INTO job_events (job_id, title, description, start_time, end_time, all_day, event_type, created_by_type, created_by_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'customer', $8) RETURNING *`,
    [req.params.id, title, description, start_time, end_time || null, all_day || false, event_type || "renter", req.customer!.customerId]
  );
  res.status(201).json(result.rows[0]);
});

// Customer can send messages
customerJobsRouter.post("/:id/messages", async (req, res) => {
  const pool = getPool();
  const job = await pool.query(`SELECT id FROM jobs WHERE id = $1 AND customer_id = $2`, [req.params.id, req.customer!.customerId]);
  if (job.rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const { body } = req.body;
  const result = await pool.query(
    `INSERT INTO job_messages (job_id, sender_type, sender_id, sender_name, body)
     VALUES ($1, 'customer', $2, $3, $4) RETURNING *`,
    [req.params.id, req.customer!.customerId, req.customer!.email, body]
  );
  res.status(201).json(result.rows[0]);
});
