/**
 * Phased payment schedules for job agreements.
 *
 * Historically the desk only ever produced one of two compensation clauses:
 * a flat fee, or a flat fee with a single deposit + balance. Larger jobs are
 * billed in milestone installments (materials release, delivery, install,
 * final walk-through), so a schedule is an ordered list of phases, each with
 * an amount and the event that makes it due.
 */

export interface PaymentPhase {
  /** Optional override for the auto-generated "Initial/Second/.../Final payment" label. */
  label?: string | null;
  /** Dollar amount of this installment. */
  amount: number;
  /** Plain-text description of the event that makes this installment due. */
  due_on: string;
}

const ORDINAL_LABELS = [
  "Initial",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
  "Ninth",
  "Tenth",
  "Eleventh",
  "Twelfth",
];

const COUNT_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

/** Largest schedule we will render. Keeps a pasted array from blowing up a contract. */
export const MAX_PHASES = 12;

/** Amounts are compared to the cent; anything inside this is considered equal. */
const EPSILON = 0.005;

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Coerce whatever arrived on the request body into a clean phase list.
 * Anything without a positive amount or a due-on description is dropped, so a
 * half-filled row in the desk UI never reaches a customer-facing contract.
 */
export function normalizePaymentSchedule(raw: unknown): PaymentPhase[] {
  if (!Array.isArray(raw)) return [];

  const phases: PaymentPhase[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;

    const amount =
      typeof row.amount === "number" ? row.amount : parseFloat(String(row.amount ?? ""));
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const dueOn = String(row.due_on ?? "").trim();
    if (!dueOn) continue;

    const label = row.label ? String(row.label).trim() : "";

    phases.push({
      label: label || null,
      amount: round2(amount),
      due_on: dueOn,
    });

    if (phases.length >= MAX_PHASES) break;
  }

  return phases;
}

export function scheduleTotal(phases: PaymentPhase[]): number {
  return round2(phases.reduce((sum, p) => sum + p.amount, 0));
}

/**
 * "Initial payment", "Second payment", ..., "Final payment" for the last one.
 * A single-phase schedule is just "Payment in full".
 */
export function phaseLabel(index: number, total: number, custom?: string | null): string {
  if (custom && custom.trim()) return custom.trim();
  if (total === 1) return "Payment in full";
  if (index === total - 1) return "Final payment";
  const ordinal = ORDINAL_LABELS[index];
  return ordinal ? `${ordinal} payment` : `Payment ${index + 1}`;
}

function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n);
}

/**
 * Validate a schedule against the job's contract amount.
 * Returns an error string, or null when the schedule is good to render.
 */
export function validatePaymentSchedule(
  phases: PaymentPhase[],
  contractAmount?: number | null
): string | null {
  if (phases.length === 0) return null;
  if (phases.length > MAX_PHASES) {
    return `A payment schedule may have at most ${MAX_PHASES} phases.`;
  }
  if (contractAmount == null || !Number.isFinite(contractAmount) || contractAmount <= 0) {
    return null;
  }
  const total = scheduleTotal(phases);
  if (Math.abs(total - contractAmount) > EPSILON) {
    return (
      `Payment schedule totals ${formatUsd(total)} but the contract amount is ` +
      `${formatUsd(contractAmount)}. The installments must add up to the contract amount.`
    );
  }
  return null;
}

/**
 * Render the Compensation clause (sections 7-9 of the standard agreement).
 *
 * With no phases this is the historical flat-fee wording, so existing
 * agreements and single-price jobs are unchanged. With phases it emits the
 * milestone schedule.
 */
export function renderCompensationHtml(
  contractAmount: number,
  phases: PaymentPhase[] = []
): string {
  const amount = Number.isFinite(contractAmount) ? contractAmount : 0;
  const taxClause =
    "The above Compensation includes all applicable sales tax, and duties as required by law.";

  if (phases.length === 0) {
    return (
      `<p>7. For the services rendered, the Client will provide compensation to the ` +
      `Contractor for the flat fee of <strong>${formatUsd(amount)}</strong>.</p>` +
      `<p>8. ${taxClause}</p>`
    );
  }

  const total = scheduleTotal(phases);
  const stated = amount > 0 ? amount : total;

  const intro =
    phases.length === 1
      ? `<p>7. For the services rendered, the Client will provide compensation to the ` +
        `Contractor in the total amount of <strong>${formatUsd(stated)}</strong>, ` +
        `payable in accordance with the payment schedule set out below.</p>`
      : `<p>7. For the services rendered, the Client will provide compensation to the ` +
        `Contractor in the total amount of <strong>${formatUsd(stated)}</strong>, ` +
        `payable in ${countWord(phases.length)} (${phases.length}) installments in ` +
        `accordance with the payment schedule set out below.</p>`;

  const rows = phases
    .map((phase, i) => {
      const label = escapeHtml(phaseLabel(i, phases.length, phase.label));
      const dueOn = escapeHtml(phase.due_on);
      return (
        `<p style="margin: 0.9em 0 0.9em 1.5em;">` +
        `<strong>${label} &mdash; ${formatUsd(phase.amount)}</strong><br/>${dueOn}` +
        `</p>`
      );
    })
    .join("\n");

  return (
    intro +
    `\n<h4 style="text-align: center; text-decoration: none; letter-spacing: 0.5px;">PAYMENT SCHEDULE</h4>\n` +
    rows +
    `\n<p>8. Each installment set out above becomes due and payable upon the occurrence of ` +
    `the corresponding event described, and is payable within seven (7) days of the ` +
    `Contractor&rsquo;s invoice for that installment. The Contractor may suspend ` +
    `performance of the Services until any overdue installment has been paid in full.</p>` +
    `\n<p>9. ${taxClause}</p>`
  );
}
