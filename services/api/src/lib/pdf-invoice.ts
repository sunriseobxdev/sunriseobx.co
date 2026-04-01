import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, "../../assets/logo.png");

const GOLD = "#c9a84c";
const GOLD_DARK = "#8a6d2b";
const DARK_BG = "#1a1a1a";
const TEXT = "#d4c5a0";
const TEXT_MUTED = "#8a8070";

function usd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtDate(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string;
  companyName?: string;
  companyAddress?: string;
}

export function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 512; // usable width
    let y = 50;

    // Background
    doc.rect(0, 0, 612, 792).fill("#0d0d0d");

    // Top gold line
    doc.rect(50, y, W, 2).fill(GOLD);
    y += 10;

    // Header: Logo + Company info | INVOICE title
    try {
      doc.image(LOGO_PATH, 50, y, { width: 60 });
    } catch {
      // skip
    }

    doc.font("Helvetica-Bold").fontSize(16).fillColor(GOLD);
    doc.text("SUNRISE CONSTRUCTION", 120, y + 5, { width: 250 });
    doc.font("Helvetica").fontSize(7.5).fillColor(TEXT_MUTED);
    doc.text(data.companyName || "Sunrise Construction Services LLC", 120, y + 25);
    doc.text(data.companyAddress || "inquiries@sprimage.com", 120, y + 36);

    doc.font("Helvetica-Bold").fontSize(24).fillColor(GOLD);
    doc.text("INVOICE", 350, y + 2, { width: 212, align: "right" });

    doc.font("Helvetica").fontSize(8).fillColor(TEXT);
    doc.text(`#${data.invoiceNumber}`, 350, y + 30, { width: 212, align: "right" });
    doc.text(`Issued: ${fmtDate(data.issueDate)}`, 350, y + 42, { width: 212, align: "right" });
    doc.text(`Due: ${fmtDate(data.dueDate)}`, 350, y + 54, { width: 212, align: "right" });

    y += 75;
    doc.rect(50, y, W, 1).fill("#333");
    y += 15;

    // Bill To
    doc.font("Helvetica-Bold").fontSize(7).fillColor(GOLD_DARK);
    doc.text("BILL TO", 50, y);
    y += 12;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT);
    doc.text(data.clientName, 50, y);
    y += 14;
    doc.font("Helvetica").fontSize(7.5).fillColor(TEXT_MUTED);
    if (data.clientAddress) {
      const addrLines = data.clientAddress.split("\n");
      for (const line of addrLines) {
        doc.text(line, 50, y);
        y += 11;
      }
    }
    if (data.clientEmail) {
      doc.text(data.clientEmail, 50, y);
      y += 11;
    }
    y += 10;

    // Line items table header
    doc.rect(50, y, W, 22).fill(GOLD_DARK);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#0a0a0a");
    doc.text("DESCRIPTION", 60, y + 7);
    doc.text("QTY", 330, y + 7, { width: 50, align: "right" });
    doc.text("RATE", 390, y + 7, { width: 70, align: "right" });
    doc.text("AMOUNT", 470, y + 7, { width: 80, align: "right" });
    y += 22;

    // Line items
    for (let i = 0; i < data.lineItems.length; i++) {
      const item = data.lineItems[i];
      const bg = i % 2 === 0 ? DARK_BG : "#151515";
      doc.rect(50, y, W, 22).fill(bg);
      doc.font("Helvetica").fontSize(8).fillColor(TEXT);
      doc.text(item.description, 60, y + 7, { width: 260 });
      doc.text(item.quantity.toString(), 330, y + 7, { width: 50, align: "right" });
      doc.text(usd(item.rate), 390, y + 7, { width: 70, align: "right" });
      doc.text(usd(item.amount), 470, y + 7, { width: 80, align: "right" });
      y += 22;
    }

    y += 8;

    // Totals
    const totalsX = 370;
    const totalsW = 192;

    doc.rect(totalsX, y, totalsW, 1).fill("#333");
    y += 8;

    doc.font("Helvetica").fontSize(8).fillColor(TEXT_MUTED);
    doc.text("Subtotal", totalsX, y);
    doc.text(usd(data.subtotal), totalsX, y, { width: totalsW, align: "right" });
    y += 16;

    if (data.taxRate > 0) {
      doc.text(`Tax (${(data.taxRate * 100).toFixed(1)}%)`, totalsX, y);
      doc.text(usd(data.taxAmount), totalsX, y, { width: totalsW, align: "right" });
      y += 16;
    }

    doc.rect(totalsX, y, totalsW, 1).fill(GOLD);
    y += 6;

    doc.font("Helvetica-Bold").fontSize(11).fillColor(GOLD);
    doc.text("TOTAL", totalsX, y);
    doc.text(usd(data.total), totalsX, y, { width: totalsW, align: "right" });
    y += 24;

    // Notes
    if (data.notes) {
      doc.rect(50, y, W, 1).fill("#333");
      y += 12;
      doc.font("Helvetica-Bold").fontSize(7).fillColor(GOLD_DARK);
      doc.text("NOTES", 50, y);
      y += 12;
      doc.font("Helvetica").fontSize(7.5).fillColor(TEXT_MUTED);
      doc.text(data.notes, 50, y, { width: W, lineGap: 3 });
    }

    // Footer
    const footerY = 740;
    doc.rect(50, footerY, W, 1).fill(GOLD_DARK);
    doc.font("Helvetica").fontSize(6).fillColor(TEXT_MUTED);
    doc.text("Thank you for your business.", 50, footerY + 8, { width: W, align: "center" });
    doc.text("Sprimage Labs \u2022 inquiries@sprimage.com", 50, footerY + 18, { width: W, align: "center" });

    doc.end();
  });
}
