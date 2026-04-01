import { Resend } from "resend";
import nodemailer from "nodemailer";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

function getSmtpTransport() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const FROM_RESEND = "Sunrise Construction <noreply@sunriseobx.co>";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  // Try Resend first
  const r = getResend();
  if (r) {
    try {
      await r.emails.send({ from: FROM_RESEND, to, subject, html });
      return;
    } catch (err: unknown) {
      console.log("Resend send failed, falling back to SMTP:", err instanceof Error ? err.message : String(err));
    }
  }
  // Fallback to Gmail SMTP
  const smtp = getSmtpTransport();
  if (smtp) {
    const from = process.env.SMTP_USER || "sunriseobxltd@gmail.com";
    await smtp.sendMail({ from, to, subject, html });
    return;
  }
  throw new Error("No email transport available — configure RESEND_API_KEY or SMTP_USER/SMTP_PASS");
}

export async function sendOTP(email: string, code: string): Promise<void> {
  await sendEmail(
    email,
    `Your Sunrise Construction verification code: ${code}`,
    `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #1a3550;">Sunrise Construction</h2>
        <p>Your verification code is:</p>
        <div style="font-size: 2rem; font-weight: bold; letter-spacing: 0.3em; color: #f97316; padding: 1rem; background: #f8f8f8; border-radius: 8px; text-align: center; margin: 1rem 0;">
          ${code}
        </div>
        <p style="color: #666; font-size: 0.9rem;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  );
}

export async function sendAgreementLink(
  email: string,
  customerName: string,
  jobNumber: string,
  jobTitle: string,
  link: string
): Promise<void> {
  await sendEmail(
    email,
    `Your Agreement from Sunrise Construction — ${jobNumber}`,
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #1a3550;">Sunrise Construction</h2>
        <p>Hi ${customerName || "there"},</p>
        <p>Your Independent Contractor Agreement for <strong>${jobTitle}</strong> (${jobNumber}) is ready for review and signing.</p>
        <div style="text-align: center; margin: 2rem 0;">
          <a href="${link}" style="display: inline-block; background: #f97316; color: white; padding: 0.75rem 2rem; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Review &amp; Sign Agreement
          </a>
        </div>
        <p style="color: #666; font-size: 0.9rem;">If you have any questions, please contact us at (252) 305-4313 or reply to this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 2rem 0;" />
        <p style="color: #999; font-size: 0.8rem;">Sunrise Construction<br/>121 Pine Grove Lane, Point Harbor, NC 27964</p>
      </div>
    `
  );
}

export async function sendJobUpdate(
  email: string,
  customerName: string,
  jobNumber: string,
  milestoneTitle: string,
  message: string
): Promise<void> {
  await sendEmail(
    email,
    `Job Update: ${jobNumber} — ${milestoneTitle}`,
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #1a3550;">Sunrise Construction</h2>
        <p>Hi ${customerName || "there"},</p>
        <p>There's an update on your project <strong>${jobNumber}</strong>:</p>
        <div style="background: #f0f7ff; border-left: 4px solid #f97316; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
          <strong>${milestoneTitle}</strong>
          <p style="margin: 0.5rem 0 0;">${message}</p>
        </div>
        <p style="color: #666; font-size: 0.9rem;">Log in to your portal to see full details.</p>
      </div>
    `
  );
}
