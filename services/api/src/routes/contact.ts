import { Router } from "express";
import nodemailer from "nodemailer";

export const contactRouter = Router();

const RATE_LIMIT_MS = 60_000; // 1 minute between submissions per IP
const recentSubmissions = new Map<string, number>();

function getClientIp(req: import("express").Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.ip || "unknown";
}

contactRouter.post("/contact", async (req, res) => {
  const { name, email, message } = req.body as {
    name?: string;
    email?: string;
    message?: string;
  };

  if (!name || !email || !message) {
    res.status(400).json({ error: "name, email, and message are required" });
    return;
  }

  if (name.length > 200 || email.length > 200 || message.length > 5000) {
    res.status(400).json({ error: "Field length exceeded" });
    return;
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  // Rate limit
  const ip = getClientIp(req);
  const lastSubmission = recentSubmissions.get(ip);
  if (lastSubmission && Date.now() - lastSubmission < RATE_LIMIT_MS) {
    res.status(429).json({ error: "Please wait before submitting again" });
    return;
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.error("SMTP credentials not configured");
    res.status(500).json({ error: "Contact form is not available at this time" });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"Sprimage Contact" <${smtpUser}>`,
      to: smtpUser,
      replyTo: `"${name}" <${email}>`,
      subject: `Contact Form: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `<h3>New Contact Form Submission</h3>
<p><strong>Name:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
<hr>
<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    });

    recentSubmissions.set(ip, Date.now());
    res.json({ success: true });
  } catch (err) {
    console.error("SMTP send error:", err);
    res.status(500).json({ error: "Failed to send message. Please try again later." });
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
