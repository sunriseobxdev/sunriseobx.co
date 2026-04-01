import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requirePrivilege } from "../middleware/rbac.js";
import { getPool } from "../lib/db.js";
import { uploadBuffer, getSignedUrl } from "../lib/gcs.js";
import { generateInvoicePdf, type InvoiceData } from "../lib/pdf-invoice.js";

export const invoiceRouter = Router();
invoiceRouter.use(authMiddleware);

const COMPANY_NAME = "Sunrise Construction Services LLC";
const COMPANY_ADDRESS = "121 Pine Grove Lane, Point Harbor, NC 27964\nhello@sunriseobx.co | (252) 619-7966";

// ── List invoices ──
invoiceRouter.get(
  "/",
  requirePrivilege("view_invoices"),
  async (_req, res) => {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT i.id, i.invoice_number, i.client_name, i.issue_date, i.due_date,
                i.total, i.status, i.pdf_path, i.created_at, i.job_id,
                j.job_number, j.title AS job_title
         FROM invoices i LEFT JOIN jobs j ON i.job_id = j.id
         ORDER BY i.issue_date DESC`
      );
      res.json(result.rows);
    } catch (err) {
      console.error("List invoices error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ── Get single invoice ──
invoiceRouter.get(
  "/:id",
  requirePrivilege("view_invoices"),
  async (req, res) => {
    try {
      const pool = getPool();
      const result = await pool.query("SELECT * FROM invoices WHERE id = $1", [
        req.params.id,
      ]);
      if (result.rows.length === 0) {
        res.status(404).json({ error: "Invoice not found" });
        return;
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Get invoice error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ── Create invoice + generate PDF ──
invoiceRouter.post(
  "/",
  requirePrivilege("manage_invoices"),
  async (req, res) => {
    try {
      const pool = getPool();
      const {
        invoiceNumber, clientName, clientEmail, clientAddress,
        issueDate, dueDate, lineItems, taxRate, notes, status, jobId,
      } = req.body;

      if (!invoiceNumber || !clientName || !issueDate || !dueDate || !lineItems) {
        res.status(400).json({
          error: "invoiceNumber, clientName, issueDate, dueDate, and lineItems are required",
        });
        return;
      }

      // Calculate totals
      const items = lineItems as { description: string; quantity: number; rate: number }[];
      const computedItems = items.map((item) => ({
        ...item,
        amount: +(item.quantity * item.rate).toFixed(2),
      }));
      const subtotal = +computedItems.reduce((s, i) => s + i.amount, 0).toFixed(2);
      const effectiveTaxRate = taxRate || 0;
      const taxAmount = +(subtotal * effectiveTaxRate).toFixed(2);
      const total = +(subtotal + taxAmount).toFixed(2);

      // Generate PDF
      const invoiceData: InvoiceData = {
        invoiceNumber,
        issueDate,
        dueDate,
        clientName,
        clientAddress: clientAddress || "",
        clientEmail: clientEmail || "",
        lineItems: computedItems,
        subtotal,
        taxRate: effectiveTaxRate,
        taxAmount,
        total,
        notes: notes || "",
        companyName: COMPANY_NAME,
        companyAddress: COMPANY_ADDRESS,
      };

      const pdfBuffer = await generateInvoicePdf(invoiceData);
      const gcsPath = `invoices/${invoiceNumber}.pdf`;
      await uploadBuffer(pdfBuffer, gcsPath);

      const result = await pool.query(
        `INSERT INTO invoices (
          invoice_number, client_name, client_email, client_address,
          issue_date, due_date, line_items, subtotal, tax_rate,
          tax_amount, total, notes, status, pdf_path, created_by, job_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        RETURNING *`,
        [
          invoiceNumber, clientName, clientEmail || null, clientAddress || null,
          issueDate, dueDate, JSON.stringify(computedItems), subtotal,
          effectiveTaxRate, taxAmount, total, notes || null,
          status || "draft", gcsPath,
          req.user!.userId !== "legacy" ? req.user!.userId : null,
          jobId || null,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      if (err?.code === "23505") {
        res.status(409).json({ error: "An invoice with this number already exists" });
        return;
      }
      console.error("Create invoice error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: "Internal server error", detail: msg });
    }
  }
);

// ── Update invoice status ──
invoiceRouter.put(
  "/:id",
  requirePrivilege("manage_invoices"),
  async (req, res) => {
    try {
      const pool = getPool();
      const { status, notes } = req.body;
      const setClauses: string[] = ["updated_at = NOW()"];
      const values: unknown[] = [];
      let idx = 1;

      if (status !== undefined) {
        setClauses.push(`status = $${idx++}`);
        values.push(status);
      }
      if (notes !== undefined) {
        setClauses.push(`notes = $${idx++}`);
        values.push(notes);
      }

      values.push(req.params.id);
      const result = await pool.query(
        `UPDATE invoices SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Invoice not found" });
        return;
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Update invoice error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ── Get signed URL for invoice PDF ──
invoiceRouter.get(
  "/:id/pdf",
  requirePrivilege("view_invoices"),
  async (req, res) => {
    try {
      const pool = getPool();
      const result = await pool.query(
        "SELECT pdf_path FROM invoices WHERE id = $1",
        [req.params.id]
      );
      if (result.rows.length === 0 || !result.rows[0].pdf_path) {
        res.status(404).json({ error: "Invoice PDF not found" });
        return;
      }
      const url = await getSignedUrl(result.rows[0].pdf_path);
      res.json({ url });
    } catch (err) {
      console.error("Get invoice PDF error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
