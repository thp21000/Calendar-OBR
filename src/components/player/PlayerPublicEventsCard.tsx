import { t } from "../../i18n/messages";
import type { PublicEventDetails } from "./PublicEventDetailsPopup";

export const PlayerPublicEventsCard = ({ locale, events, onSelectEvent }: { locale: "fr" | "en"; events: PublicEventDetails[]; onSelectEvent: (event: PublicEventDetails) => void }) => (
  <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8 }}>
    <div style={{ fontWeight: 700, marginBottom: 6 }}>{t(locale, "player.eventsToday")}</div>
    {events.length === 0 ? (
      <div style={{ color: "#9ca3af", fontSize: 12 }}>{t(locale, "player.noPublicEvents")}</div>
    ) : (
      events.map((event) => (
        <button key={event.id} type="button" onClick={() => onSelectEvent(event)} style={{ width: "100%", textAlign: "left", border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#111827", cursor: "pointer", marginBottom: 4 }}>
          <strong>{event.name}</strong> {event.timeLabel}
          {event.summary ? <div style={{ marginTop: 3, fontSize: 12, color: "#d1d5db" }}>{event.summary}</div> : null}
        </button>
      ))
    )}
  </div>
);
