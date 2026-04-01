import { Router } from "express";
import crypto from "crypto";
import { getPool } from "../lib/db.js";
import { sendOTP } from "../lib/email.js";
import {
  customerAuthMiddleware,
  signCustomerToken,
} from "../middleware/customer-auth.js";

export const customerAuthRouter = Router();

// Send OTP to email (creates customer record if new)
customerAuthRouter.post("/otp", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email required" });
    return;
  }

  const pool = getPool();

  // Create customer if doesn't exist
  await pool.query(
    `INSERT INTO customers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
    [email.toLowerCase().trim()]
  );

  // Generate 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  // Invalidate old codes
  await pool.query(
    `UPDATE customer_otp SET used = true WHERE email = $1 AND used = false`,
    [email.toLowerCase().trim()]
  );

  // Store new code
  await pool.query(
    `INSERT INTO customer_otp (email, code_hash, expires_at) VALUES ($1, $2, $3)`,
    [email.toLowerCase().trim(), codeHash, expiresAt]
  );

  // Send email
  await sendOTP(email, code);

  res.json({ success: true, message: "Verification code sent" });
});

// Verify OTP and return JWT
customerAuthRouter.post("/verify", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400).json({ error: "Email and code required" });
    return;
  }

  const pool = getPool();
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");

  const result = await pool.query(
    `SELECT id FROM customer_otp
     WHERE email = $1 AND code_hash = $2 AND used = false AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [email.toLowerCase().trim(), codeHash]
  );

  if (result.rows.length === 0) {
    res.status(401).json({ error: "Invalid or expired code" });
    return;
  }

  // Mark code used
  await pool.query(`UPDATE customer_otp SET used = true WHERE id = $1`, [
    result.rows[0].id,
  ]);

  // Get customer
  const customer = await pool.query(
    `SELECT id, email, full_name FROM customers WHERE email = $1`,
    [email.toLowerCase().trim()]
  );

  if (customer.rows.length === 0) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const c = customer.rows[0];
  const token = signCustomerToken(c.id, c.email);

  res.json({ token, customer: c });
});

// Password login (optional, for customers who set a password)
customerAuthRouter.post("/password-login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  const pool = getPool();
  const result = await pool.query(
    `SELECT id, email, full_name, password_hash FROM customers WHERE email = $1`,
    [email.toLowerCase().trim()]
  );

  if (result.rows.length === 0 || !result.rows[0].password_hash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(password, result.rows[0].password_hash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const c = result.rows[0];
  const token = signCustomerToken(c.id, c.email);

  res.json({
    token,
    customer: { id: c.id, email: c.email, full_name: c.full_name },
  });
});

// Get current customer profile
customerAuthRouter.get("/me", customerAuthMiddleware, async (req, res) => {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, email, full_name, phone, address_line1, address_line2, city, state, zip,
            totp_enabled, stripe_customer_id, created_at
     FROM customers WHERE id = $1`,
    [req.customer!.customerId]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(result.rows[0]);
});

// Update customer profile
customerAuthRouter.put("/profile", customerAuthMiddleware, async (req, res) => {
  const { full_name, phone, address_line1, address_line2, city, state, zip } =
    req.body;
  const pool = getPool();

  const result = await pool.query(
    `UPDATE customers SET
       full_name = COALESCE($1, full_name),
       phone = COALESCE($2, phone),
       address_line1 = COALESCE($3, address_line1),
       address_line2 = COALESCE($4, address_line2),
       city = COALESCE($5, city),
       state = COALESCE($6, state),
       zip = COALESCE($7, zip),
       updated_at = NOW()
     WHERE id = $8 RETURNING id, email, full_name, phone, city, state, zip`,
    [
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      zip,
      req.customer!.customerId,
    ]
  );

  res.json(result.rows[0]);
});
