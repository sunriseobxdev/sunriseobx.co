import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, "../../assets/logo.png");

export interface ReceiptData {
  receiptNumber: string;
  jobNumber: string;
  jobTitle: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  description: string;
  paymentType: string;
  paidAt: string;
  stripePaymentId: string;
}

function usd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 60 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 492;
    let y = 60;

    // Header bar
    doc.rect(0, 0, 612, 100).fill("#1a3550");

    // Logo
    try {
      doc.image(LOGO_PATH, 60, 20, { width: 55 });
    } catch { /* skip */ }

    // Company name
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#f97316");
    doc.text("SUNRISE CONSTRUCTION", 125, 28);
    doc.font("Helvetica").fontSize(8).fillColor("#9fb3c8");
    doc.text("121 Pine Grove Lane, Point Harbor, NC 27964", 125, 50);
    doc.text("hello@sunriseobx.co | (252) 619-7966", 125, 62);

    // RECEIPT badge
    doc.font("Helvetica-Bold").fontSize(24).fillColor("#ffffff");
    doc.text("RECEIPT", 420, 35, { width: 140, align: "right" });

    y = 120;

    // Receipt info
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#1a3550");
    doc.text("RECEIPT #", 60, y);
    doc.font("Helvetica").fontSize(9).fillColor("#334e68");
    doc.text(data.receiptNumber, 160, y);

    y += 18;
    doc.font("Helvetica-Bold").fillColor("#1a3550").text("DATE", 60, y);
    doc.font("Helvetica").fillColor("#334e68");
    doc.text(new Date(data.paidAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), 160, y);

    y += 18;
    doc.font("Helvetica-Bold").fillColor("#1a3550").text("JOB", 60, y);
    doc.font("Helvetica").fillColor("#334e68");
    doc.text(`${data.jobNumber} — ${data.jobTitle}`, 160, y);

    y += 30;
    doc.moveTo(60, y).lineTo(552, y).strokeColor("#e2e8f0").lineWidth(1).stroke();
    y += 15;

    // Customer info
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#1a3550");
    doc.text("RECEIVED FROM", 60, y);
    y += 15;
    doc.font("Helvetica").fontSize(10).fillColor("#334e68");
    doc.text(data.customerName || data.customerEmail, 60, y);
    y += 14;
    doc.fontSize(9).fillColor("#627d98");
    doc.text(data.customerEmail, 60, y);

    y += 35;

    // Payment details box
    doc.roundedRect(60, y, W, 120, 8).fill("#f8fafc").stroke("#e2e8f0");

    y += 15;
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#627d98");
    doc.text("DESCRIPTION", 80, y, { width: 280 });
    doc.text("TYPE", 370, y, { width: 80 });
    doc.text("AMOUNT", 450, y, { width: 90, align: "right" });

    y += 20;
    doc.moveTo(80, y).lineTo(540, y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    y += 10;

    doc.font("Helvetica").fontSize(10).fillColor("#1a3550");
    doc.text(data.description, 80, y, { width: 280 });
    doc.fontSize(9).fillColor("#627d98");
    doc.text(data.paymentType, 370, y, { width: 80 });
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#1a3550");
    doc.text(usd(data.amount), 450, y, { width: 90, align: "right" });

    y += 30;
    doc.moveTo(350, y).lineTo(540, y).strokeColor("#1a3550").lineWidth(1).stroke();
    y += 10;

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#1a3550");
    doc.text("TOTAL PAID", 350, y, { width: 100 });
    doc.font("Helvetica-Bold").fontSize(14).fillColor("#059669");
    doc.text(usd(data.amount), 450, y - 2, { width: 90, align: "right" });

    // Thank you section
    y += 60;
    doc.roundedRect(60, y, W, 60, 8).fill("#ecfdf5");
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#059669");
    doc.text("Payment Received — Thank You!", 80, y + 15, { width: W - 40, align: "center" });
    doc.font("Helvetica").fontSize(8).fillColor("#627d98");
    doc.text("This receipt confirms your payment has been processed successfully.", 80, y + 35, { width: W - 40, align: "center" });

    // Footer
    y += 90;
    doc.font("Helvetica").fontSize(7).fillColor("#9fb3c8");
    doc.text(`Transaction ID: ${data.stripePaymentId}`, 60, y);
    y += 12;
    doc.text("Sunrise Construction Services LLC | NC Licensed General Contractor", 60, y);
    y += 10;
    doc.text("This is an electronic receipt and requires no signature.", 60, y);

    doc.end();
  });
}
