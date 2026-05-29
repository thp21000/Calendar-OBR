import type { CSSProperties, PropsWithChildren, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, InputHTMLAttributes, ButtonHTMLAttributes } from "react";
import { ui } from "./styles";

const baseCard: CSSProperties = {
  background: ui.colors.surface,
  border: `1px solid ${ui.colors.border}`,
  borderRadius: ui.radius.md,
  padding: ui.spacing.sm
};

export const Panel = ({ children, style }: PropsWithChildren<{ style?: CSSProperties }>) => (
  <div style={{ ...baseCard, ...style }}>{children}</div>
);

export const SectionCard = ({ children, style }: PropsWithChildren<{ style?: CSSProperties }>) => (
  <section style={{ ...baseCard, marginBottom: ui.spacing.sm, ...style }}>{children}</section>
);

export const SectionHeader = ({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ui.spacing.sm }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
      {subtitle ? <div style={{ fontSize: 12, color: ui.colors.textMuted }}>{subtitle}</div> : null}
    </div>
    {right}
  </div>
);

export const Badge = ({ children, tone = "default" }: PropsWithChildren<{ tone?: "default" | "success" | "warning" | "danger" }>) => {
  const map = {
    default: { bg: ui.colors.surfaceSoft, text: ui.colors.textSecondary },
    success: { bg: ui.colors.success, text: ui.colors.successText },
    warning: { bg: ui.colors.warning, text: ui.colors.warningText },
    danger: { bg: ui.colors.dangerSoft, text: "#fecaca" }
  } as const;
  return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 11, background: map[tone].bg, color: map[tone].text }}>{children}</span>;
};

const buttonBase: CSSProperties = { borderRadius: ui.radius.sm, padding: "7px 10px", fontSize: 12, border: `1px solid ${ui.colors.border}`, cursor: "pointer" };
export const PrimaryButton = (props: ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} style={{ ...buttonBase, background: ui.colors.accent, borderColor: ui.colors.accent, color: "white", ...(props.style ?? {}) }} />;
export const SecondaryButton = (props: ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} style={{ ...buttonBase, background: ui.colors.surfaceSoft, color: ui.colors.textPrimary, ...(props.style ?? {}) }} />;
export const DangerButton = (props: ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} style={{ ...buttonBase, background: ui.colors.dangerSoft, borderColor: ui.colors.danger, color: "#fee2e2", ...(props.style ?? {}) }} />;
export const IconButton = (props: ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} style={{ ...buttonBase, padding: "6px 8px", minWidth: 30, ...(props.style ?? {}) }} />;

const fieldBase: CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: ui.radius.sm, border: `1px solid ${ui.colors.border}`, background: ui.colors.surfaceSoft, color: ui.colors.textPrimary, padding: "7px 8px", fontSize: 12 };
export const TextInput = (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} style={{ ...fieldBase, ...(props.style ?? {}) }} />;
export const NumberInput = (props: InputHTMLAttributes<HTMLInputElement>) => <input type="number" {...props} style={{ ...fieldBase, ...(props.style ?? {}) }} />;
export const SelectInput = (props: SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} style={{ ...fieldBase, ...(props.style ?? {}) }} />;
export const TextareaInput = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} style={{ ...fieldBase, minHeight: 70, ...(props.style ?? {}) }} />;

export const EmptyState = ({ text }: { text: string }) => <div style={{ fontSize: 12, color: ui.colors.textMuted, padding: "6px 0" }}>{text}</div>;
export const Divider = () => <div style={{ height: 1, background: ui.colors.border, margin: `${ui.spacing.sm}px 0` }} />;
export const Toolbar = ({ children }: PropsWithChildren) => <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: ui.spacing.sm }}>{children}</div>;
export const InfoRow = ({ label, value }: { label: string; value?: ReactNode }) => <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, marginBottom: 4 }}><span style={{ color: ui.colors.textMuted }}>{label}</span><span style={{ color: ui.colors.textSecondary, textAlign: "right" }}>{value ?? "—"}</span></div>;

export { CollapsibleDetailSection } from "./CollapsibleDetailSection";