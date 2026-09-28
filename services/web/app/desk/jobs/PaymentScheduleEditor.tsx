"use client";

import React from "react";
import {
  inputStyle,
  labelStyle,
  buttonSecondary,
  colors,
} from "@/lib/desk-styles";

export interface PaymentPhase {
  label?: string | null;
  amount: string;
  due_on: string;
}

/** Wording Sunrise uses for the common four-phase exterior job. */
export const PRESET_PHASES: { due_on: string }[] = [
  {
    due_on:
      "Due upon signing this agreement and before Sunrise Construction releases the custom windows and other special-order materials for purchase.",
  },
  {
    due_on: "Due when the windows have been delivered and work begins on site.",
  },
  {
    due_on:
      "Due when the windows have been installed and exterior siding work is underway.",
  },
  {
    due_on:
      "Due upon completion of the contracted work and the final homeowner walk-through.",
  },
];

const ORDINALS = [
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

export const MAX_PHASES = 12;

export function defaultPhaseLabel(index: number, total: number): string {
  if (total === 1) return "Payment in full";
  if (index === total - 1) return "Final payment";
  return `${ORDINALS[index] ?? `Payment ${index + 1}`} payment`;
}

export function phaseTotal(phases: PaymentPhase[]): number {
  return phases.reduce((sum, p) => {
    const n = parseFloat(p.amount);
    return Number.isFinite(n) ? sum + n : sum;
  }, 0);
}

/** Strip incomplete rows and shape for the API. */
export function serializePhases(
  phases: PaymentPhase[]
): { label: string | null; amount: number; due_on: string }[] {
  return phases
    .map((p) => ({
      label: p.label?.trim() ? p.label.trim() : null,
      amount: parseFloat(p.amount),
      due_on: p.due_on.trim(),
    }))
    .filter((p) => Number.isFinite(p.amount) && p.amount > 0 && p.due_on.length > 0);
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

interface Props {
  phases: PaymentPhase[];
  onChange: (phases: PaymentPhase[]) => void;
  /** Contract total the installments must add up to. */
  contractAmount: number;
}

export default function PaymentScheduleEditor({
  phases,
  onChange,
  contractAmount,
}: Props) {
  const total = phaseTotal(phases);
  const remaining = Math.round((contractAmount - total) * 100) / 100;
  const balanced = Math.abs(remaining) < 0.005;

  function update(i: number, key: keyof PaymentPhase, value: string) {
    onChange(phases.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));
  }

  function addPhase() {
    if (phases.length >= MAX_PHASES) return;
    onChange([
      ...phases,
      {
        label: "",
        amount: remaining > 0 ? remaining.toFixed(2) : "",
        due_on: "",
      },
    ]);
  }

  function removePhase(i: number) {
    onChange(phases.filter((_, idx) => idx !== i));
  }

  function move(i: number, delta: number) {
    const target = i + delta;
    if (target < 0 || target >= phases.length) return;
    const next = [...phases];
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  }

  /** Four-phase Sunrise standard, split evenly with the remainder on the last. */
  function applyPreset() {
    const n = PRESET_PHASES.length;
    if (!(contractAmount > 0)) {
      onChange(PRESET_PHASES.map((p) => ({ label: "", amount: "", due_on: p.due_on })));
      return;
    }
    const each = Math.floor((contractAmount / n) * 100) / 100;
    const amounts = Array(n).fill(each);
    amounts[n - 1] = Math.round((contractAmount - each * (n - 1)) * 100) / 100;
    onChange(
      PRESET_PHASES.map((p, i) => ({
        label: "",
        amount: amounts[i].toFixed(2),
        due_on: p.due_on,
      }))
    );
  }

  /** Re-split the current number of phases evenly across the contract amount. */
  function splitEvenly() {
    const n = phases.length;
    if (n === 0 || !(contractAmount > 0)) return;
    const each = Math.floor((contractAmount / n) * 100) / 100;
    const amounts = Array(n).fill(each);
    amounts[n - 1] = Math.round((contractAmount - each * (n - 1)) * 100) / 100;
    onChange(phases.map((p, i) => ({ ...p, amount: amounts[i].toFixed(2) })));
  }

  const smallBtn: React.CSSProperties = {
    ...buttonSecondary,
    fontSize: "0.65rem",
    padding: "0.3rem 0.6rem",
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "0.5rem",
        }}
      >
        <label style={{ ...labelStyle, marginBottom: 0 }}>Payment Schedule</label>
        <button type="button" style={smallBtn} onClick={addPhase}>
          + Add Phase
        </button>
        {phases.length === 0 && (
          <button type="button" style={smallBtn} onClick={applyPreset}>
            Use 4-Phase Standard
          </button>
        )}
        {phases.length > 1 && contractAmount > 0 && (
          <button type="button" style={smallBtn} onClick={splitEvenly}>
            Split Evenly
          </button>
        )}
        {phases.length > 0 && (
          <button type="button" style={smallBtn} onClick={() => onChange([])}>
            Clear
          </button>
        )}
      </div>

      {phases.length === 0 ? (
        <p style={{ color: colors.muted, fontSize: "0.7rem", margin: 0 }}>
          No phases — the agreement will read as a single flat fee. Add phases to
          bill the job in installments (materials release, delivery, install,
          final walk-through).
        </p>
      ) : (
        <>
          {phases.map((phase, i) => (
            <div
              key={i}
              style={{
                border: `1px solid ${colors.borderLight}`,
                borderRadius: "8px",
                padding: "0.75rem",
                marginBottom: "0.5rem",
                background: "rgba(148,163,184,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  style={{
                    color: colors.heading,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    flex: 1,
                  }}
                >
                  {phase.label?.trim() || defaultPhaseLabel(i, phases.length)}
                </span>
                <button
                  type="button"
                  style={smallBtn}
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move phase up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  style={smallBtn}
                  onClick={() => move(i, 1)}
                  disabled={i === phases.length - 1}
                  aria-label="Move phase down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  style={{ ...smallBtn, color: colors.danger }}
                  onClick={() => removePhase(i)}
                  aria-label="Remove phase"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label style={{ ...labelStyle, fontSize: "0.65rem" }}>
                    Amount ($)
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    step="0.01"
                    value={phase.amount}
                    onChange={(e) => update(i, "amount", e.target.value)}
                    placeholder="30000.00"
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: "0.65rem" }}>
                    Label (optional — defaults to &ldquo;
                    {defaultPhaseLabel(i, phases.length)}&rdquo;)
                  </label>
                  <input
                    style={inputStyle}
                    value={phase.label ?? ""}
                    onChange={(e) => update(i, "label", e.target.value)}
                    placeholder={defaultPhaseLabel(i, phases.length)}
                  />
                </div>
              </div>

              <div style={{ marginTop: "0.5rem" }}>
                <label style={{ ...labelStyle, fontSize: "0.65rem" }}>
                  Due when…
                </label>
                <textarea
                  style={{
                    ...inputStyle,
                    minHeight: "60px",
                    resize: "vertical",
                    fontSize: "0.75rem",
                  }}
                  value={phase.due_on}
                  onChange={(e) => update(i, "due_on", e.target.value)}
                  placeholder="Due upon signing this agreement and before Sunrise Construction releases the custom windows and other special-order materials for purchase."
                />
              </div>
            </div>
          ))}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              fontSize: "0.75rem",
              background: balanced
                ? "rgba(16,185,129,0.1)"
                : "rgba(249,115,22,0.1)",
              border: `1px solid ${
                balanced ? "rgba(16,185,129,0.3)" : "rgba(249,115,22,0.3)"
              }`,
              color: balanced ? colors.success : colors.warning,
            }}
          >
            <span>
              <strong>Scheduled:</strong> {usd.format(total)} of{" "}
              {usd.format(contractAmount)}
            </span>
            <span>
              {balanced
                ? "Balanced ✓"
                : remaining > 0
                  ? `${usd.format(remaining)} unscheduled`
                  : `${usd.format(Math.abs(remaining))} over contract`}
            </span>
          </div>
          {!balanced && (
            <p
              style={{
                color: colors.muted,
                fontSize: "0.65rem",
                marginTop: "0.35rem",
              }}
            >
              Installments must add up to the contract amount before an agreement
              can be issued.
            </p>
          )}
        </>
      )}
    </div>
  );
}
