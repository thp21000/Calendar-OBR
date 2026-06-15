import type { LocaleCode } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EmptyState, SectionCard, SectionHeader } from "../ui";
import type { PublicEventDetails } from "./PublicEventDetailsPopup";

export const PlayerPublicEventsCard = ({ locale, events, onSelectEvent, title, emptyText }: { locale: LocaleCode; events: PublicEventDetails[]; onSelectEvent: (event: PublicEventDetails) => void; title?: string; emptyText?: string }) => (
  <SectionCard>
    <SectionHeader title={title ?? t(locale, "player.publicEvents")} />
    {events.length === 0 ? (
      <EmptyState text={emptyText ?? t(locale, "player.noPublicEvents")} />
    ) : (
      <div style={{ display: "grid", gap: 6 }}>
        {events.map((event) => <PlayerPublicEventButton key={event.id} event={event} onSelectEvent={onSelectEvent} />)}
      </div>
    )}
  </SectionCard>
);

export const PlayerPublicEventButton = ({ event, onSelectEvent }: { event: PublicEventDetails; onSelectEvent: (event: PublicEventDetails) => void }) => (
  <button type="button" onClick={() => onSelectEvent(event)} style={{ width: "100%", textAlign: "left", border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827", color: "#e5e7eb", cursor: "pointer" }}>
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span style={{ width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", background: "#1f2937", flex: "0 0 auto" }}>{event.icon ?? "📌"}</span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <strong>{event.name}</strong>
          {event.timeLabel ? <span style={{ color: "#93c5fd", fontSize: 11, flex: "0 0 auto" }}>{event.timeLabel}</span> : null}
        </span>
        {event.subtitle ? <span style={{ display: "block", marginTop: 2, fontSize: 11, color: "#9ca3af" }}>{event.subtitle}</span> : null}
        {event.summary ? <span style={{ display: "block", marginTop: 4, fontSize: 12, color: "#d1d5db" }}>{event.summary}</span> : null}
      </span>
    </div>
  </button>
);