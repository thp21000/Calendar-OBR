import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import { getDayNotesForDay } from "../../calendar/dayNotesLogic";
import { getEventsForDay } from "../../calendar/eventsLogic";
import { getCurrentMonthDays, getCurrentMonthFirstWeekdayIndex, getCurrentMonthWeekdayNames } from "../../calendar/monthView";
import { getSeasonsStartingOnDate } from "../../calendar/seasonsLogic";
import type { CalendarDate, CalendarEvent, CalendarProject, InternalTime } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";

const FALLBACK_EVENT_ICON = "◆";

const buildDayTooltip = (dayOfMonth: number, seasonName: string | undefined, events: CalendarEvent[], hasNotes: boolean, notesLabel: string): string => {
  const parts: string[] = [String(dayOfMonth)];
  if (seasonName) parts.push(seasonName);
  if (events.length > 0) parts.push(events.map((event) => event.name).join(", "));
  if (hasNotes) parts.push(notesLabel);
  return parts.join(" — ");
};

export const MonthGrid = ({ project, viewedTime, selectedDate, onSelectDate }: { project: CalendarProject; viewedTime: InternalTime; selectedDate: CalendarDate | null; onSelectDate: (date: CalendarDate) => void }) => {
  const current = absoluteDayToCalendarDate(viewedTime, project.calendarSystem);
  const weekdays = getCurrentMonthWeekdayNames(project.calendarSystem, project.uiSettings.monthGridStartsOnWeekdayId);
  const firstWeekday = getCurrentMonthFirstWeekdayIndex(viewedTime, project.calendarSystem, project.uiSettings.monthGridStartsOnWeekdayId);
  const monthDays = getCurrentMonthDays(viewedTime, project.calendarSystem);
  const leading = Array.from({ length: firstWeekday }, (_, i) => i);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${weekdays.length}, 1fr)`, gap: 4, marginBottom: 4 }}>{weekdays.map((day) => <div key={day} style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>{day}</div>)}</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${weekdays.length}, 1fr)`, gap: 4 }}>
        {leading.map((n) => <div key={`lead-${n}`} />)}
        {monthDays.map((day) => {
          const date = { year: current.year, monthId: current.monthId, dayOfMonth: day.dayOfMonth, hour: 0, minute: 0 };
          const isActualCurrentDay = day.absoluteDay === project.currentTime.absoluteDay;
          const isSelectedDay = !!selectedDate && selectedDate.year === date.year && selectedDate.monthId === date.monthId && selectedDate.dayOfMonth === date.dayOfMonth;
          const events = getEventsForDay(project, date);
          const hasDayNotes = getDayNotesForDay(project, date).length > 0;
          const seasonsStarting = getSeasonsStartingOnDate(project, date);
          const seasonStart = seasonsStarting[0];
          const firstEvent = events[0];
          const icon = firstEvent?.icon || FALLBACK_EVENT_ICON;
          const markerCount = events.length + (seasonStart ? 1 : 0) + (hasDayNotes ? 1 : 0);
          const extraMarkers = markerCount > 2 ? markerCount - 2 : 0;
          const isCurrentAndSelected = isActualCurrentDay && isSelectedDay;
          const border = isCurrentAndSelected ? "2px solid #8b7cf6" : isActualCurrentDay ? "1px solid #94a3b8" : isSelectedDay ? "1px solid #8b7cf6" : "1px solid rgba(255,255,255,0.14)";
          const background = isCurrentAndSelected ? "rgba(139,124,246,0.22)" : isActualCurrentDay ? "rgba(148,163,184,0.18)" : isSelectedDay ? "rgba(139,124,246,0.12)" : "rgba(255,255,255,0.04)";
          return (
            <button
              key={day.absoluteDay}
              type="button"
              onClick={() => onSelectDate(date)}
              title={buildDayTooltip(day.dayOfMonth, seasonStart?.name, events, hasDayNotes, t(project.locale, "month.hasNotes"))}
              style={{ minHeight: 44, borderRadius: 8, border, background, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "4px 2px", width: "100%", cursor: "pointer", color: "#f3f4f6" }}
            >
              <span style={{ fontWeight: 700, lineHeight: 1 }}>{day.dayOfMonth}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 2, minHeight: 16 }}>
                {events.length > 0 ? <EventIcon icon={icon} locale={project.locale} size={14} /> : null}
                {seasonStart ? <EventIcon icon={seasonStart.icon} locale={project.locale} size={14} /> : null}
                {hasDayNotes ? <span style={{ fontSize: 11, lineHeight: 1 }}>📝</span> : null}
                {extraMarkers > 0 ? <span style={{ fontSize: 10, lineHeight: 1, color: "#cbd5e1", opacity: 0.9 }}>+{extraMarkers}</span> : null}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
};
