import { formatEventTimeShort, formatEventVisibility } from "../../calendar/formatEvent";
import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";

export const TodayEventsCard = ({ project, eventsToday }: { project: CalendarProject; eventsToday: CalendarProject["events"] }) => (
  <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
    <div style={{ fontWeight: 700, marginBottom: 6 }}>{t(project.locale, "events.eventsToday")}</div>
    {eventsToday.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 12 }}>{t(project.locale, "events.noEventsToday")}</div> : <div style={{ display: "grid", gap: 6 }}>
      {eventsToday.map((event) => <div key={event.id} style={{ border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#111827" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
          <EventIcon icon={event.icon} locale={project.locale} />
          <strong>{event.name}</strong>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#cbd5e1" }}>{formatEventTimeShort(project, event)}</span>
        </div>
        {event.summary ? <div style={{ marginTop: 4, fontSize: 12, color: "#d1d5db" }}>{event.summary}</div> : null}
        <div style={{ marginTop: 3, fontSize: 11, color: "#9ca3af" }}>{t(project.locale, "events.visibility")}: {formatEventVisibility(project, event.visibility)}</div>
      </div>)}
    </div>}
  </div>
);
