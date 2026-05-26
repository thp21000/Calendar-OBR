import { formatEventDateTime } from "../../calendar/formatEvent";
import type { CalendarEvent, CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";
import { Badge, SectionCard, SectionHeader } from "../ui";

export const TriggeredEventsCard = ({ project, lastTriggeredEvents }: { project: CalendarProject; lastTriggeredEvents: CalendarEvent[] }) => {
  if (lastTriggeredEvents.length === 0) return null;

  return (
    <SectionCard>
      <SectionHeader title={t(project.locale, "events.triggered")} subtitle={t(project.locale, "events.triggeredRecently")} />
      <div style={{ display: "grid", gap: 6 }}>
        {lastTriggeredEvents.map((event) => (
          <div key={event.id} style={{ border: "1px solid #334155", borderRadius: 6, padding: 6, background: "#1f2a40" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
              <EventIcon icon={event.icon} locale={project.locale} />
              <strong>{event.name}</strong>
              <span style={{ marginLeft: "auto" }}><Badge>{t(project.locale, "events.triggered")}</Badge></span>
            </div>
            <div style={{ marginTop: 3, fontSize: 12, color: "#cbd5e1" }}>{formatEventDateTime(project, event)}</div>
            {event.summary ? <div style={{ marginTop: 4, fontSize: 12, color: "#d1d5db" }}>{event.summary}</div> : null}
          </div>
        ))}
      </div>
    </SectionCard>
  );
};