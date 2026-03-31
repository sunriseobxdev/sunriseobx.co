import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, "../../assets/logo-eagle-spr.png");

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
}

export function generatePaystubPdf(data: PaystubData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 532; // usable width (letter - 2*40)
    let y = 40;

    // Background
    doc.rect(0, 0, 612, 792).fill("#0d0d0d");

    // Header bar
    doc.rect(40, y, W, 70).fill(DARK_BG);
    doc.rect(40, y, W, 2).fill(GOLD);

    // Logo
    try {
      doc.image(LOGO_PATH, 50, y + 8, { width: 54 });
    } catch {
      // logo not found — skip
    }

    // Company name
    doc.font("Helvetica-Bold").fontSize(14).fillColor(GOLD);
    doc.text("SPRIMAGE", 112, y + 14, { width: 200 });
    doc.font("Helvetica").fontSize(7).fillColor(TEXT_MUTED);
    doc.text(data.companyName, 112, y + 32);
    doc.text(data.companyAddress, 112, y + 42);

    // Stub number + pay date
    doc.font("Helvetica-Bold").fontSize(8).fillColor(GOLD);
    doc.text(`EARNINGS STATEMENT`, 380, y + 12, { width: 180, align: "right" });
    doc.font("Helvetica").fontSize(7).fillColor(TEXT);
    doc.text(`Stub #${data.stubNumber}`, 380, y + 26, { width: 180, align: "right" });
    doc.text(`Pay Date: ${fmtDate(data.payDate)}`, 380, y + 38, { width: 180, align: "right" });
    doc.text(`Period: ${fmtDate(data.periodStart)} - ${fmtDate(data.periodEnd)}`, 380, y + 50, { width: 180, align: "right" });

    y += 80;

    // Employee info section
    doc.rect(40, y, W, 52).fill(DARK_BG);
    doc.font("Helvetica-Bold").fontSize(7).fillColor(GOLD_DARK);
    doc.text("EMPLOYEE", 50, y + 6);
    doc.font("Helvetica").fontSize(8).fillColor(TEXT);
    doc.text(data.employeeName, 50, y + 18);
    doc.fontSize(7).fillColor(TEXT_MUTED);
    doc.text(data.employeeAddress1, 50, y + 30);
    if (data.employeeAddress2) doc.text(data.employeeAddress2, 50, y + 39);
    doc.text(data.employeeCityStateZip, 50, data.employeeAddress2 ? y + 48 : y + 39);

    // Employee identifiers on right
    doc.font("Helvetica").fontSize(7).fillColor(TEXT_MUTED);
    const idX = 360;
    doc.text(`Employee ID: ${data.employeeId}`, idX, y + 6, { width: 200, align: "right" });
    doc.text(`SSN: ***-**-${data.lastFourSsn}`, idX, y + 18, { width: 200, align: "right" });
    doc.text(`Filing: ${data.filingStatus.toUpperCase()} / ${data.exemptions} exemptions`, idX, y + 30, { width: 200, align: "right" });

    y += 60;

    // Earnings table header
    doc.rect(40, y, W, 18).fill(GOLD_DARK);
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#0a0a0a");
    const cols = [50, 180, 280, 370, 460];
    doc.text("DESCRIPTION", cols[0], y + 5);
    doc.text("HOURS", cols[1], y + 5);
    doc.text("RATE", cols[2], y + 5);
    doc.text("CURRENT", cols[3], y + 5);
    doc.text("YTD", cols[4], y + 5);
    y += 18;

    // Earnings row
    const hourlyRate = data.grossPay / data.hours;
    doc.rect(40, y, W, 18).fill(DARK_BG);
    doc.font("Helvetica").fontSize(7).fillColor(TEXT);
    doc.text("Regular Wages", cols[0], y + 5);
    doc.text(data.hours.toFixed(2), cols[1], y + 5);
    doc.text(usd(hourlyRate), cols[2], y + 5);
    doc.text(usd(data.grossPay), cols[3], y + 5);
    doc.text(usd(data.grossYtd), cols[4], y + 5);
    y += 18;

    // Gross total
    doc.rect(40, y, W, 18).fill("#151515");
    doc.font("Helvetica-Bold").fontSize(7).fillColor(GOLD);
    doc.text("GROSS PAY", cols[0], y + 5);
    doc.text(usd(data.grossPay), cols[3], y + 5);
    doc.text(usd(data.grossYtd), cols[4], y + 5);
    y += 26;

    // Deductions header
    doc.rect(40, y, W, 18).fill(GOLD_DARK);
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#0a0a0a");
    doc.text("DEDUCTIONS", cols[0], y + 5);
    doc.text("CURRENT", cols[3], y + 5);
    doc.text("YTD", cols[4], y + 5);
    y += 18;

    // Deduction rows
    const deductions = [
      { label: "Federal Income Tax", current: data.federalTax, ytd: data.federalYtd },
      { label: "Social Security", current: data.ssTax, ytd: data.ssYtd },
      { label: "Medicare", current: data.medicareTax, ytd: data.medicareYtd },
    ];
    if (data.stateTax > 0) {
      deductions.push({ label: "State Income Tax", current: data.stateTax, ytd: data.stateTax * data.stubNumber });
    }

    for (let i = 0; i < deductions.length; i++) {
      const bg = i % 2 === 0 ? DARK_BG : "#151515";
      doc.rect(40, y, W, 18).fill(bg);
      doc.font("Helvetica").fontSize(7).fillColor(TEXT);
      doc.text(deductions[i].label, cols[0], y + 5);
      doc.text(usd(deductions[i].current), cols[3], y + 5);
      doc.text(usd(deductions[i].ytd), cols[4], y + 5);
      y += 18;
    }

    // Total deductions
    doc.rect(40, y, W, 18).fill("#151515");
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#e05555");
    doc.text("TOTAL DEDUCTIONS", cols[0], y + 5);
    doc.text(usd(data.totalDeductions), cols[3], y + 5);
    y += 26;

    // Net pay box
    doc.rect(40, y, W, 36).fill(DARK_BG);
    doc.rect(40, y, W, 2).fill(GOLD);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(GOLD);
    doc.text("NET PAY", 50, y + 12);
    doc.fontSize(14);
    doc.text(usd(data.netPay), 200, y + 9, { width: 360, align: "right" });
    doc.font("Helvetica").fontSize(7).fillColor(TEXT_MUTED);
    doc.text(`YTD: ${usd(data.netYtd)}`, 200, y + 26, { width: 360, align: "right" });
    y += 44;

    // Direct deposit section
    doc.rect(40, y, W, 40).fill(DARK_BG);
    doc.font("Helvetica-Bold").fontSize(7).fillColor(GOLD_DARK);
    doc.text("DIRECT DEPOSIT", 50, y + 6);
    doc.font("Helvetica").fontSize(7).fillColor(TEXT);
    doc.text(`Routing: ${data.bankRouting}`, 50, y + 20);
    doc.text(`Account: ******${data.bankAccountLastFour}`, 50, y + 30);
    doc.text(`Amount: ${usd(data.netPay)}`, 250, y + 20);
    y += 48;

    // Footer
    doc.rect(40, y, W, 1).fill(GOLD_DARK);
    y += 8;
    doc.font("Helvetica").fontSize(6).fillColor(TEXT_MUTED);
    doc.text("This is a confidential document. Retain for your records.", 40, y, { width: W, align: "center" });
    doc.text(`Generated by Sprimage Payroll System`, 40, y + 10, { width: W, align: "center" });

    doc.end();
  });
}

// Calculate tax deductions and generate all paystubs for backfill
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

  // Generate biweekly periods for the given year
  // First period starts on the first Monday of the year (or startDate if later)
  const yearStart = new Date(input.year, 0, 1);
  let periodStart = new Date(yearStart);
  // Find first Monday
  while (periodStart.getDay() !== 1) {
    periodStart.setDate(periodStart.getDate() + 1);
  }

  let stubNum = 0;
  let grossYtd = 0, medYtd = 0, ssYtd = 0, fedYtd = 0, netYtd = 0;

  for (let i = 0; i < 26; i++) {
    const pStart = new Date(periodStart);
    const pEnd = new Date(periodStart);
    pEnd.setDate(pEnd.getDate() + 13); // 2 weeks
    const payDate = new Date(pEnd);
    payDate.setDate(payDate.getDate() + 5); // pay 5 days after period end

    // Skip if period is before employee start date
    if (pEnd < startDate) {
      periodStart.setDate(periodStart.getDate() + 14);
      continue;
    }

    // Skip if pay date is in the future
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
