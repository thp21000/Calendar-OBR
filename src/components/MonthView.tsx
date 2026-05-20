import { absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { getEventsForDay } from "../calendar/eventsLogic";
import { getCurrentMonthDays, getCurrentMonthFirstWeekdayIndex, getCurrentMonthWeekdayNames } from "../calendar/monthView";
import { getSeasonsStartingOnDate } from "../calendar/seasonsLogic";
import type { MonthDayCell } from "../calendar/monthView";
import type { CalendarEvent, CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";
import { EventIcon } from "./EventIcon";

const FALLBACK_EVENT_ICON = "◆";

const buildDayTooltip = (dayOfMonth: number, seasonName: string | undefined, events: CalendarEvent[]): string => {
  const parts: string[] = [String(dayOfMonth)];
  if (seasonName) parts.push(seasonName);
  if (events.length > 0) parts.push(events.map((event) => event.name).join(", "));
  return parts.join(" — ");
};

export const MonthView = ({ project }: { project: CalendarProject }) => {
  const current = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  const weekdays = getCurrentMonthWeekdayNames(project.calendarSystem, project.uiSettings.monthGridStartsOnWeekdayId);
  const firstWeekday = getCurrentMonthFirstWeekdayIndex(project.currentTime, project.calendarSystem, project.uiSettings.monthGridStartsOnWeekdayId);
  const monthDays: MonthDayCell[] = getCurrentMonthDays(project.currentTime, project.calendarSystem);
  const leading = Array.from({ length: firstWeekday }, (_, i) => i);

  return (
    <>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>{project.name}</div>
      <div style={{ marginBottom: 8 }}><strong>{t(project.locale, "calendar.currentMonth")}:</strong> {current.monthName} {current.year}</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${weekdays.length}, 1fr)`, gap: 4, marginBottom: 4 }}>{weekdays.map((day) => <div key={day} style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>{day}</div>)}</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${weekdays.length}, 1fr)`, gap: 4 }}>
       {leading.map((n) => <div key={`lead-${n}`} />)}
        {monthDays.map((day: MonthDayCell) => {
          const date = { year: current.year, monthId: current.monthId, dayOfMonth: day.dayOfMonth, hour: 0, minute: 0 };
          const events = getEventsForDay(project, date);
          const seasonsStarting = getSeasonsStartingOnDate(project, date);
          const seasonStart = seasonsStarting[0];
          const hasMarkers = events.length > 0 || seasonsStarting.length > 0;
          const firstEvent = events[0];
          const icon = firstEvent?.icon || FALLBACK_EVENT_ICON;
          return (
            <div
              key={day.absoluteDay}
              title={buildDayTooltip(day.dayOfMonth, seasonStart?.name, events)}
              style={{ minHeight: 38, borderRadius: 6, border: day.isCurrentDay ? "1px solid #22c55e" : "1px solid #374151", background: day.isCurrentDay ? "#14532d" : "#1f2937", display: "flex", flexDirection: "column", justifyContent: hasMarkers ? "center" : "space-between", alignItems: "center", fontSize: 12, padding: "3px 2px" }}
            >
              {!hasMarkers ? <span>{day.dayOfMonth}</span> : null}
              <div style={{ display: "flex", alignItems: "center", gap: 2, minHeight: hasMarkers ? 16 : 0 }}>
                {events.length > 0 ? <EventIcon icon={icon} locale={project.locale} size={14} /> : null}
                {seasonStart ? <EventIcon icon={seasonStart.icon} locale={project.locale} size={14} /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
