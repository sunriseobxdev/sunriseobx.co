import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import bwipjs from "bwip-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, "../../assets/logo-eagle-spr.png");

const BLACK = "#000000";
const DARK = "#222222";
const GRAY = "#666666";
const LIGHT_GRAY = "#999999";
const RULE = "#cccccc";
const HEADER_BG = "#1a1a1a";
const ACCENT = "#8a6d2b";

function usd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtDate(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

export interface PaystubData {
  companyName: string;
  companyAddress: string;
  employeeName: string;
  employeeAddress1: string;
  employeeAddress2: string;
  employeeCityStateZip: string;
  employeeId: string;
  lastFourSsn: string;
  bankRouting: string;
  bankAccountLastFour: string;
  filingStatus: string;
  exemptions: number;
  stubNumber: number;
  payDate: string;
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  hours: number;
  medicareTax: number;
  ssTax: number;
  federalTax: number;
  stateTax: number;
  totalDeductions: number;
  netPay: number;
  grossYtd: number;
  medicareYtd: number;
  ssYtd: number;
  federalYtd: number;
  netYtd: number;
  stubId?: string;
}

function drawCutLine(doc: PDFKit.PDFDocument, y: number, w: number) {
  doc.save();
  doc.strokeColor(RULE).lineWidth(0.5).dash(4, { space: 3 });
  doc.moveTo(20, y).lineTo(20 + w + 24, y).stroke();
  doc.undash();
  doc.restore();
  // Scissors icon
  doc.font("Helvetica").fontSize(7).fillColor(LIGHT_GRAY);
  doc.text("\u2702", 22, y - 4);
}

function drawRule(doc: PDFKit.PDFDocument, x: number, y: number, w: number) {
  doc.strokeColor(RULE).lineWidth(0.5).moveTo(x, y).lineTo(x + w, y).stroke();
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  y: number,
  cols: number[],
  values: string[],
  opts?: { bold?: boolean; bg?: string; fontSize?: number }
) {
  const fs = opts?.fontSize || 7.5;
  if (opts?.bg) {
    doc.rect(cols[0] - 4, y - 2, cols[cols.length - 1] - cols[0] + 100, 14).fill(opts.bg);
  }
  doc.font(opts?.bold ? "Helvetica-Bold" : "Helvetica").fontSize(fs).fillColor(BLACK);
  for (let i = 0; i < values.length; i++) {
    const align = i === 0 ? "left" : "right";
    const width = i < cols.length - 1 ? cols[i + 1] - cols[i] - 4 : 80;
    doc.text(values[i], cols[i], y, { width, align });
  }
}

async function generateBarcode(text: string): Promise<Buffer> {
  return bwipjs.toBuffer({
    bcid: "code128",
    text,
    scale: 2,
    height: 8,
    includetext: false,
  });
}

export async function generatePaystubPdf(data: PaystubData): Promise<Buffer> {
  const barcodeText = data.stubId || `SPR-${data.employeeId}-${data.stubNumber}`;
  let barcodePng: Buffer | null = null;
  try {
    barcodePng = await generateBarcode(barcodeText);
  } catch {
    // barcode generation failed — continue without
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margins: { top: 32, bottom: 32, left: 32, right: 32 } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const L = 32; // left margin
    const W = 548; // usable width
    const R = L + W;
    const hourlyRate = data.grossPay / data.hours;
    const earningsCols = [L + 4, L + 160, L + 260, L + 355, L + 460];
    const dedCols = [L + 4, L + 355, L + 460];

    // ═══════════════════════════════════════════════
    // SECTION 1: EMPLOYER RECORD (top tear-off)
    // ═══════════════════════════════════════════════
    let y = 36;

    // Company header bar
    doc.rect(L, y, W, 28).fill(HEADER_BG);
    try {
      doc.image(LOGO_PATH, L + 6, y + 3, { width: 22 });
    } catch { /* skip */ }
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#ffffff");
    doc.text("SPRIMAGE", L + 32, y + 8, { width: 150 });
    doc.font("Helvetica").fontSize(7).fillColor("#cccccc");
    doc.text(data.companyName, L + 110, y + 6);
    doc.text(data.companyAddress, L + 110, y + 15);

    doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff");
    doc.text("EARNINGS STATEMENT", L + 320, y + 9, { width: W - 330, align: "right" });
    y += 34;

    // Pay period info row
    doc.font("Helvetica").fontSize(7).fillColor(GRAY);
    doc.text(`Pay Date: ${fmtDate(data.payDate)}`, L + 4, y);
    doc.text(`Period: ${fmtDate(data.periodStart)} \u2013 ${fmtDate(data.periodEnd)}`, L + 150, y);
    doc.text(`Employee: ${data.employeeName}`, L + 350, y);
    y += 12;
    doc.text(`Employee ID: ${data.employeeId}`, L + 4, y);
    doc.text(`SSN: ***-**-${data.lastFourSsn}`, L + 150, y);
    doc.text(`Filing: ${data.filingStatus.toUpperCase()} / ${data.exemptions} exemptions`, L + 350, y);
    y += 14;

    // Compact summary — gross left, deductions and net right-aligned on same line
    drawRule(doc, L, y, W);
    y += 5;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(BLACK);
    doc.text(`Gross Pay: ${usd(data.grossPay)}`, L + 4, y);
    doc.text(`Deductions: ${usd(data.totalDeductions)}     Net Pay: ${usd(data.netPay)}`, L + 4, y, { width: W - 8, align: "right" });
    y += 14;

    // ── Cut line 1 ──
    drawCutLine(doc, y, W);
    y += 14;

    // ═══════════════════════════════════════════════
    // SECTION 2: DETAIL SECTION (main body)
    // ═══════════════════════════════════════════════

    // Employee info block
    doc.font("Helvetica-Bold").fontSize(9).fillColor(BLACK);
    doc.text(data.employeeName, L + 4, y);
    doc.font("Helvetica").fontSize(7.5).fillColor(DARK);
    let addrY = y + 13;
    doc.text(data.employeeAddress1, L + 4, addrY);
    if (data.employeeAddress2) { addrY += 10; doc.text(data.employeeAddress2, L + 4, addrY); }
    addrY += 10;
    doc.text(data.employeeCityStateZip, L + 4, addrY);

    // Right side: company + period
    doc.font("Helvetica-Bold").fontSize(9).fillColor(BLACK);
    doc.text("SPRIMAGE", L + 350, y, { width: 200, align: "right" });
    doc.font("Helvetica").fontSize(7).fillColor(GRAY);
    doc.text(data.companyName, L + 350, y + 12, { width: 200, align: "right" });
    doc.text(`Pay Date: ${fmtDate(data.payDate)}`, L + 350, y + 24, { width: 200, align: "right" });
    doc.text(`Period: ${fmtDate(data.periodStart)} \u2013 ${fmtDate(data.periodEnd)}`, L + 350, y + 35, { width: 200, align: "right" });

    y = addrY + 20;
    drawRule(doc, L, y, W);
    y += 6;

    // ── EARNINGS TABLE ──
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor(ACCENT);
    doc.text("EARNINGS", L + 4, y);
    y += 10;

    const salaryEarningsCols = [L + 4, L + 355, L + 460];
    drawTableRow(doc, y, salaryEarningsCols, ["DESCRIPTION", "CURRENT", "YTD"], { bold: true, bg: "#f0f0f0", fontSize: 6.5 });
    y += 16;
    drawTableRow(doc, y, salaryEarningsCols, ["Regular Salary", usd(data.grossPay), usd(data.grossYtd)]);
    y += 14;
    drawRule(doc, L, y, W);
    y += 3;
    drawTableRow(doc, y, salaryEarningsCols, ["GROSS PAY", usd(data.grossPay), usd(data.grossYtd)], { bold: true });
    y += 18;

    // ── DEDUCTIONS TABLE ──
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor(ACCENT);
    doc.text("DEDUCTIONS", L + 4, y);
    y += 10;

    drawTableRow(doc, y, salaryEarningsCols, ["DESCRIPTION", "CURRENT", "YTD"], { bold: true, bg: "#f0f0f0", fontSize: 6.5 });
    y += 16;

    const deductions = [
      { label: "Federal Income Tax", current: data.federalTax, ytd: data.federalYtd },
      { label: "Social Security (OASDI)", current: data.ssTax, ytd: data.ssYtd },
      { label: "Medicare", current: data.medicareTax, ytd: data.medicareYtd },
    ];
    if (data.stateTax > 0) {
      deductions.push({ label: "State Income Tax", current: data.stateTax, ytd: data.stateTax * data.stubNumber });
    }
    for (const d of deductions) {
      drawTableRow(doc, y, salaryEarningsCols, [d.label, usd(d.current), usd(d.ytd)]);
      y += 14;
    }
    drawRule(doc, L, y, W);
    y += 3;
    const totalDedYtd = data.federalYtd + data.ssYtd + data.medicareYtd;
    drawTableRow(doc, y, salaryEarningsCols, ["TOTAL DEDUCTIONS", usd(data.totalDeductions), usd(totalDedYtd)], { bold: true });
    y += 20;

    // ── NET PAY BOX ──
    doc.rect(L, y, W, 28).fill("#f5f5f5").stroke(RULE);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(BLACK);
    doc.text("NET PAY", L + 8, y + 9);
    doc.font("Helvetica-Bold").fontSize(14).fillColor(BLACK);
    doc.text(usd(data.netPay), L + 100, y + 6, { width: W - 112, align: "right" });
    y += 32;

    // ── YTD Summary ──
    doc.font("Helvetica").fontSize(6.5).fillColor(GRAY);
    doc.text(`YTD Gross: ${usd(data.grossYtd)}`, L + 4, y);
    doc.text(`YTD Deductions: ${usd(data.federalYtd + data.ssYtd + data.medicareYtd)}`, L + 160, y);
    doc.text(`YTD Net: ${usd(data.netYtd)}`, L + 370, y);
    y += 16;

    // ── Cut line 2 ──
    drawCutLine(doc, y, W);
    y += 14;

    // ═══════════════════════════════════════════════
    // SECTION 3: EMPLOYEE COPY (bottom tear-off)
    // ═══════════════════════════════════════════════

    // Direct deposit info
    doc.font("Helvetica-Bold").fontSize(7).fillColor(ACCENT);
    doc.text("DIRECT DEPOSIT / EMPLOYEE COPY", L + 4, y);
    y += 12;

    doc.font("Helvetica").fontSize(7.5).fillColor(BLACK);
    doc.text(data.employeeName, L + 4, y);
    doc.text(`Employee ID: ${data.employeeId}`, L + 200, y);
    doc.text(`Pay Date: ${fmtDate(data.payDate)}`, L + 400, y);
    y += 12;

    doc.font("Helvetica").fontSize(7.5).fillColor(DARK);
    doc.text(`Routing: ${data.bankRouting}`, L + 4, y);
    doc.text(`Account: ******${data.bankAccountLastFour}`, L + 200, y);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(BLACK);
    doc.text(`Net Amount: ${usd(data.netPay)}`, L + 400, y);
    y += 12;

    doc.font("Helvetica").fontSize(7).fillColor(DARK);
    doc.text(`Period: ${fmtDate(data.periodStart)} \u2013 ${fmtDate(data.periodEnd)}`, L + 4, y);
    doc.text(`Gross: ${usd(data.grossPay)}`, L + 200, y);
    doc.text(`Deductions: ${usd(data.totalDeductions)}`, L + 350, y);
    y += 16;

    // Barcode
    if (barcodePng) {
      try {
        doc.image(barcodePng, L + 4, y, { width: 180, height: 28 });
      } catch { /* skip */ }
      doc.font("Courier").fontSize(6).fillColor(LIGHT_GRAY);
      doc.text(barcodeText, L + 4, y + 30);
    }

    // Confidentiality notice
    doc.font("Helvetica").fontSize(5.5).fillColor(LIGHT_GRAY);
    doc.text("This document is confidential. Retain for your records.  |  Sunrise Construction Payroll System", L + 200, y + 20, { width: W - 200, align: "right" });

    doc.end();
  });
}

// ── Calculation helpers (unchanged) ──

export interface PaystubCalcInput {
  annualSalary: number;
  startDate: string;
  employeeName: string;
  employeeAddress1: string;
  employeeAddress2: string;
  employeeCityStateZip: string;
  employeeId: string;
  lastFourSsn: string;
  bankRouting: string;
  bankAccountLastFour: string;
  filingStatus: string;
  exemptions: number;
  year: number;
  companyName?: string;
  companyAddress?: string;
}

export interface CalculatedPaystub {
  stubNumber: number;
  payDate: string;
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  hours: number;
  medicareTax: number;
  ssTax: number;
  federalTax: number;
  stateTax: number;
  totalDeductions: number;
  netPay: number;
  grossYtd: number;
  medicareYtd: number;
  ssYtd: number;
  federalYtd: number;
  netYtd: number;
}

const MEDICARE_RATE = 0.0145;
const SS_RATE = 0.062;
const FED_RATE = 0.1368;

export function calculateBiweeklyPaystubs(input: PaystubCalcInput): CalculatedPaystub[] {
  const biweeklyGross = input.annualSalary / 26;
  const medicarePer = +(biweeklyGross * MEDICARE_RATE).toFixed(2);
  const ssPer = +(biweeklyGross * SS_RATE).toFixed(2);
  const fedPer = +(biweeklyGross * FED_RATE).toFixed(2);
  const totalDed = +(medicarePer + ssPer + fedPer).toFixed(2);
  const netPer = +(biweeklyGross - totalDed).toFixed(2);

  const startDate = new Date(input.startDate);
  const stubs: CalculatedPaystub[] = [];

  const yearStart = new Date(input.year, 0, 1);
  let periodStart = new Date(yearStart);
  while (periodStart.getDay() !== 1) {
    periodStart.setDate(periodStart.getDate() + 1);
  }

  let stubNum = 0;
  let grossYtd = 0, medYtd = 0, ssYtd = 0, fedYtd = 0, netYtd = 0;

  for (let i = 0; i < 26; i++) {
    const pStart = new Date(periodStart);
    const pEnd = new Date(periodStart);
    pEnd.setDate(pEnd.getDate() + 13);
    const payDate = new Date(pEnd);
    payDate.setDate(payDate.getDate() + 5);

    if (pEnd < startDate) {
      periodStart.setDate(periodStart.getDate() + 14);
      continue;
    }

    const today = new Date();
    if (payDate > today) {
      periodStart.setDate(periodStart.getDate() + 14);
      continue;
    }

    stubNum++;
    grossYtd = +(grossYtd + biweeklyGross).toFixed(2);
    medYtd = +(medYtd + medicarePer).toFixed(2);
    ssYtd = +(ssYtd + ssPer).toFixed(2);
    fedYtd = +(fedYtd + fedPer).toFixed(2);
    netYtd = +(netYtd + netPer).toFixed(2);

    stubs.push({
      stubNumber: stubNum,
      payDate: payDate.toISOString().split("T")[0],
      periodStart: pStart.toISOString().split("T")[0],
      periodEnd: pEnd.toISOString().split("T")[0],
      grossPay: +biweeklyGross.toFixed(2),
      hours: 86.67,
      medicareTax: medicarePer,
      ssTax: ssPer,
      federalTax: fedPer,
      stateTax: 0,
      totalDeductions: totalDed,
      netPay: netPer,
      grossYtd,
      medicareYtd: medYtd,
      ssYtd,
      federalYtd: fedYtd,
      netYtd,
    });

    periodStart.setDate(periodStart.getDate() + 14);
  }

  return stubs;
}
