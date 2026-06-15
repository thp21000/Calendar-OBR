import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import { getDayNotesForDay } from "../../calendar/dayNotesLogic";
import { getEventsForDay } from "../../calendar/eventsLogic";
import { getCurrentMonthDays, getCurrentMonthFirstWeekdayIndex, getCurrentMonthWeekdayNames } from "../../calendar/monthView";
import { getMoonEventsStartingOnDay } from "../../calendar/moonEventsLogic";
import { getSeasonsStartingOnDate } from "../../calendar/seasonsLogic";
import type { CalendarDate, CalendarEvent, CalendarProject, InternalTime } from "../../domain/types";
import type React from "react";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";
import type { PublicMonthSnapshot } from "../../obr/publicSnapshot";
import type { LocaleCode } from "../../domain/types";

const FALLBACK_EVENT_ICON = "◆";

const buildDayTooltip = (dayOfMonth: number, seasonName: string | undefined, events: CalendarEvent[], moonEvents: NonNullable<CalendarProject["moonEvents"]>, hasNotes: boolean, notesLabel: string): string => {
  const parts: string[] = [String(dayOfMonth)];
  if (seasonName) parts.push(seasonName);
  if (events.length > 0) parts.push(events.map((event) => event.name).join(", "));
  if (moonEvents.length > 0) parts.push(moonEvents.map((event) => event.name).join(", "));
  if (hasNotes) parts.push(notesLabel);
  return parts.join(" — ");
};

type MonthGridCell = {
  key: string;
  label: string;
  title: string;
  isToday: boolean;
  isSelected: boolean;
  markers: Array<{ key: string; node: React.ReactNode }>;
  onClick?: () => void;
};

export const MonthGrid = ({ project, viewedTime, selectedDate, onSelectDate, mode = "gm", publicMonth, locale, selectedAbsoluteDay, onSelectPublicDay }: { project?: CalendarProject; viewedTime?: InternalTime; selectedDate?: CalendarDate | null; onSelectDate?: (date: CalendarDate) => void; mode?: "gm" | "player"; readonly?: boolean; publicMonth?: PublicMonthSnapshot; locale?: LocaleCode; selectedAbsoluteDay?: number | null; onSelectPublicDay?: (absoluteDay: number) => void; visibility?: unknown }) => {
  const publicLocale = locale ?? project?.locale ?? "en";
  let weekdays: string[] = [];
  let leading: number[] = [];
  let cells: MonthGridCell[] = [];

  if (mode === "player" && publicMonth) {
    weekdays = publicMonth.weekdays;
    leading = Array.from({ length: publicMonth.leadingEmptyDays }, (_, i) => i);
    cells = publicMonth.days.map((day) => {
      const firstPublicEvent = day.events[0] ?? day.weatherEvents[0];
      const firstMoonEvent = day.moonEvents[0];
      const hasDayNotes = day.dayNotes.length > 0;
      const markerCount = day.events.length + day.weatherEvents.length + day.moonEvents.length + (day.season ? 1 : 0) + (hasDayNotes ? 1 : 0);
      const extraMarkers = markerCount > 2 ? markerCount - 2 : 0;
      return {
        key: String(day.absoluteDay),
        label: String(day.dayOfMonth),
        title: [day.dateLabel, ...day.markers.map((marker) => marker.label)].join(" — "),
        isToday: day.isToday,
        isSelected: day.absoluteDay === selectedAbsoluteDay,
        onClick: onSelectPublicDay ? () => onSelectPublicDay(day.absoluteDay) : undefined,
        markers: [
          firstPublicEvent ? { key: "event", node: <EventIcon icon={firstPublicEvent.icon || FALLBACK_EVENT_ICON} locale={publicLocale} size={14} /> } : undefined,
          !firstPublicEvent && firstMoonEvent ? { key: "moon", node: <EventIcon icon={firstMoonEvent.icon || "🌕"} locale={publicLocale} size={14} /> } : undefined,
          day.season ? { key: "season", node: <EventIcon icon={day.season.icon ?? "🍃"} locale={publicLocale} size={14} /> } : undefined,
          hasDayNotes ? { key: "notes", node: <span style={{ fontSize: 11, lineHeight: 1 }}>📝</span> } : undefined,
          extraMarkers > 0 ? { key: "extra", node: <span style={{ fontSize: 10, lineHeight: 1, color: "#cbd5e1", opacity: 0.9 }}>+{extraMarkers}</span> } : undefined
        ].filter(Boolean) as Array<{ key: string; node: React.ReactNode }>
      };
    });
  } else if (project && viewedTime && onSelectDate) {
    const safeSelectedDate = selectedDate ?? null;
    const current = absoluteDayToCalendarDate(viewedTime, project.calendarSystem);
    weekdays = getCurrentMonthWeekdayNames(project.calendarSystem, project.uiSettings.monthGridStartsOnWeekdayId);
    const firstWeekday = getCurrentMonthFirstWeekdayIndex(viewedTime, project.calendarSystem, project.uiSettings.monthGridStartsOnWeekdayId);
    leading = Array.from({ length: firstWeekday }, (_, i) => i);
    cells = getCurrentMonthDays(viewedTime, project.calendarSystem).map((day) => {
      const date = { year: current.year, monthId: current.monthId, dayOfMonth: day.dayOfMonth, hour: 0, minute: 0 };
      const isActualCurrentDay = day.absoluteDay === project.currentTime.absoluteDay;
      const isSelectedDay = !!safeSelectedDate && safeSelectedDate.year === date.year && safeSelectedDate.monthId === date.monthId && safeSelectedDate.dayOfMonth === date.dayOfMonth;
      const events = getEventsForDay(project, date);
      const hasDayNotes = getDayNotesForDay(project, date).length > 0;
      const startingMoonEvents = getMoonEventsStartingOnDay(project, day.absoluteDay);
      const seasonsStarting = getSeasonsStartingOnDate(project, date);
      const seasonStart = seasonsStarting[0];
      const firstEvent = events[0];
      const firstMoonEvent = startingMoonEvents[0];
      const icon = firstEvent?.icon || firstMoonEvent?.icon || FALLBACK_EVENT_ICON;
      const markerCount = events.length + startingMoonEvents.length + (seasonStart ? 1 : 0) + (hasDayNotes ? 1 : 0);
      const extraMarkers = markerCount > 2 ? markerCount - 2 : 0;
      return {
        key: String(day.absoluteDay),
        label: String(day.dayOfMonth),
        title: buildDayTooltip(day.dayOfMonth, seasonStart?.name, events, startingMoonEvents, hasDayNotes, t(project.locale, "month.hasNotes")),
        isToday: isActualCurrentDay,
        isSelected: isSelectedDay,
        onClick: () => onSelectDate(date),
        markers: [
          events.length > 0 ? { key: "event", node: <EventIcon icon={icon} locale={project.locale} size={14} /> } : undefined,
          events.length === 0 && startingMoonEvents.length > 0 ? { key: "moon", node: <EventIcon icon={firstMoonEvent?.icon || "🌕"} locale={project.locale} size={14} /> } : undefined,
          seasonStart ? { key: "season", node: <EventIcon icon={seasonStart.icon} locale={project.locale} size={14} /> } : undefined,
          hasDayNotes ? { key: "notes", node: <span style={{ fontSize: 11, lineHeight: 1 }}>📝</span> } : undefined,
          extraMarkers > 0 ? { key: "extra", node: <span style={{ fontSize: 10, lineHeight: 1, color: "#cbd5e1", opacity: 0.9 }}>+{extraMarkers}</span> } : undefined
        ].filter(Boolean) as Array<{ key: string; node: React.ReactNode }>
      };
    });
  }

  if (weekdays.length === 0) return null;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${weekdays.length}, 1fr)`, gap: 4, marginBottom: 4 }}>{weekdays.map((day) => <div key={day} style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>{day}</div>)}</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${weekdays.length}, 1fr)`, gap: 4 }}>
        {leading.map((n) => <div key={`lead-${n}`} />)}
        {cells.map((cell) => {
          const isCurrentAndSelected = cell.isToday && cell.isSelected;
          const border = isCurrentAndSelected ? "2px solid #8b7cf6" : cell.isToday ? "1px solid #94a3b8" : cell.isSelected ? "1px solid #8b7cf6" : "1px solid rgba(255,255,255,0.14)";
          const background = isCurrentAndSelected ? "rgba(139,124,246,0.22)" : cell.isToday ? "rgba(148,163,184,0.18)" : cell.isSelected ? "rgba(139,124,246,0.12)" : "rgba(255,255,255,0.04)";
          return (
            <button
              key={cell.key}
              type="button"
              onClick={cell.onClick}
              title={cell.title}
              style={{ minHeight: 44, borderRadius: 8, border, background, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "4px 2px", width: "100%", cursor: cell.onClick ? "pointer" : "default", color: "#f3f4f6" }}
            >
              <span style={{ fontWeight: 700, lineHeight: 1 }}>{cell.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 2, minHeight: 16 }}>
                {cell.markers.map((marker) => <span key={marker.key} style={{ lineHeight: 1 }}>{marker.node}</span>)}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
};