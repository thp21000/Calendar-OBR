import { t } from "../../i18n/messages";
import type { PublicEventDetails } from "./PublicEventDetailsPopup";

export const PlayerPublicMoonEventsCard = ({ locale, events, onSelectEvent }: { locale: "fr" | "en"; events: PublicEventDetails[]; onSelectEvent: (event: PublicEventDetails) => void }) => (
  <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginTop: 10 }}>
    <div style={{ fontWeight: 700, marginBottom: 6 }}>{t(locale, "player.moonEventsToday")}</div>
    {events.length === 0 ? (
      <div style={{ color: "#9ca3af", fontSize: 12 }}>{t(locale, "player.noMoonEvents")}</div>
    ) : (
      events.map((event) => (
        <button key={event.id} type="button" onClick={() => onSelectEvent(event)} style={{ width: "100%", textAlign: "left", border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#111827", cursor: "pointer", marginBottom: 4, fontSize: 12 }}>
          {event.icon ?? "🌕"} <strong>{event.name}</strong>
          {event.subtitle ? ` · ${event.subtitle}` : ""}
          {event.summary ? ` — ${event.summary}` : ""}
        </button>
      ))
    )}
  </div>
);
