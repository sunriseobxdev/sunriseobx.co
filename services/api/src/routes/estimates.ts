import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requirePrivilege } from "../middleware/rbac.js";
import { getPool } from "../lib/db.js";
import { uploadBuffer, getSignedUrl } from "../lib/gcs.js";
import { generateInvoicePdf, type InvoiceData } from "../lib/pdf-invoice.js";
import { sendEmail } from "../lib/email.js";

export const estimatesRouter = Router();
estimatesRouter.use(authMiddleware);

const COMPANY_NAME = "Sunrise Construction Services LLC";
const COMPANY_ADDRESS = "121 Pine Grove Lane, Point Harbor, NC 27964\nhello@sunriseobx.co | (252) 619-7966";

// List estimates
estimatesRouter.get("/", requirePrivilege("manage_jobs"), async (_req, res) => {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM estimates ORDER BY created_at DESC`
  );
  res.json(result.rows);
});

// Get single estimate
estimatesRouter.get("/:id", requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  const result = await pool.query("SELECT * FROM estimates WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Estimate not found" });
    return;
  }
  res.json(result.rows[0]);
});

// Create estimate + generate PDF
estimatesRouter.post("/", requirePrivilege("manage_jobs"), async (req, res) => {
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

    // Generate PDF (reuse invoice PDF layout)
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
estimatesRouter.put("/:id", requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  const { status, notes } = req.body;
  const setClauses: string[] = ["updated_at = NOW()"];
  const values: unknown[] = [];
  let idx = 1;

  if (status !== undefined) {
    setClauses.push(`status = $${idx++}`);
    values.push(status);
    if (status === "sent") {
      setClauses.push(`sent_at = COALESCE(sent_at, NOW())`);
    } else if (status === "accepted") {
      setClauses.push(`accepted_at = NOW()`);
    }
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
estimatesRouter.delete("/:id", requirePrivilege("manage_jobs"), async (req, res) => {
  const pool = getPool();
  await pool.query("DELETE FROM estimates WHERE id = $1", [req.params.id]);
  res.json({ deleted: true });
});

// Get PDF
estimatesRouter.get("/:id/pdf", requirePrivilege("manage_jobs"), async (req, res) => {
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
estimatesRouter.post("/:id/send", requirePrivilege("manage_jobs"), async (req, res) => {
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
        <p>Please find your estimate <strong>${estimate.estimate_number}</strong> for <strong>${usd.format(estimate.total)}</strong>.</p>
        ${estimate.valid_until ? `<p style="color: #627d98; font-size: 0.85rem;">Valid until: <strong>${new Date(estimate.valid_until).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong></p>` : ""}
        ${estimate.description ? `<div style="background: #f0f7ff; border-left: 4px solid #f97316; padding: 1rem; margin: 1rem 0; border-radius: 4px;"><p style="margin: 0; color: #334e68; font-size: 0.9rem;">${estimate.description}</p></div>` : ""}
        ${pdfUrl ? `<div style="text-align: center; margin: 2rem 0;"><a href="${pdfUrl}" style="display: inline-block; background: #f97316; color: white; padding: 0.75rem 2rem; border-radius: 8px; text-decoration: none; font-weight: bold;">Download Estimate PDF</a></div>` : ""}
        <p style="color: #666; font-size: 0.85rem;">If you have any questions or would like to proceed, please contact us at (252) 305-4313 or reply to this email.</p>
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
