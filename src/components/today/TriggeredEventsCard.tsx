import { formatEventDateTime } from "../../calendar/formatEvent";
import type { CalendarEvent, CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";

export const TriggeredEventsCard = ({ project, lastTriggeredEvents }: { project: CalendarProject; lastTriggeredEvents: CalendarEvent[] }) => (
  <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
    <div style={{ fontWeight: 700, marginBottom: 6 }}>{t(project.locale, "events.triggered")}</div>
    {lastTriggeredEvents.length === 0 ? (
      <div style={{ color: "#9ca3af", fontSize: 12 }}>{t(project.locale, "events.noTriggeredEvents")}</div>
    ) : (
      <>
        <div style={{ fontSize: 11, color: "#93c5fd", marginBottom: 6 }}>{t(project.locale, "events.triggeredRecently")}</div>
        <div style={{ display: "grid", gap: 6 }}>
          {lastTriggeredEvents.map((event) => (
            <div key={event.id} style={{ border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#111827" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                <EventIcon icon={event.icon} locale={project.locale} />
                <strong>{event.name}</strong>
              </div>
              <div style={{ marginTop: 3, fontSize: 12, color: "#cbd5e1" }}>{formatEventDateTime(project, event)}</div>
              {event.summary ? <div style={{ marginTop: 4, fontSize: 12, color: "#d1d5db" }}>{event.summary}</div> : null}
            </div>
          ))}
        </div>
      </>
    )}
  </div>
);
