import { useState, type ReactNode } from "react";

type CollapsibleTone = "default" | "gm" | "warning" | "success";

const toneStyles: Record<CollapsibleTone, { background: string; borderColor: string }> = {
  default: { background: "#0f172a", borderColor: "#374151" },
  gm: { background: "#111827", borderColor: "#4b5563" },
  warning: { background: "#0f172a", borderColor: "#92400e" },
  success: { background: "#0f172a", borderColor: "#166534" }
};

export const CollapsibleDetailSection = ({
  title,
  children,
  defaultOpen = false,
  empty = false,
  meta,
  tone = "default"
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  empty?: boolean;
  meta?: string;
  tone?: CollapsibleTone;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sectionTone = toneStyles[tone];

  return (
    <section style={{ fontSize: 12, border: `1px solid ${sectionTone.borderColor}`, borderRadius: 6, background: sectionTone.background, padding: 6, opacity: empty ? 0.75 : 1 }}>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, border: 0, background: "transparent", color: "#e5e7eb", padding: 0, fontWeight: 700, textAlign: "left", cursor: "pointer" }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        </span>
        {meta ? <span style={{ flexShrink: 0, color: "#9ca3af", fontWeight: 500 }}>{meta}</span> : null}
      </button>
      {isOpen ? <div style={{ marginTop: 6 }}>{children}</div> : null}
    </section>
  );
};
