import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requirePrivilege } from "../middleware/rbac.js";
import { customerAuthMiddleware } from "../middleware/customer-auth.js";
import { getPool } from "../lib/db.js";
import { sendAgreementLink } from "../lib/email.js";
import {
  escapeHtml,
  normalizePaymentSchedule,
  renderCompensationHtml,
  validatePaymentSchedule,
} from "../lib/payment-schedule.js";
import { formatAddress, formatAddressLines } from "../lib/address.js";

export const agreementsRouter = Router();

const BASE_URL = process.env.PUBLIC_URL || "https://sunriseobx.co";

/**
 * The standard boilerplate runs sections 2-6, then jumps to 10 because
 * sections 7-9 are the Compensation clause. Splice Compensation in at that gap
 * so the executed contract reads in numeric order instead of trailing the
 * Governing Law section.
 *
 * Matched as a regex because older seeds of the template carried inline styles
 * on the heading, and a template edited by hand may carry others.
 */
const COMPENSATION_ANCHOR = /<h4\b[^>]*>\s*Reimbursement of Expenses\s*<\/h4>/i;

function composeBody(
  boilerplate: string,
  compensationBlock: string
): string {
  const m = COMPENSATION_ANCHOR.exec(boilerplate);
  if (!m) {
    // Unknown template shape — keep the historical layout rather than guessing.
    return `${boilerplate}\n${compensationBlock}`;
  }
  return (
    boilerplate.slice(0, m.index) +
    compensationBlock +
    "\n" +
    boilerplate.slice(m.index)
  );
}

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
    const { template_id, scope_of_work_html } = req.body;
    const pool = getPool();

    // Get job info for rendering
    const job = await pool.query(
      `SELECT j.*, c.full_name AS customer_name, c.email AS customer_email,
              c.phone AS customer_phone,
              c.address_line1, c.address_line2, c.city, c.state, c.zip
       FROM jobs j LEFT JOIN customers c ON j.customer_id = c.id
       WHERE j.id = $1`,
      [req.params.id]
    );
    if (job.rows.length === 0) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const j = job.rows[0];

    // A phased schedule may come in on the request, or be the one already
    // stored on the job. An explicit empty array on the request means
    // "flat fee", so only fall back to the job when the key is absent.
    const phases = normalizePaymentSchedule(
      req.body.payment_schedule !== undefined
        ? req.body.payment_schedule
        : j.payment_schedule
    );

    const contractAmount =
      j.contract_amount != null ? Number(j.contract_amount) : null;

    const scheduleError = validatePaymentSchedule(phases, contractAmount);
    if (scheduleError) {
      res.status(400).json({ error: scheduleError });
      return;
    }

    // Callers may still post raw compensation HTML (the old contract); a
    // payment schedule always wins because it is the structured source.
    const compensationHtml =
      phases.length > 0
        ? renderCompensationHtml(contractAmount ?? 0, phases)
        : req.body.compensation_html ||
          renderCompensationHtml(contractAmount ?? 0, []);

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

    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // The client's mailing address and the job site are two different things —
    // an owner in Raleigh often builds on the Outer Banks. The party block gets
    // the client's address; the job site is named in Services Provided below.
    const clientAddrLines = formatAddressLines({
      line1: j.address_line1,
      line2: j.address_line2,
      city: j.city,
      state: j.state,
      zip: j.zip,
    });
    const clientAddrHtml =
      clientAddrLines.length > 0
        ? clientAddrLines.map((l) => escapeHtml(l)).join("<br/>")
        : "_______________";

    const jobSiteAddr = formatAddress({
      line1: j.job_address_line1,
      city: j.job_address_city,
      state: j.job_address_state,
      zip: j.job_address_zip,
    });

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
          <strong>${j.customer_name ? escapeHtml(j.customer_name) : "_______________"}</strong><br/>
          ${clientAddrHtml}<br/>
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
        ${
          jobSiteAddr
            ? `<p>The Services will be performed at the following property (the &ldquo;Job Site&rdquo;): <strong>${escapeHtml(
                jobSiteAddr
              )}</strong>. Where the Job Site differs from the Client&rsquo;s address set out above, the Client represents that it is authorized to contract for work at the Job Site.</p>`
            : ""
        }

        ${composeBody(
          boilerplate,
          `<h3>Compensation</h3>
        <div style="margin: 0.5em 0;">
          ${compensationHtml}
        </div>`
        )}

        </div>
      </div>
    `;

    const result = await pool.query(
      `INSERT INTO job_agreements (job_id, template_id, scope_of_work_html, compensation_html, payment_schedule, full_html)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        req.params.id,
        template_id || null,
        scope_of_work_html,
        compensationHtml,
        phases.length > 0 ? JSON.stringify(phases) : null,
        fullHtml,
      ]
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
