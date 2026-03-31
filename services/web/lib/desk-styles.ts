import type { CSSProperties } from "react";

// Sunrise OBX Admin Design System
// All desk pages should use these tokens for consistent styling

export const colors = {
  // Backgrounds
  card: "#1e3a5f",        // navy-700ish
  cardHover: "#243b53",   // navy-800
  surface: "#102a43",     // navy-900
  surfaceLight: "#1a3550", // between 800 and 900
  input: "#163350",       // dark navy input bg
  inputBorder: "#2d5f8a", // navy-500ish border
  inputFocus: "#f97316",  // sunrise-500

  // Text
  heading: "#ffffff",
  body: "#9fb3c8",        // navy-300
  muted: "#627d98",       // navy-500
  label: "#829ab1",       // navy-400
  link: "#fb923c",        // sunrise-400

  // Accents
  accent: "#f97316",      // sunrise-500
  accentDark: "#ea580c",  // sunrise-600
  accentLight: "#fdba74",  // sunrise-300
  success: "#34d399",     // emerald-400
  successBg: "rgba(16, 185, 129, 0.1)",
  danger: "#f87171",      // red-400
  dangerBg: "rgba(239, 68, 68, 0.1)",
  warning: "#fbbf24",     // amber-400
  warningBg: "rgba(245, 158, 11, 0.1)",
  info: "#60a5fa",        // blue-400
  infoBg: "rgba(59, 130, 246, 0.1)",

  // Borders
  border: "#2d5f8a",      // navy border
  borderLight: "#334e68",  // navy-700
};

export const cardStyle: CSSProperties = {
  background: colors.card,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: "12px",
  padding: "1.5rem",
};

export const cardTitleStyle: CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: colors.muted,
  marginBottom: "1rem",
};

export const inputStyle: CSSProperties = {
  background: colors.input,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: "8px",
  padding: "0.6rem 0.75rem",
  color: colors.heading,
  fontSize: "0.875rem",
  width: "100%",
  outline: "none",
};

export const labelStyle: CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: colors.label,
  marginBottom: "0.3rem",
  display: "block",
};

export const buttonPrimary: CSSProperties = {
  background: colors.accent,
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "0.7rem 1.5rem",
  fontWeight: 700,
  fontSize: "0.875rem",
  cursor: "pointer",
  letterSpacing: "0.03em",
};

export const buttonSecondary: CSSProperties = {
  background: "transparent",
  color: colors.body,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: "8px",
  padding: "0.5rem 1rem",
  fontWeight: 500,
  fontSize: "0.8rem",
  cursor: "pointer",
};

export const badgeStyle = (variant: "success" | "danger" | "warning" | "info" | "accent" | "muted"): CSSProperties => {
  const map = {
    success: { bg: colors.successBg, color: colors.success, border: "rgba(16,185,129,0.2)" },
    danger: { bg: colors.dangerBg, color: colors.danger, border: "rgba(239,68,68,0.2)" },
    warning: { bg: colors.warningBg, color: colors.warning, border: "rgba(245,158,11,0.2)" },
    info: { bg: colors.infoBg, color: colors.info, border: "rgba(59,130,246,0.2)" },
    accent: { bg: "rgba(249,115,22,0.1)", color: colors.accent, border: "rgba(249,115,22,0.2)" },
    muted: { bg: "rgba(98,125,152,0.1)", color: colors.muted, border: "rgba(98,125,152,0.2)" },
  };
  const v = map[variant];
  return {
    display: "inline-block",
    padding: "0.2rem 0.6rem",
    borderRadius: "6px",
    fontSize: "0.7rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    background: v.bg,
    color: v.color,
    border: `1px solid ${v.border}`,
  };
};

export const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.8rem",
};

export const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "0.75rem 1rem",
  fontSize: "0.7rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: colors.muted,
  borderBottom: `1px solid ${colors.borderLight}`,
};

export const tdStyle: CSSProperties = {
  padding: "0.75rem 1rem",
  color: colors.body,
  borderBottom: `1px solid rgba(45,95,138,0.2)`,
};

export const pageTitle: CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: 800,
  color: colors.heading,
  marginBottom: "1.5rem",
};

export const sectionGap: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
};
