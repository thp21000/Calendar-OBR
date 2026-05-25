import type { CSSProperties } from "react";

export const ui = {
  colors: {
    background: "#0b1020",
    surface: "#121a2b",
    surfaceElevated: "#182238",
    surfaceSoft: "#1f2a40",
    border: "#334155",
    textPrimary: "#e5e7eb",
    textSecondary: "#cbd5e1",
    textMuted: "#94a3b8",
    accent: "#3b82f6",
    accentSoft: "#1d4ed8",
    danger: "#ef4444",
    dangerSoft: "#7f1d1d"
  },
  radius: { sm: 6, md: 8, lg: 12 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16 }
};

export const appShellStyle: CSSProperties = {
  width: "100%",
  maxWidth: 360,
  minHeight: 480,
  boxSizing: "border-box",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 13,
  background: ui.colors.background,
  color: ui.colors.textPrimary,
  padding: ui.spacing.md,
  borderRadius: ui.radius.lg,
  overflowX: "hidden",
  display: "flex",
  flexDirection: "column",
  gap: ui.spacing.sm
};

export const titleStyle: CSSProperties = { fontSize: 16, margin: "0 0 6px", fontWeight: 700 };

export const subtitleStyle: CSSProperties = {
  fontSize: 12,
  color: ui.colors.textMuted,
  marginBottom: 8
};

export const tabsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: 6,
  marginBottom: 10
};

export const tabButtonStyle = (active: boolean): CSSProperties => ({
  border: `1px solid ${active ? ui.colors.accent : ui.colors.border}`,
  borderRadius: ui.radius.sm,
  background: active ? ui.colors.accent : ui.colors.surfaceSoft,
  color: "#f8fafc",
  padding: "7px 8px",
  fontSize: 12,
  fontWeight: active ? 700 : 500,
  cursor: "pointer"
});
