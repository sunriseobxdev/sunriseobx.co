import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requirePrivilege } from "../middleware/rbac.js";
import { getPool } from "../lib/db.js";
import { uploadBuffer, getSignedUrl } from "../lib/gcs.js";
import {
  generatePaystubPdf,
  calculateBiweeklyPaystubs,
  type PaystubData,
  type PaystubCalcInput,
} from "../lib/pdf-paystub.js";

export const payrollRouter = Router();
payrollRouter.use(authMiddleware);

const COMPANY_NAME = "Sprimage Labs";
const COMPANY_ADDRESS = "inquiries@sprimage.com";

// ── Employees CRUD ──

payrollRouter.get(
  "/employees",
  requirePrivilege("view_payroll"),
  async (_req, res) => {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT id, employee_id, full_name, email, title, department, annual_salary,
                start_date, end_date, pay_frequency, created_at
         FROM employees ORDER BY full_name ASC`
      );
      res.json(result.rows);
    } catch (err) {
      console.error("List employees error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

payrollRouter.get(
  "/employees/:id",
  requirePrivilege("view_payroll"),
  async (req, res) => {
    try {
      const pool = getPool();
      const result = await pool.query("SELECT * FROM employees WHERE id = $1", [
        req.params.id,
      ]);
      if (result.rows.length === 0) {
        res.status(404).json({ error: "Employee not found" });
        return;
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Get employee error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

payrollRouter.post(
  "/employees",
  requirePrivilege("manage_payroll"),
  async (req, res) => {
    try {
      const pool = getPool();
      const {
        employeeId, fullName, email, streetAddress1, streetAddress2,
        cityStateZip, lastFourSsn, bankRouting, bankAccountLastFour,
        annualSalary, payFrequency, filingStatus, exemptions,
        startDate, endDate, department, title,
      } = req.body;

      if (!employeeId || !fullName || !annualSalary || !startDate) {
        res.status(400).json({ error: "employeeId, fullName, annualSalary, and startDate are required" });
        return;
      }

      const result = await pool.query(
        `INSERT INTO employees (
          employee_id, full_name, email, street_address_1, street_address_2,
          city_state_zip, last_four_ssn, bank_routing, bank_account_last_four,
          annual_salary, pay_frequency, filing_status, exemptions,
          start_date, end_date, department, title, created_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        RETURNING *`,
        [
          employeeId, fullName, email || null, streetAddress1 || null, streetAddress2 || null,
          cityStateZip || null, lastFourSsn || null, bankRouting || null, bankAccountLastFour || null,
          annualSalary, payFrequency || "biweekly", filingStatus || "single", exemptions ?? 0,
          startDate, endDate || null, department || null, title || null,
          req.user!.userId !== "legacy" ? req.user!.userId : null,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      if (err?.code === "23505") {
        res.status(409).json({ error: "An employee with this ID already exists" });
        return;
      }
      console.error("Create employee error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

payrollRouter.put(
  "/employees/:id",
  requirePrivilege("manage_payroll"),
  async (req, res) => {
    try {
      const pool = getPool();
      const fields = req.body;
      const setClauses: string[] = ["updated_at = NOW()"];
      const values: unknown[] = [];
      let idx = 1;

      const allowedFields: Record<string, string> = {
        fullName: "full_name", email: "email", streetAddress1: "street_address_1",
        streetAddress2: "street_address_2", cityStateZip: "city_state_zip",
        lastFourSsn: "last_four_ssn", bankRouting: "bank_routing",
        bankAccountLastFour: "bank_account_last_four", annualSalary: "annual_salary",
        payFrequency: "pay_frequency", filingStatus: "filing_status",
        exemptions: "exemptions", startDate: "start_date", endDate: "end_date",
        department: "department", title: "title",
      };

      for (const [key, col] of Object.entries(allowedFields)) {
        if (fields[key] !== undefined) {
          setClauses.push(`${col} = $${idx++}`);
          values.push(fields[key]);
        }
      }

      values.push(req.params.id);
      const result = await pool.query(
        `UPDATE employees SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Employee not found" });
        return;
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Update employee error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ── Paystubs ──

payrollRouter.get(
  "/employees/:id/paystubs",
  requirePrivilege("view_payroll"),
  async (req, res) => {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT id, stub_number, pay_date, period_start, period_end,
                gross_pay, net_pay, total_deductions, pdf_path
         FROM paystubs WHERE employee_id = $1 ORDER BY pay_date DESC`,
        [req.params.id]
      );
      res.json(result.rows);
    } catch (err) {
      console.error("List paystubs error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Generate/backfill paystubs for an employee for a given year
payrollRouter.post(
  "/employees/:id/paystubs/generate",
  requirePrivilege("manage_payroll"),
  async (req, res) => {
    try {
      const pool = getPool();
      const { year } = req.body as { year?: number };
      const targetYear = year || new Date().getFullYear();

      // Load employee
      const empResult = await pool.query("SELECT * FROM employees WHERE id = $1", [
        req.params.id,
      ]);
      if (empResult.rows.length === 0) {
        res.status(404).json({ error: "Employee not found" });
        return;
      }
      const emp = empResult.rows[0];

      // Check for existing stubs in this year
      const existingResult = await pool.query(
        `SELECT stub_number FROM paystubs
         WHERE employee_id = $1 AND EXTRACT(YEAR FROM pay_date) = $2`,
        [req.params.id, targetYear]
      );
      const existingNums = new Set(existingResult.rows.map((r: any) => r.stub_number));

      const calcInput: PaystubCalcInput = {
        annualSalary: parseFloat(emp.annual_salary),
        startDate: emp.start_date,
        employeeName: emp.full_name,
        employeeAddress1: emp.street_address_1 || "",
        employeeAddress2: emp.street_address_2 || "",
        employeeCityStateZip: emp.city_state_zip || "",
        employeeId: emp.employee_id,
        lastFourSsn: emp.last_four_ssn || "0000",
        bankRouting: emp.bank_routing || "000000000",
        bankAccountLastFour: emp.bank_account_last_four || "0000",
        filingStatus: emp.filing_status || "single",
        exemptions: emp.exemptions || 0,
        year: targetYear,
        companyName: COMPANY_NAME,
        companyAddress: COMPANY_ADDRESS,
      };

      const calculated = calculateBiweeklyPaystubs(calcInput);
      const generated: any[] = [];

      for (const stub of calculated) {
        if (existingNums.has(stub.stubNumber)) continue;

        // Generate PDF
        const pdfData: PaystubData = {
          companyName: COMPANY_NAME,
          companyAddress: COMPANY_ADDRESS,
          employeeName: emp.full_name,
          employeeAddress1: emp.street_address_1 || "",
          employeeAddress2: emp.street_address_2 || "",
          employeeCityStateZip: emp.city_state_zip || "",
          employeeId: emp.employee_id,
          lastFourSsn: emp.last_four_ssn || "0000",
          bankRouting: emp.bank_routing || "000000000",
          bankAccountLastFour: emp.bank_account_last_four || "0000",
          filingStatus: emp.filing_status || "single",
          exemptions: emp.exemptions || 0,
          ...stub,
        };

        const pdfBuffer = await generatePaystubPdf(pdfData);
        const gcsPath = `paystubs/${emp.employee_id}/${targetYear}/stub-${stub.stubNumber}.pdf`;
        await uploadBuffer(pdfBuffer, gcsPath);

        // Insert into DB
        const insertResult = await pool.query(
          `INSERT INTO paystubs (
            employee_id, stub_number, pay_date, period_start, period_end,
            gross_pay, hours, medicare_tax, ss_tax, federal_tax, state_tax,
            total_deductions, net_pay, gross_ytd, medicare_ytd, ss_ytd,
            federal_ytd, net_ytd, pdf_path, created_by
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
          RETURNING id, stub_number, pay_date, period_start, period_end, gross_pay, net_pay`,
          [
            req.params.id, stub.stubNumber, stub.payDate, stub.periodStart, stub.periodEnd,
            stub.grossPay, stub.hours, stub.medicareTax, stub.ssTax, stub.federalTax,
            stub.stateTax, stub.totalDeductions, stub.netPay, stub.grossYtd,
            stub.medicareYtd, stub.ssYtd, stub.federalYtd, stub.netYtd, gcsPath,
            req.user!.userId !== "legacy" ? req.user!.userId : null,
          ]
        );

        generated.push(insertResult.rows[0]);
      }

      res.json({
        generated: generated.length,
        skipped: existingNums.size,
        stubs: generated,
      });
    } catch (err) {
      console.error("Generate paystubs error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get signed URL for a paystub PDF
payrollRouter.get(
  "/paystubs/:id/pdf",
  requirePrivilege("view_payroll"),
  async (req, res) => {
    try {
      const pool = getPool();
      const result = await pool.query(
        "SELECT pdf_path FROM paystubs WHERE id = $1",
        [req.params.id]
      );
      if (result.rows.length === 0 || !result.rows[0].pdf_path) {
        res.status(404).json({ error: "Paystub PDF not found" });
        return;
      }
      const url = await getSignedUrl(result.rows[0].pdf_path);
      res.json({ url });
    } catch (err) {
      console.error("Get paystub PDF error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
