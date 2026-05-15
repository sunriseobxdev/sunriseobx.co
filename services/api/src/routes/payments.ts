import { Router, raw } from "express";
import Stripe from "stripe";
import { authMiddleware } from "../middleware/auth.js";
import { requirePrivilege } from "../middleware/rbac.js";
import { customerAuthMiddleware } from "../middleware/customer-auth.js";
import { getPool } from "../lib/db.js";
import { uploadBuffer, getSignedUrl } from "../lib/gcs.js";
import { generateReceiptPdf } from "../lib/pdf-receipt.js";
import { sendEmail } from "../lib/email.js";

export const paymentsRouter = Router();

function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true });
}

const BASE_URL = process.env.PUBLIC_URL || "https://sunriseobx.co";

// --- Admin: create payment intent for a job ---
paymentsRouter.post(
  "/jobs/:id/payments/create",
  authMiddleware,
  requirePrivilege("manage_jobs"),
  async (req, res) => {
    const stripe = getStripe();
    if (!stripe) {
      res.status(503).json({ error: "Stripe not configured" });
      return;
    }

    const { amount, description, payment_type } = req.body;
    if (!amount) {
      res.status(400).json({ error: "Amount required" });
      return;
    }

    const pool = getPool();

    // Get job and customer
    const job = await pool.query(
      `SELECT j.*, c.email AS customer_email, c.full_name AS customer_name, c.stripe_customer_id
       FROM jobs j LEFT JOIN customers c ON j.customer_id = c.id
       WHERE j.id = $1`,
      [req.params.id]
    );
    if (job.rows.length === 0) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const j = job.rows[0];

    // Create or retrieve Stripe customer
    let stripeCustomerId = j.stripe_customer_id;
    if (!stripeCustomerId && j.customer_email) {
      const customer = await stripe.customers.create({
        email: j.customer_email,
        name: j.customer_name || undefined,
        metadata: { sunriseobx_customer_id: j.customer_id },
      });
      stripeCustomerId = customer.id;
      await pool.query(
        `UPDATE customers SET stripe_customer_id = $1 WHERE id = $2`,
        [stripeCustomerId, j.customer_id]
      );
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: "usd",
      customer: stripeCustomerId || undefined,
      description: description || `${j.job_number} — ${payment_type || "payment"}`,
      metadata: {
        job_id: j.id,
        job_number: j.job_number,
        payment_type: payment_type || "deposit",
      },
    });

    // Store in DB
    const result = await pool.query(
      `INSERT INTO job_payments (job_id, stripe_payment_intent_id, amount, description, payment_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, paymentIntent.id, amount, description, payment_type || "deposit"]
    );

    res.json({
      payment: result.rows[0],
      client_secret: paymentIntent.client_secret,
    });
  }
);

// --- Admin: list payments for a job ---
paymentsRouter.get(
  "/jobs/:id/payments",
  authMiddleware,
  requirePrivilege("manage_jobs"),
  async (req, res) => {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM job_payments WHERE job_id = $1 ORDER BY created_at`,
      [req.params.id]
    );
    res.json(result.rows);
  }
);

// --- Customer: view their payments ---
paymentsRouter.get(
  "/customer/jobs/:id/payments",
  customerAuthMiddleware,
  async (req, res) => {
    const pool = getPool();
    // Verify customer owns this job
    const job = await pool.query(
      `SELECT id FROM jobs WHERE id = $1 AND customer_id = (SELECT id FROM customers WHERE id = $2)`,
      [req.params.id, req.customer!.customerId]
    );
    if (job.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const result = await pool.query(
      `SELECT id, amount, description, status, payment_type, paid_at, created_at
       FROM job_payments WHERE job_id = $1 ORDER BY created_at`,
      [req.params.id]
    );
    res.json(result.rows);
  }
);

// --- Public: get publishable key ---
paymentsRouter.get("/stripe/config", (_req, res) => {
  const pk = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!pk) {
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }
  res.json({ publishableKey: pk });
});

// --- Customer: create payment for their job ---
paymentsRouter.post(
  "/customer/jobs/:id/pay",
  customerAuthMiddleware,
  async (req, res) => {
    const stripe = getStripe();
    if (!stripe) {
      res.status(503).json({ error: "Stripe not configured" });
      return;
    }

    const { amount, payment_type, description } = req.body;
    if (!amount) {
      res.status(400).json({ error: "Amount required" });
      return;
    }

    const pool = getPool();

    // Verify customer owns this job
    const job = await pool.query(
      `SELECT j.*, c.email AS customer_email, c.full_name AS customer_name, c.stripe_customer_id
       FROM jobs j JOIN customers c ON j.customer_id = c.id
       WHERE j.id = $1 AND j.customer_id = $2`,
      [req.params.id, req.customer!.customerId]
    );
    if (job.rows.length === 0) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const j = job.rows[0];

    // Create or retrieve Stripe customer
    let stripeCustomerId = j.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: j.customer_email,
        name: j.customer_name || undefined,
        metadata: { sunriseobx_customer_id: req.customer!.customerId },
      });
      stripeCustomerId = customer.id;
      await pool.query(
        `UPDATE customers SET stripe_customer_id = $1 WHERE id = $2`,
        [stripeCustomerId, req.customer!.customerId]
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      customer: stripeCustomerId,
      description: description || `${j.job_number} — ${payment_type || "payment"}`,
      metadata: {
        job_id: j.id,
        job_number: j.job_number,
        payment_type: payment_type || "deposit",
        customer_id: req.customer!.customerId,
      },
      automatic_payment_methods: { enabled: true },
    });

    // Store pending payment
    await pool.query(
      `INSERT INTO job_payments (job_id, stripe_payment_intent_id, amount, description, payment_type)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, paymentIntent.id, amount, description || `${payment_type || "deposit"}`, payment_type || "deposit"]
    );

    res.json({ clientSecret: paymentIntent.client_secret });
  }
);

// --- Customer: get receipt PDF for a payment ---
paymentsRouter.get(
  "/customer/jobs/:jobId/payments/:paymentId/receipt",
  customerAuthMiddleware,
  async (req, res) => {
    const pool = getPool();
    // Verify customer owns the job
    const job = await pool.query(
      `SELECT id FROM jobs WHERE id = $1 AND customer_id = $2`,
      [req.params.jobId, req.customer!.customerId]
    );
    if (job.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const payment = await pool.query(
      `SELECT stripe_payment_intent_id, description FROM job_payments WHERE id = $1 AND job_id = $2 AND status = 'succeeded'`,
      [req.params.paymentId, req.params.jobId]
    );
    if (payment.rows.length === 0) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    // Extract receipt number from description
    const desc = payment.rows[0].description || "";
    const match = desc.match(/\[Receipt: (RCP-[A-Z0-9]+)\]/);
    if (!match) {
      res.status(404).json({ error: "Receipt not yet generated" });
      return;
    }

    const gcsPath = `receipts/${match[1]}.pdf`;
    try {
      const url = await getSignedUrl(gcsPath);
      res.json({ url });
    } catch {
      res.status(404).json({ error: "Receipt file not found" });
    }
  }
);

// --- Invoice payment (public — no auth, uses invoice ID) ---
paymentsRouter.post(
  "/api/invoices/:id/pay",
  async (req, res) => {
    const stripe = getStripe();
    if (!stripe) {
      res.status(503).json({ error: "Stripe not configured" });
      return;
    }

    const pool = getPool();
    const inv = await pool.query(
      `SELECT id, invoice_number, client_name, client_email, total, status, stripe_payment_intent_id
       FROM invoices WHERE id = $1`,
      [req.params.id]
    );
    if (inv.rows.length === 0) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    const invoice = inv.rows[0];
    if (invoice.status === "paid") {
      res.status(400).json({ error: "Invoice already paid" });
      return;
    }

    // Reuse existing PaymentIntent if one exists and hasn't succeeded
    if (invoice.stripe_payment_intent_id) {
      try {
        const existing = await stripe.paymentIntents.retrieve(invoice.stripe_payment_intent_id);
        if (existing.status !== "succeeded" && existing.status !== "canceled") {
          res.json({ clientSecret: existing.client_secret });
          return;
        }
      } catch { /* create new one */ }
    }

    // Create Stripe customer if we have an email
    let stripeCustomerId: string | undefined;
    if (invoice.client_email) {
      const customers = await stripe.customers.list({ email: invoice.client_email, limit: 1 });
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
      } else {
        const c = await stripe.customers.create({
          email: invoice.client_email,
          name: invoice.client_name || undefined,
        });
        stripeCustomerId = c.id;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(invoice.total) * 100),
      currency: "usd",
      customer: stripeCustomerId,
      description: `Invoice ${invoice.invoice_number}`,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        type: "invoice",
      },
      automatic_payment_methods: { enabled: true },
    });

    await pool.query(
      `UPDATE invoices SET stripe_payment_intent_id = $1 WHERE id = $2`,
      [paymentIntent.id, invoice.id]
    );

    res.json({ clientSecret: paymentIntent.client_secret });
  }
);

// --- Stripe webhook ---
paymentsRouter.post(
  "/stripe/webhook",
  raw({ type: "application/json" }),
  async (req, res) => {
    const stripe = getStripe();
    if (!stripe) {
      res.status(503).json({ error: "Stripe not configured" });
      return;
    }

    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;
    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        event = JSON.parse(req.body.toString()) as Stripe.Event;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed:", message);
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    const pool = getPool();

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const amountDollars = pi.amount / 100;

        await pool.query(
          `UPDATE job_payments SET status = 'succeeded', paid_at = NOW()
           WHERE stripe_payment_intent_id = $1`,
          [pi.id]
        );

        // If this is a deposit, mark it paid on the job
        if (pi.metadata.payment_type === "deposit" && pi.metadata.job_id) {
          await pool.query(
            `UPDATE jobs SET deposit_paid = true WHERE id = $1`,
            [pi.metadata.job_id]
          );
        }

        // Generate receipt PDF
        try {
          const jobInfo = await pool.query(
            `SELECT j.job_number, j.title, c.full_name, c.email
             FROM jobs j LEFT JOIN customers c ON j.customer_id = c.id
             WHERE j.id = $1`,
            [pi.metadata.job_id]
          );

          if (jobInfo.rows.length > 0) {
            const ji = jobInfo.rows[0];
            const receiptNum = `RCP-${pi.id.slice(-8).toUpperCase()}`;

            const pdfBuffer = await generateReceiptPdf({
              receiptNumber: receiptNum,
              jobNumber: ji.job_number || "",
              jobTitle: ji.title || "",
              customerName: ji.full_name || "",
              customerEmail: ji.email || "",
              amount: amountDollars,
              description: pi.description || pi.metadata.payment_type || "Payment",
              paymentType: pi.metadata.payment_type || "payment",
              paidAt: new Date().toISOString(),
              stripePaymentId: pi.id,
            });

            const gcsPath = `receipts/${receiptNum}.pdf`;
            await uploadBuffer(pdfBuffer, gcsPath);

            // Update payment record with receipt path
            await pool.query(
              `UPDATE job_payments SET description = COALESCE(description, '') || ' [Receipt: ${receiptNum}]'
               WHERE stripe_payment_intent_id = $1`,
              [pi.id]
            );

            // Email receipt to customer
            if (ji.email) {
              const receiptUrl = await getSignedUrl(gcsPath, 60 * 24 * 7); // 7 day link
              await sendEmail(
                ji.email,
                `Payment Receipt — ${ji.job_number} — ${receiptNum}`,
                `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:2rem;">
                  <h2 style="color:#1a3550;">Sunrise Construction</h2>
                  <p>Hi ${ji.full_name || "there"},</p>
                  <p>We've received your payment of <strong>$${amountDollars.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong> for project <strong>${ji.job_number}</strong>.</p>
                  <div style="text-align:center;margin:2rem 0;">
                    <a href="${receiptUrl}" style="display:inline-block;background:#059669;color:white;padding:0.75rem 2rem;border-radius:8px;text-decoration:none;font-weight:bold;">
                      Download Receipt PDF
                    </a>
                  </div>
                  <p style="color:#666;font-size:0.85rem;">Receipt #${receiptNum}</p>
                  <hr style="border:none;border-top:1px solid #ddd;margin:2rem 0;" />
                  <p style="color:#999;font-size:0.8rem;">Sunrise Construction Services LLC<br/>121 Pine Grove Lane, Point Harbor, NC 27964</p>
                </div>`
              );
            }
          }
        } catch (err) {
          console.error("Receipt generation error (payment still succeeded):", err);
        }

        // Handle invoice payments
        if (pi.metadata.type === "invoice" && pi.metadata.invoice_id) {
          await pool.query(
            `UPDATE invoices SET status = 'paid', paid_at = NOW() WHERE id = $1`,
            [pi.metadata.invoice_id]
          );

          // Email confirmation
          try {
            const inv = await pool.query(
              `SELECT invoice_number, client_name, client_email, total FROM invoices WHERE id = $1`,
              [pi.metadata.invoice_id]
            );
            if (inv.rows.length > 0 && inv.rows[0].client_email) {
              const i = inv.rows[0];
              const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(i.total);
              await sendEmail(
                i.client_email,
                `Payment Received — Invoice ${i.invoice_number}`,
                `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:2rem;">
                  <h2 style="color:#1a3550;">Sunrise Construction</h2>
                  <p>Hi ${i.client_name || "there"},</p>
                  <p>We&rsquo;ve received your payment of <strong>${usd}</strong> for invoice <strong>${i.invoice_number}</strong>. Thank you!</p>
                  <div style="background:#ecfdf5;border:1px solid #a7f3d0;padding:1rem;border-radius:8px;text-align:center;margin:1.5rem 0;">
                    <span style="color:#059669;font-weight:700;font-size:1.1rem;">&#10003; Paid in Full</span>
                  </div>
                  <p style="color:#666;font-size:0.85rem;">If you have any questions, contact us at (252) 619-7966.</p>
                  <hr style="border:none;border-top:1px solid #ddd;margin:2rem 0;" />
                  <p style="color:#999;font-size:0.8rem;">Sunrise Construction Services LLC<br/>121 Pine Grove Lane, Point Harbor, NC 27964</p>
                </div>`
              );
            }
          } catch (err) {
            console.error("Invoice payment email error (non-blocking):", err);
          }
        }

        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await pool.query(
          `UPDATE job_payments SET status = 'failed' WHERE stripe_payment_intent_id = $1`,
          [pi.id]
        );
        break;
      }
    }

    res.json({ received: true });
  }
);
