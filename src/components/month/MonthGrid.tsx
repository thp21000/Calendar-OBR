import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import { getDayNotesForDay } from "../../calendar/dayNotesLogic";
import { getEventsForDay } from "../../calendar/eventsLogic";
import { getCurrentMonthDays, getCurrentMonthFirstWeekdayIndex, getCurrentMonthWeekdayNames } from "../../calendar/monthView";
import { getSeasonsStartingOnDate } from "../../calendar/seasonsLogic";
import type { CalendarCurrentTime, CalendarDate, CalendarEvent, CalendarProject, InternalTime } from "../../domain/types";
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
          const hasMarkers = events.length > 0 || seasonsStarting.length > 0 || hasDayNotes;
          const firstEvent = events[0];
          const icon = firstEvent?.icon || FALLBACK_EVENT_ICON;
          const border = isActualCurrentDay && isSelectedDay ? "2px solid #93c5fd" : isActualCurrentDay ? "1px solid #22c55e" : isSelectedDay ? "1px solid #60a5fa" : "1px solid #374151";
          const background = isActualCurrentDay ? "#14532d" : isSelectedDay ? "#1e3a8a" : "#1f2937";
          return (
            <button
              key={day.absoluteDay}
              type="button"
              onClick={() => onSelectDate(date)}
              title={buildDayTooltip(day.dayOfMonth, seasonStart?.name, events, hasDayNotes, t(project.locale, "month.hasNotes"))}
              style={{ minHeight: 38, borderRadius: 6, border, background, display: "flex", flexDirection: "column", justifyContent: hasMarkers ? "center" : "space-between", alignItems: "center", fontSize: 12, padding: "3px 2px", width: "100%", cursor: "pointer" }}
            >
              {!hasMarkers ? <span>{day.dayOfMonth}</span> : null}
              <div style={{ display: "flex", alignItems: "center", gap: 2, minHeight: hasMarkers ? 16 : 0 }}>
                {events.length > 0 ? <EventIcon icon={icon} locale={project.locale} size={14} /> : null}
                {seasonStart ? <EventIcon icon={seasonStart.icon} locale={project.locale} size={14} /> : null}
                {hasDayNotes ? <span style={{ fontSize: 11, lineHeight: 1 }}>📝</span> : null}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
};
