import OBR from "@owlbear-rodeo/sdk";
import { useMemo, type CSSProperties } from "react";
import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { clearPopupNotificationPayload, readPopupNotificationPayload, type PopupNotificationPayload } from "../../obr/popupNotifications";

const getTypeLabelKey = (type: PopupNotificationPayload["type"]): string => `popupNotification.type.${type}`;
const getAudienceLabelKey = (audience: PopupNotificationPayload["audience"]): string => `popupNotification.audience.${audience}`;

const closeObrModal = async (modalId: string | undefined) => {
  if (!modalId || !OBR.isAvailable) return;
  try {
    await OBR.modal.close(modalId);
  } catch {
    // Modal may already be closed by OBR.
  }
};

export const NotificationModalView = ({ project }: { project: CalendarProject }) => {
  const search = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const notificationId = search.get("notificationId") ?? "";
  const modalId = search.get("notificationModalId") ?? undefined;
  const payload = useMemo(() => notificationId ? readPopupNotificationPayload(notificationId) : undefined, [notificationId]);

  const handleClose = () => {
    if (notificationId) clearPopupNotificationPayload(notificationId);
    void closeObrModal(modalId);
  };

  if (!payload) {
    return <main style={modalShellStyle}>
      <section style={panelStyle}>
        <h1 style={titleStyle}>{t(project.locale, "popupNotification.title")}</h1>
        <p style={mutedStyle}>{t(project.locale, "popupNotification.missing")}</p>
        <button type="button" onClick={handleClose} style={buttonStyle}>{t(project.locale, "popupNotification.close")}</button>
      </section>
    </main>;
  }

  const mainDescription = payload.audience === "gm" ? payload.gmDescription || payload.body : payload.playerDescription || payload.body;

  return <main style={modalShellStyle}>
    <section style={panelStyle}>
      <div style={headingRowStyle}>
        <div style={iconStyle}>{payload.icon ?? "🔔"}</div>
        <div>
          <div style={eyebrowStyle}>{t(project.locale, "popupNotification.title")}</div>
          <h1 style={titleStyle}>{payload.title}</h1>
        </div>
      </div>
      <div style={badgeRowStyle}>
        <span style={badgeStyle}>{t(project.locale, getTypeLabelKey(payload.type))}</span>
        <span style={badgeStyle}>{t(project.locale, getAudienceLabelKey(payload.audience))}</span>
      </div>
      {payload.date || payload.timeLabel ? <div style={metaStyle}>{payload.date}{payload.date && payload.timeLabel ? " · " : ""}{payload.timeLabel}</div> : null}
      {payload.summary ? <div style={summaryStyle}>{payload.summary}</div> : null}
      {mainDescription ? <div style={bodyStyle}>{mainDescription}</div> : null}
      {payload.link ? <a href={payload.link} target="_blank" rel="noreferrer" style={linkStyle}>{payload.link}</a> : null}
      <div style={actionsStyle}>
        <button type="button" onClick={handleClose} style={buttonStyle}>{t(project.locale, "popupNotification.close")}</button>
      </div>
    </section>
  </main>;
};

const modalShellStyle: CSSProperties = { minHeight: "100vh", background: "#030712", color: "#e5e7eb", padding: 8, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" };
const panelStyle: CSSProperties = { width: "min(100%, 500px)", maxHeight: "calc(100vh - 24px)", overflowY: "auto", background: "#111827", border: "1px solid #374151", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,.45)", padding: 14, boxSizing: "border-box" };
const headingRowStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 };
const iconStyle: CSSProperties = { width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 12, background: "#1f2937", border: "1px solid #374151", fontSize: 26, flex: "0 0 auto" };
const eyebrowStyle: CSSProperties = { color: "#93c5fd", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7 };
const titleStyle: CSSProperties = { margin: 0, fontSize: 18, lineHeight: 1.25 };
const badgeRowStyle: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 };
const badgeStyle: CSSProperties = { display: "inline-block", borderRadius: 999, padding: "2px 8px", fontSize: 11, background: "#1e3a8a", color: "#dbeafe" };
const metaStyle: CSSProperties = { color: "#cbd5e1", fontSize: 12, marginBottom: 10 };
const summaryStyle: CSSProperties = { color: "#f3f4f6", fontSize: 13, fontWeight: 700, marginBottom: 8 };
const bodyStyle: CSSProperties = { color: "#d1d5db", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.45, marginBottom: 10 };
const mutedStyle: CSSProperties = { color: "#9ca3af", fontSize: 13 };
const linkStyle: CSSProperties = { color: "#93c5fd", display: "block", fontSize: 12, overflowWrap: "anywhere", marginBottom: 12 };
const actionsStyle: CSSProperties = { display: "flex", justifyContent: "flex-end", marginTop: 14 };
const buttonStyle: CSSProperties = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "7px 10px", cursor: "pointer" };
