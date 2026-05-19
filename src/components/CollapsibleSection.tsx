import { useState } from "react";

type Props = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export const CollapsibleSection = ({ title, defaultOpen = false, children }: Props) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section style={{ border: "1px solid #374151", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", textAlign: "left", background: "#161b2b", color: "#e5e7eb", border: 0, padding: "8px 10px", fontWeight: 700, display: "flex", justifyContent: "space-between" }}
      >
        <span>{title}</span>
        <span>{open ? "▾" : "▸"}</span>
      </button>
      {open ? <div style={{ padding: 8, background: "#10131a" }}>{children}</div> : null}
    </section>
  );
};
