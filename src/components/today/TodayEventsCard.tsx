import { formatEventTimeShort, formatEventVisibility } from "../../calendar/formatEvent";
import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";
import { Badge, EmptyState, SectionCard, SectionHeader } from "../ui";

export const TodayEventsCard = ({ project, eventsToday, onSelectEvent }: { project: CalendarProject; eventsToday: CalendarProject["events"]; onSelectEvent?: (eventId: string) => void }) => (
  <SectionCard>
    <SectionHeader title={t(project.locale, "events.eventsToday")} />
    {eventsToday.length === 0 ? <EmptyState text={t(project.locale, "events.noEventsToday")} /> : <div style={{ display: "grid", gap: 6 }}>
      {eventsToday.map((event) => <button key={event.id} type="button" onClick={onSelectEvent ? () => onSelectEvent(event.id) : undefined} style={{ border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#111827", width: "100%", textAlign: "left", cursor: onSelectEvent ? "pointer" : "default" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
          <EventIcon icon={event.icon} locale={project.locale} />
          <strong>{event.name}</strong>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#cbd5e1" }}>{formatEventTimeShort(project, event)}</span>
        </div>
        {event.summary ? <div style={{ marginTop: 4, fontSize: 12, color: "#d1d5db" }}>{event.summary}</div> : null}
        <div style={{ marginTop: 4 }}><Badge>{t(project.locale, "events.visibility")}: {formatEventVisibility(project, event.visibility)}</Badge></div>
      </button>)}
    </div>}
  </SectionCard>
);