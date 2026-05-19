import { absoluteDayToCalendarDate, calendarDateToAbsoluteDay, getMonthById } from "../calendar/dateEngine";
import { sortEventsByDate } from "../calendar/eventsLogic";
import type { CalendarEvent, CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";

const pad2 = (value: number): string => String(value).padStart(2, "0");

const formatEventDateTime = (project: CalendarProject, event: CalendarEvent): string => {
  const month = getMonthById(project.calendarSystem, event.date.monthId);
  const internal = calendarDateToAbsoluteDay(event.date, project.calendarSystem);
  const withWeekday = absoluteDayToCalendarDate(internal, project.calendarSystem);
  const dateText = `${event.date.dayOfMonth} ${month?.name ?? event.date.monthId} ${event.date.year}`;
  const timeText = `${pad2(event.date.hour)}:${pad2(event.date.minute)}`;

  return withWeekday.weekdayName
    ? `${withWeekday.weekdayName} ${dateText}, ${timeText}`
    : `${dateText}, ${timeText}`;
};

const visibilityLabel = (project: CalendarProject, visibility: CalendarEvent["visibility"]): string => {
  if (visibility === "players") return t(project.locale, "events.visibilityPlayers");
  if (visibility === "revealOnTrigger") return t(project.locale, "events.visibilityRevealOnTrigger");
  return t(project.locale, "events.visibilityGm");
};

export const EventsView = ({ project }: { project: CalendarProject }) => {
  const events = sortEventsByDate(project.events, project);

  return (
    <>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>{t(project.locale, "events.title")}</div>

      {events.length === 0 ? (
        <div style={{ color: "#9ca3af" }}>{t(project.locale, "events.noEvents")}</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {events.map((event) => (
            <div key={event.id} style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                {event.icon ? <span aria-hidden>{event.icon}</span> : null}
                <strong>{event.name}</strong>
              </div>
              <div style={{ fontSize: 12, marginBottom: 4 }}>{formatEventDateTime(project, event)}</div>
              {event.summary ? <div style={{ fontSize: 12, marginBottom: 4, color: "#d1d5db" }}>{event.summary}</div> : null}
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                {t(project.locale, "events.visibility")}: {visibilityLabel(project, event.visibility)}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
