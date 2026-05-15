import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requirePrivilege } from "../middleware/rbac.js";
import { getPool } from "../lib/db.js";
import { uploadBuffer, getSignedUrl } from "../lib/gcs.js";
import { generateInvoicePdf, type InvoiceData } from "../lib/pdf-invoice.js";
import { sendEmail } from "../lib/email.js";

export const estimatesRouter = Router();

const COMPANY_NAME = "Sunrise Construction Services LLC";
const COMPANY_ADDRESS = "121 Pine Grove Lane, Point Harbor, NC 27964\nhello@sunriseobx.co | (252) 619-7966";
const BASE_URL = process.env.PUBLIC_URL || "https://sunriseobx.co";

// ── Public: view estimate (no auth, customer-facing) ──
estimatesRouter.get(
  "/public/:id",
  async (req, res) => {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT id, estimate_number, client_name, client_email, client_phone,
                client_address, job_address, description, line_items, subtotal,
                tax_rate, tax_amount, total, notes, valid_until, status, accepted_at
         FROM estimates WHERE id = $1`,
        [req.params.id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: "Estimate not found" });
        return;
      }
      // Track first view
      await pool.query(
        `UPDATE estimates SET viewed_at = COALESCE(viewed_at, NOW()) WHERE id = $1`,
        [req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Public estimate error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ── Public: accept estimate (no auth) ──
estimatesRouter.post(
  "/public/:id/accept",
  async (req, res) => {
    try {
      const pool = getPool();
      const est = await pool.query(
        `SELECT id, status, estimate_number, client_name, client_email FROM estimates WHERE id = $1`,
        [req.params.id]
      );
      if (est.rows.length === 0) {
        res.status(404).json({ error: "Estimate not found" });
        return;
      }
      const estimate = est.rows[0];
      if (estimate.status === "accepted") {
        res.json({ already: true, status: "accepted" });
        return;
      }
      if (estimate.status === "declined") {
        res.status(400).json({ error: "Estimate was declined" });
        return;
      }

      await pool.query(
        `UPDATE estimates SET status = 'accepted', accepted_at = NOW() WHERE id = $1`,
        [req.params.id]
      );

      // Notify admin
      try {
        await sendEmail(
          "hello@sunriseobx.co",
          `Estimate ${estimate.estimate_number} Accepted — ${estimate.client_name}`,
          `<div style="font-family: Arial, sans-serif; padding: 2rem;">
            <h2 style="color: #059669;">Estimate Accepted!</h2>
            <p><strong>${estimate.client_name}</strong> has accepted estimate <strong>${estimate.estimate_number}</strong>.</p>
            <p>Email: ${estimate.client_email || "N/A"}</p>
            <p style="color: #627d98;">Log in to the desk to create a job and send the agreement.</p>
          </div>`
        );
      } catch { /* non-critical */ }

      res.json({ accepted: true, status: "accepted" });
    } catch (err) {
      console.error("Accept estimate error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ── Public: decline estimate (no auth) ──
estimatesRouter.post(
  "/public/:id/decline",
  async (req, res) => {
    try {
      const pool = getPool();
      const result = await pool.query(
        `UPDATE estimates SET status = 'declined' WHERE id = $1 AND status IN ('draft','sent') RETURNING id`,
        [req.params.id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: "Not found or already responded" });
        return;
      }
      res.json({ declined: true, status: "declined" });
    } catch (err) {
      console.error("Decline estimate error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ── Admin routes (all require auth) ──

// List estimates
estimatesRouter.get("/", authMiddleware, requirePrivilege("manage_jobs"), async (_req, res) => {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM estimates ORDER BY created_at DESC`
  );
  res.json(result.rows);
});

// Get single estimate
estimatesRouter.get("/:id", authMiddleware, requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  const result = await pool.query("SELECT * FROM estimates WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Estimate not found" });
    return;
  }
  res.json(result.rows[0]);
});

// Create estimate + generate PDF
estimatesRouter.post("/", authMiddleware, requirePrivilege("manage_jobs"), async (req, res) => {
  try {
    const pool = getPool();
    const {
      estimateNumber, clientName, clientEmail, clientAddress, clientPhone,
      jobAddress, description, lineItems, taxRate, notes, validUntil,
    } = req.body;

    if (!estimateNumber || !clientName || !lineItems?.length) {
      res.status(400).json({ error: "estimateNumber, clientName, and lineItems are required" });
      return;
    }

    const items = (lineItems as { description: string; quantity: number; rate: number }[]).map((item) => ({
      ...item,
      amount: +(item.quantity * item.rate).toFixed(2),
    }));
    const subtotal = +items.reduce((s, i) => s + i.amount, 0).toFixed(2);
    const effectiveTaxRate = taxRate || 0;
    const taxAmount = +(subtotal * effectiveTaxRate).toFixed(2);
    const total = +(subtotal + taxAmount).toFixed(2);

    // Generate PDF
    const pdfData: InvoiceData = {
      invoiceNumber: estimateNumber,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: validUntil || "",
      clientName,
      clientAddress: clientAddress || "",
      clientEmail: clientEmail || "",
      lineItems: items,
      subtotal,
      taxRate: effectiveTaxRate,
      taxAmount,
      total,
      notes: notes || "",
      companyName: COMPANY_NAME,
      companyAddress: COMPANY_ADDRESS,
    };

    const pdfBuffer = await generateInvoicePdf(pdfData);
    const gcsPath = `estimates/${estimateNumber}.pdf`;
    await uploadBuffer(pdfBuffer, gcsPath);

    const result = await pool.query(
      `INSERT INTO estimates (
        estimate_number, client_name, client_email, client_address, client_phone,
        job_address, description, line_items, subtotal, tax_rate, tax_amount, total,
        notes, valid_until, pdf_path, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [
        estimateNumber, clientName, clientEmail || null, clientAddress || null, clientPhone || null,
        jobAddress || null, description || null, JSON.stringify(items), subtotal,
        effectiveTaxRate, taxAmount, total, notes || null, validUntil || null,
        gcsPath, req.user!.userId !== "legacy" ? req.user!.userId : null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "An estimate with this number already exists" });
      return;
    }
    console.error("Create estimate error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update estimate status
estimatesRouter.put("/:id", authMiddleware, requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  const { status, notes } = req.body;
  const setClauses: string[] = ["updated_at = NOW()"];
  const values: unknown[] = [];
  let idx = 1;

  if (status !== undefined) {
    setClauses.push(`status = $${idx++}`);
    values.push(status);
    if (status === "sent") setClauses.push(`sent_at = COALESCE(sent_at, NOW())`);
    else if (status === "accepted") setClauses.push(`accepted_at = NOW()`);
  }
  if (notes !== undefined) {
    setClauses.push(`notes = $${idx++}`);
    values.push(notes);
  }

  values.push(req.params.id);
  const result = await pool.query(
    `UPDATE estimates SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Estimate not found" });
    return;
  }
  res.json(result.rows[0]);
});

// Delete estimate
estimatesRouter.delete("/:id", authMiddleware, requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  await pool.query("DELETE FROM estimates WHERE id = $1", [req.params.id]);
  res.json({ deleted: true });
});

// Get PDF
estimatesRouter.get("/:id/pdf", authMiddleware, requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  const result = await pool.query("SELECT pdf_path FROM estimates WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0 || !result.rows[0].pdf_path) {
    res.status(404).json({ error: "PDF not found" });
    return;
  }
  const url = await getSignedUrl(result.rows[0].pdf_path);
  res.json({ url });
});

// Send estimate to customer
estimatesRouter.post("/:id/send", authMiddleware, requirePrivilege("manage_jobs"), async (req, res) => {
  try {
    const pool = getPool();
    const est = await pool.query("SELECT * FROM estimates WHERE id = $1", [req.params.id]);
    if (est.rows.length === 0) {
      res.status(404).json({ error: "Estimate not found" });
      return;
    }
    const estimate = est.rows[0];
    if (!estimate.client_email) {
      res.status(400).json({ error: "No client email on this estimate" });
      return;
    }

    const viewLink = `${BASE_URL}/estimate/${estimate.id}`;
    let pdfUrl = "";
    if (estimate.pdf_path) {
      try { pdfUrl = await getSignedUrl(estimate.pdf_path, 60 * 24 * 30); } catch { /* ok */ }
    }

    const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

    await sendEmail(
      estimate.client_email,
      `Estimate ${estimate.estimate_number} from Sunrise Construction — ${usd.format(estimate.total)}`,
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #1a3550;">Sunrise Construction</h2>
        <p>Hi ${estimate.client_name || "there"},</p>
        <p>Thank you for your interest in working with us. We&rsquo;ve prepared an estimate for your project:</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0;">
          <div style="font-size: 0.85rem; color: #334e68; margin-bottom: 0.5rem;"><strong>Estimate:</strong> ${estimate.estimate_number}</div>
          <div style="font-size: 1.3rem; font-weight: 700; color: #1a3550;">${usd.format(estimate.total)}</div>
          ${estimate.valid_until ? `<div style="font-size: 0.8rem; color: #627d98; margin-top: 0.25rem;">Valid until ${new Date(estimate.valid_until).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>` : ""}
        </div>
        ${estimate.description ? `<p style="color: #334e68; font-size: 0.9rem;">${estimate.description}</p>` : ""}
        <div style="text-align: center; margin: 2rem 0;">
          <a href="${viewLink}" style="display: inline-block; background: #f97316; color: white; padding: 0.85rem 2.5rem; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 1rem;">
            Review Estimate
          </a>
        </div>
        ${pdfUrl ? `<p style="text-align: center;"><a href="${pdfUrl}" style="color: #627d98; font-size: 0.8rem;">Download PDF</a></p>` : ""}
        <p style="color: #666; font-size: 0.85rem;">Questions? Call us at (252) 619-7966 or reply to this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 2rem 0;" />
        <p style="color: #999; font-size: 0.8rem;">Sunrise Construction Services LLC<br/>121 Pine Grove Lane, Point Harbor, NC 27964</p>
      </div>`
    );

    await pool.query(
      `UPDATE estimates SET status = 'sent', sent_at = COALESCE(sent_at, NOW()) WHERE id = $1`,
      [estimate.id]
    );

    res.json({ sent: true });
  } catch (err) {
    console.error("Send estimate error:", err);
    res.status(500).json({ error: "Failed to send estimate" });
  }
});

// Convert accepted estimate to a job
estimatesRouter.post("/:id/convert", authMiddleware, requirePrivilege("manage_jobs"), async (req, res) => {
  try {
    const pool = getPool();
    const est = await pool.query("SELECT * FROM estimates WHERE id = $1", [req.params.id]);
    if (est.rows.length === 0) {
      res.status(404).json({ error: "Estimate not found" });
      return;
    }
    const e = est.rows[0];

    // Create or find customer
    let customerId: string | null = null;
    if (e.client_email) {
      const existing = await pool.query(`SELECT id FROM customers WHERE email = $1`, [e.client_email]);
      if (existing.rows.length > 0) {
        customerId = existing.rows[0].id;
      } else {
        const newC = await pool.query(
          `INSERT INTO customers (email, full_name, phone, address_line1) VALUES ($1,$2,$3,$4) RETURNING id`,
          [e.client_email, e.client_name, e.client_phone || null, e.client_address || null]
        );
        customerId = newC.rows[0].id;
      }
    }

    // Generate job number
    const year = new Date().getFullYear();
    const prefix = `SUN-${year}-`;
    const lastJob = await pool.query(
      `SELECT job_number FROM jobs WHERE job_number LIKE $1 ORDER BY job_number DESC LIMIT 1`,
      [`${prefix}%`]
    );
    let seq = 1;
    if (lastJob.rows.length > 0) {
      const lastNum = parseInt(lastJob.rows[0].job_number.replace(prefix, ""), 10);
      seq = (isNaN(lastNum) ? 0 : lastNum) + 1;
    }
    const jobNumber = `${prefix}${String(seq).padStart(4, "0")}`;

    // Create job
    const job = await pool.query(
      `INSERT INTO jobs (
        job_number, title, description, status, customer_id,
        job_address_line1, contract_amount
      ) VALUES ($1,$2,$3,'pending',$4,$5,$6) RETURNING *`,
      [
        jobNumber,
        `Project for ${e.client_name}`,
        e.description || null,
        customerId,
        e.job_address || e.client_address || null,
        e.total,
      ]
    );

    // Link estimate to job
    await pool.query(`UPDATE estimates SET job_id = $1 WHERE id = $2`, [job.rows[0].id, e.id]);

    res.json({ job: job.rows[0] });
  } catch (err) {
    console.error("Convert estimate error:", err);
    res.status(500).json({ error: "Failed to convert estimate" });
  }
});
