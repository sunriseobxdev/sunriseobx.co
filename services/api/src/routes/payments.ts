import { Router, raw } from "express";
import Stripe from "stripe";
import { authMiddleware } from "../middleware/auth.js";
import { requirePrivilege } from "../middleware/rbac.js";
import { customerAuthMiddleware } from "../middleware/customer-auth.js";
import { getPool } from "../lib/db.js";

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
