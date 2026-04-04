import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requirePrivilege } from "../middleware/rbac.js";
import { customerAuthMiddleware } from "../middleware/customer-auth.js";
import { getPool } from "../lib/db.js";
import { sendAgreementLink } from "../lib/email.js";

export const agreementsRouter = Router();

const BASE_URL = process.env.PUBLIC_URL || "https://sunriseobx.co";

// --- Templates ---

agreementsRouter.get(
  "/templates",
  authMiddleware,
  requirePrivilege("manage_jobs"),
  async (_req, res) => {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, name, description, created_at, updated_at FROM agreement_templates ORDER BY name`
    );
    res.json(result.rows);
  }
);

agreementsRouter.post(
  "/templates",
  authMiddleware,
  requirePrivilege("manage_jobs"),
  async (req, res) => {
    const { name, description, boilerplate_html } = req.body;
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO agreement_templates (name, description, boilerplate_html)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, description, boilerplate_html]
    );
    res.status(201).json(result.rows[0]);
  }
);

agreementsRouter.get(
  "/templates/:id",
  authMiddleware,
  requirePrivilege("manage_jobs"),
  async (req, res) => {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM agreement_templates WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(result.rows[0]);
  }
);

agreementsRouter.put(
  "/templates/:id",
  authMiddleware,
  requirePrivilege("manage_jobs"),
  async (req, res) => {
    const { name, description, boilerplate_html } = req.body;
    const pool = getPool();
    const result = await pool.query(
      `UPDATE agreement_templates SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         boilerplate_html = COALESCE($3, boilerplate_html),
         updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [name, description, boilerplate_html, req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(result.rows[0]);
  }
);

// --- Job Agreements ---

// Create agreement for a job
agreementsRouter.post(
  "/jobs/:id/agreements",
  authMiddleware,
  requirePrivilege("manage_jobs"),
  async (req, res) => {
    const { template_id, scope_of_work_html, compensation_html } = req.body;
    const pool = getPool();

    // Get job info for rendering
    const job = await pool.query(
      `SELECT j.*, c.full_name AS customer_name, c.email AS customer_email,
              c.address_line1, c.city, c.state, c.zip
       FROM jobs j LEFT JOIN customers c ON j.customer_id = c.id
       WHERE j.id = $1`,
      [req.params.id]
    );
    if (job.rows.length === 0) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    // Get template boilerplate if provided
    let boilerplate = "";
    if (template_id) {
      const tpl = await pool.query(
        `SELECT boilerplate_html FROM agreement_templates WHERE id = $1`,
        [template_id]
      );
      if (tpl.rows.length > 0) {
        boilerplate = tpl.rows[0].boilerplate_html;
      }
    }

    const j = job.rows[0];
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Build client address string with proper spacing
    const clientAddr = [j.address_line1, j.city, j.state || "NC"].filter(Boolean).join(", ") + (j.zip ? ` ${j.zip}` : "");

    // Render full agreement HTML
    const fullHtml = `
      <div style="font-family: 'Times New Roman', Georgia, serif; max-width: 720px; margin: 0 auto; padding: 2.5rem; line-height: 1.8; color: #111; font-size: 14px;">
        <style>
          .agreement-body p { margin: 0.6em 0; text-align: justify; }
          .agreement-body h3 { font-size: 15px; margin: 1.5em 0 0.5em; text-decoration: underline; page-break-after: avoid; }
          .agreement-body h4 { font-size: 14px; margin: 1.4em 0 0.4em; text-decoration: underline; page-break-after: avoid; }
          .agreement-body li { margin: 0.3em 0; }
          .agreement-body ol, .agreement-body ul { margin: 0.5em 0 0.5em 1.5em; }
        </style>
        <div class="agreement-body">

        <h2 style="text-align: center; text-decoration: underline; font-size: 18px; margin-bottom: 1.5em; letter-spacing: 0.5px;">INDEPENDENT CONTRACTOR AGREEMENT</h2>

        <p><strong><u>THIS INDEPENDENT CONTRACTOR AGREEMENT</u></strong> (the &ldquo;Agreement&rdquo;) dated <strong>${today}</strong></p>

        <p style="margin-top: 1.2em;"><strong>BETWEEN:</strong></p>

        <p style="text-align: center; margin: 1em 0;">
          <strong>${j.customer_name || "_______________"}</strong><br/>
          ${clientAddr || "_______________"}<br/>
          (the &ldquo;Client&rdquo;)
        </p>

        <p style="text-align: center; margin: 0.8em 0;"><strong>&mdash; AND &mdash;</strong></p>

        <p style="text-align: center; margin: 1em 0;">
          <strong>Sunrise Construction</strong><br/>
          121 Pine Grove Lane, Point Harbor, NC 27964<br/>
          (the &ldquo;Contractor&rdquo;)
        </p>

        <p style="margin-top: 1.2em;"><strong>BACKGROUND:</strong></p>
        <ol type="A" style="margin-left: 1.5em;">
          <li>The Client is of the opinion that the Contractor has the necessary qualifications, experience, and abilities to provide services to the Client.</li>
          <li>The Contractor is agreeable to providing such services to the Client on the terms and conditions set out in this Agreement.</li>
        </ol>

        <p><strong>IN CONSIDERATION OF</strong> the matters described above and of the mutual benefits and obligations set forth in this Agreement, the receipt and sufficiency of which consideration is hereby acknowledged, the Client and the Contractor agree as follows:</p>

        <h3>1. Services Provided</h3>
        <p>The Client hereby agrees to engage the Contractor to provide the Client with the following services (the &ldquo;Services&rdquo;):</p>
        <div style="margin: 0.8em 0 0.8em 2em;">
          ${scope_of_work_html}
        </div>

        ${boilerplate}

        <h3>Compensation</h3>
        <div style="margin: 0.5em 0;">
          ${compensation_html}
        </div>

        </div>
      </div>
    `;

    const result = await pool.query(
      `INSERT INTO job_agreements (job_id, template_id, scope_of_work_html, compensation_html, full_html)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, template_id || null, scope_of_work_html, compensation_html, fullHtml]
    );

    res.status(201).json(result.rows[0]);
  }
);

// Get agreement
agreementsRouter.get(
  "/jobs/:jobId/agreements/:id",
  authMiddleware,
  requirePrivilege("manage_jobs"),
  async (req, res) => {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM job_agreements WHERE id = $1 AND job_id = $2`,
      [req.params.id, req.params.jobId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(result.rows[0]);
  }
);

// Send agreement to customer via Resend
agreementsRouter.post(
  "/jobs/:jobId/agreements/:id/send",
  authMiddleware,
  requirePrivilege("manage_jobs"),
  async (req, res) => {
    const pool = getPool();
    const agreement = await pool.query(
      `SELECT a.*, j.job_number, j.title AS job_title, c.email AS customer_email, c.full_name AS customer_name
       FROM job_agreements a
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN customers c ON j.customer_id = c.id
       WHERE a.id = $1 AND a.job_id = $2`,
      [req.params.id, req.params.jobId]
    );

    if (agreement.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const a = agreement.rows[0];
    if (!a.customer_email) {
      res.status(400).json({ error: "Customer has no email" });
      return;
    }

    const link = `${BASE_URL}/onboard/${a.id}`;

    await sendAgreementLink(
      a.customer_email,
      a.customer_name || "",
      a.job_number,
      a.job_title,
      link
    );

    await pool.query(
      `UPDATE job_agreements SET status = 'sent', sent_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    res.json({ success: true, sent_to: a.customer_email });
  }
);

// Customer: view agreement (public via agreement ID)
agreementsRouter.get(
  "/onboard/:agreementId",
  async (req, res) => {
    const pool = getPool();
    const result = await pool.query(
      `SELECT a.id, a.full_html, a.status, a.signed_at,
              j.job_number, j.title AS job_title,
              c.email AS customer_email, c.full_name AS customer_name
       FROM job_agreements a
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN customers c ON j.customer_id = c.id
       WHERE a.id = $1`,
      [req.params.agreementId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const a = result.rows[0];

    // Mark as viewed
    if (a.status === "sent") {
      await pool.query(
        `UPDATE job_agreements SET status = 'viewed', viewed_at = NOW() WHERE id = $1`,
        [req.params.agreementId]
      );
    }

    res.json(result.rows[0]);
  }
);

// Customer: sign agreement
agreementsRouter.post(
  "/onboard/:agreementId/sign",
  customerAuthMiddleware,
  async (req, res) => {
    const { signature_data } = req.body;
    if (!signature_data) {
      res.status(400).json({ error: "Signature required" });
      return;
    }

    const pool = getPool();
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";

    const result = await pool.query(
      `UPDATE job_agreements SET
         status = 'signed', signed_at = NOW(),
         signature_data = $1, signer_ip = $2
       WHERE id = $3 AND status IN ('sent', 'viewed')
       RETURNING *`,
      [signature_data, ip, req.params.agreementId]
    );

    if (result.rows.length === 0) {
      res.status(400).json({ error: "Agreement cannot be signed (already signed or not found)" });
      return;
    }

    res.json(result.rows[0]);
  }
);
