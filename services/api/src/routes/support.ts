import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requirePrivilege } from "../middleware/rbac.js";
import { customerAuthMiddleware } from "../middleware/customer-auth.js";
import { getPool } from "../lib/db.js";
import { sendEmail } from "../lib/email.js";

export const supportRouter = Router();

async function nextTicketNumber(): Promise<string> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT ticket_number FROM support_tickets ORDER BY created_at DESC LIMIT 1`
  );
  if (result.rows.length === 0) return "TKT-001";
  const last = parseInt(result.rows[0].ticket_number.replace("TKT-", ""), 10);
  return `TKT-${String(last + 1).padStart(3, "0")}`;
}

// --- Customer routes ---

// Create ticket (customer)
supportRouter.post(
  "/customer/tickets",
  customerAuthMiddleware,
  async (req, res) => {
    const { subject, category, body } = req.body;
    if (!subject || !body) {
      res.status(400).json({ error: "Subject and body required" });
      return;
    }

    const pool = getPool();
    const ticketNumber = await nextTicketNumber();

    const ticket = await pool.query(
      `INSERT INTO support_tickets (ticket_number, customer_id, customer_email, subject, category)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ticketNumber, req.customer!.customerId, req.customer!.email, subject, category || "general"]
    );

    await pool.query(
      `INSERT INTO support_messages (ticket_id, sender_type, sender_id, sender_name, body)
       VALUES ($1, 'customer', $2, $3, $4)`,
      [ticket.rows[0].id, req.customer!.customerId, req.customer!.email, body]
    );

    res.status(201).json(ticket.rows[0]);
  }
);

// List customer's tickets
supportRouter.get(
  "/customer/tickets",
  customerAuthMiddleware,
  async (req, res) => {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM support_tickets WHERE customer_id = $1 ORDER BY created_at DESC`,
      [req.customer!.customerId]
    );
    res.json(result.rows);
  }
);

// Get ticket with messages (customer)
supportRouter.get(
  "/customer/tickets/:id",
  customerAuthMiddleware,
  async (req, res) => {
    const pool = getPool();
    const ticket = await pool.query(
      `SELECT * FROM support_tickets WHERE id = $1 AND customer_id = $2`,
      [req.params.id, req.customer!.customerId]
    );
    if (ticket.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const messages = await pool.query(
      `SELECT * FROM support_messages WHERE ticket_id = $1 ORDER BY created_at`,
      [req.params.id]
    );
    res.json({ ...ticket.rows[0], messages: messages.rows });
  }
);

// Customer reply to ticket
supportRouter.post(
  "/customer/tickets/:id/reply",
  customerAuthMiddleware,
  async (req, res) => {
    const { body } = req.body;
    if (!body) {
      res.status(400).json({ error: "Body required" });
      return;
    }
    const pool = getPool();
    // Verify ownership
    const ticket = await pool.query(
      `SELECT id FROM support_tickets WHERE id = $1 AND customer_id = $2`,
      [req.params.id, req.customer!.customerId]
    );
    if (ticket.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const msg = await pool.query(
      `INSERT INTO support_messages (ticket_id, sender_type, sender_id, sender_name, body)
       VALUES ($1, 'customer', $2, $3, $4) RETURNING *`,
      [req.params.id, req.customer!.customerId, req.customer!.email, body]
    );
    await pool.query(`UPDATE support_tickets SET updated_at = NOW() WHERE id = $1`, [req.params.id]);
    res.status(201).json(msg.rows[0]);
  }
);

// --- Admin routes ---

// List all tickets
supportRouter.get(
  "/api/support/tickets",
  authMiddleware,
  async (_req, res) => {
    const pool = getPool();
    const result = await pool.query(
      `SELECT t.*, c.full_name AS customer_name,
              (SELECT count(*) FROM support_messages WHERE ticket_id = t.id) AS message_count
       FROM support_tickets t LEFT JOIN customers c ON t.customer_id = c.id
       ORDER BY CASE t.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, t.updated_at DESC`
    );
    res.json(result.rows);
  }
);

// Get ticket with messages (admin)
supportRouter.get(
  "/api/support/tickets/:id",
  authMiddleware,
  async (req, res) => {
    const pool = getPool();
    const ticket = await pool.query(
      `SELECT t.*, c.full_name AS customer_name, c.email AS customer_email_full
       FROM support_tickets t LEFT JOIN customers c ON t.customer_id = c.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (ticket.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const messages = await pool.query(
      `SELECT * FROM support_messages WHERE ticket_id = $1 ORDER BY created_at`,
      [req.params.id]
    );
    res.json({ ...ticket.rows[0], messages: messages.rows });
  }
);

// Admin reply to ticket
supportRouter.post(
  "/api/support/tickets/:id/reply",
  authMiddleware,
  async (req, res) => {
    const { body: msgBody } = req.body;
    if (!msgBody) {
      res.status(400).json({ error: "Body required" });
      return;
    }
    const pool = getPool();
    const msg = await pool.query(
      `INSERT INTO support_messages (ticket_id, sender_type, sender_id, sender_name, body)
       VALUES ($1, 'admin', $2, $3, $4) RETURNING *`,
      [req.params.id, req.user?.userId, req.user?.displayName || "Support", msgBody]
    );
    await pool.query(
      `UPDATE support_tickets SET status = 'in_progress', updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    // Notify customer via email
    const ticket = await pool.query(
      `SELECT t.ticket_number, t.subject, c.email, c.full_name
       FROM support_tickets t LEFT JOIN customers c ON t.customer_id = c.id WHERE t.id = $1`,
      [req.params.id]
    );
    if (ticket.rows[0]?.email) {
      const t = ticket.rows[0];
      try {
        await sendEmail(
          t.email,
          `Re: ${t.subject} (${t.ticket_number})`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:2rem;">
            <h2 style="color:#1a3550;">Sunrise Construction Support</h2>
            <p>Hi ${t.full_name || "there"},</p>
            <p>We've replied to your support ticket <strong>${t.ticket_number}</strong>:</p>
            <div style="background:#f0f7ff;border-left:4px solid #f97316;padding:1rem;margin:1rem 0;border-radius:4px;">
              ${msgBody}
            </div>
            <p style="color:#666;font-size:0.9rem;">Log in to your portal to view the full conversation.</p>
          </div>`
        );
      } catch {
        // non-critical
      }
    }

    res.status(201).json(msg.rows[0]);
  }
);

// Update ticket status
supportRouter.put(
  "/api/support/tickets/:id",
  authMiddleware,
  async (req, res) => {
    const { status, priority } = req.body;
    const pool = getPool();
    const closedAt = status === "closed" ? new Date() : null;
    const closedBy = status === "closed" ? req.user?.userId : null;

    const result = await pool.query(
      `UPDATE support_tickets SET
         status = COALESCE($1, status),
         priority = COALESCE($2, priority),
         closed_at = COALESCE($3, closed_at),
         closed_by = COALESCE($4, closed_by),
         updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [status, priority, closedAt, closedBy, req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(result.rows[0]);
  }
);
