import { useState } from "react";

type Props = {
  title: string;
  defaultOpen?: boolean;
  storageKey?: string;
  children: React.ReactNode;
};

const getStoredOpen = (storageKey: string): boolean | undefined => {
  try {
    if (typeof sessionStorage === "undefined") return undefined;
    const raw = sessionStorage.getItem(storageKey);
    if (raw === "true") return true;
    if (raw === "false") return false;
    return undefined;
  } catch {
    return undefined;
  }
};

const setStoredOpen = (storageKey: string, open: boolean): void => {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(storageKey, String(open));
  } catch {
    // ignore storage errors
  }
};

export const CollapsibleSection = ({ title, defaultOpen = false, storageKey, children }: Props) => {
  const [open, setOpen] = useState(() => {
    if (!storageKey) return defaultOpen;
    return getStoredOpen(storageKey) ?? defaultOpen;
  });

  return (
    <section style={{ border: "1px solid #374151", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() =>
          setOpen((v) => {
            const next = !v;
            if (storageKey) setStoredOpen(storageKey, next);
            return next;
          })
        }
        style={{ width: "100%", textAlign: "left", background: "#161b2b", color: "#e5e7eb", border: 0, padding: "8px 10px", fontWeight: 700, display: "flex", justifyContent: "space-between" }}
      >
        <span>{title}</span>
        <span>{open ? "▾" : "▸"}</span>
      </button>
      {open ? <div style={{ padding: 8, background: "#10131a" }}>{children}</div> : null}
    </section>
  );
};
