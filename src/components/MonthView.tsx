import { absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { getEventsForDay } from "../calendar/eventsLogic";
import { getCurrentMonthDays, getCurrentMonthFirstWeekdayIndex, getCurrentMonthWeekdayNames } from "../calendar/monthView";
import type { MonthDayCell } from "../calendar/monthView";
import type { CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";

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
          const eventCount = getEventsForDay(project, { year: current.year, monthId: current.monthId, dayOfMonth: day.dayOfMonth, hour: 0, minute: 0 }).length;
          return (
            <div key={day.absoluteDay} title={day.isCurrentDay ? t(project.locale, "calendar.currentDay") : undefined} style={{ minHeight: 34, borderRadius: 6, border: day.isCurrentDay ? "1px solid #22c55e" : "1px solid #374151", background: day.isCurrentDay ? "#14532d" : "#1f2937", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1.1 }}>
                <span>{day.dayOfMonth}</span>
                {eventCount > 0 ? <span style={{ fontSize: 10, color: "#93c5fd", marginTop: 2 }} title={`${eventCount} ${t(project.locale, "events.eventCount")}`}>• {eventCount}</span> : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
