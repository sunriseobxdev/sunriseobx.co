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
  const { name, email, phone, subject, message } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    subject?: string;
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

    const subjectLine = subject
      ? `Sunrise OBX Lead: ${subject} — ${name}`
      : `Sunrise OBX Lead: ${name}`;

    await transporter.sendMail({
      from: `"Sunrise Construction" <${smtpUser}>`,
      to: smtpUser,
      replyTo: `"${name}" <${email}>`,
      subject: subjectLine,
      text: `New lead from sunriseobx.co\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "Not provided"}\nService: ${subject || "Not specified"}\n\n${message}`,
      html: `<div style="font-family:sans-serif;max-width:600px">
<h2 style="color:#ea580c">New Lead from sunriseobx.co</h2>
<table style="border-collapse:collapse;width:100%">
<tr><td style="padding:8px;font-weight:bold;color:#334e68">Name</td><td style="padding:8px">${escapeHtml(name)}</td></tr>
<tr style="background:#f0f4f8"><td style="padding:8px;font-weight:bold;color:#334e68">Email</td><td style="padding:8px"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
<tr><td style="padding:8px;font-weight:bold;color:#334e68">Phone</td><td style="padding:8px">${phone ? `<a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>` : "Not provided"}</td></tr>
<tr style="background:#f0f4f8"><td style="padding:8px;font-weight:bold;color:#334e68">Service</td><td style="padding:8px">${escapeHtml(subject || "Not specified")}</td></tr>
</table>
<hr style="border:none;border-top:1px solid #ddd;margin:16px 0">
<p style="color:#334e68;line-height:1.6">${escapeHtml(message).replace(/\n/g, "<br>")}</p>
</div>`,
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
