import type { LocaleCode } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";

export type PublicEventDetails = {
  id: string;
  name: string;
  icon?: string;
  subtitle?: string;
  summary?: string;
  playerDescription?: string;
  timeLabel?: string;
  details?: string;
  link?: string;
};

export const PublicEventDetailsPopup = ({ locale, event, onClose }: { locale: LocaleCode; event: PublicEventDetails; onClose: () => void }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }} onClick={onClose}>
    <div style={{ width: "100%", maxWidth: 360, maxHeight: "85vh", overflow: "auto", border: "1px solid #374151", borderRadius: 10, padding: 10, background: "#111827", color: "#e5e7eb" }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong>{t(locale, "player.eventDetails")}</strong>
        <button type="button" onClick={onClose} style={{ fontSize: 11 }}>{t(locale, "month.closeDayDetails")}</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <EventIcon icon={event.icon} locale={locale} />
        <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
          <strong>{event.name}</strong>
          {event.subtitle ? <span style={{ fontSize: 12, color: "#cbd5e1" }}>{event.subtitle}</span> : null}
        </div>
        {event.timeLabel ? <span style={{ marginLeft: "auto", fontSize: 12, color: "#93c5fd" }}>{event.timeLabel}</span> : null}
      </div>
      {event.summary ? <div style={{ fontSize: 12, marginBottom: 6 }}><strong>{t(locale, "events.summary")}:</strong> {event.summary}</div> : null}
      {event.details ? <div style={{ fontSize: 12, marginBottom: 6 }}>{event.details}</div> : null}
      {event.playerDescription ? <div style={{ fontSize: 12, marginBottom: 6, whiteSpace: "pre-wrap" }}><strong>{t(locale, "events.playerDescription")}:</strong> {event.playerDescription}</div> : null}
      {event.link ? <a href={event.link} target="_blank" rel="noreferrer" style={{ color: "#93c5fd", fontSize: 12, overflowWrap: "anywhere" }}>{event.link}</a> : null}
    </div>
  </div>
);