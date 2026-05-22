import { useEffect, useRef, useState } from "react";
import { absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { getDayDetails } from "../calendar/dayDetails";
import { addDayNote, createDefaultDayNote, deleteDayNote, getDayNotesForDay, updateDayNote } from "../calendar/dayNotesLogic";
import { getEventsForDay } from "../calendar/eventsLogic";
import { getCurrentMonthDays, getCurrentMonthFirstWeekdayIndex, getCurrentMonthWeekdayNames } from "../calendar/monthView";
import { getAdjacentMonthLabels, getMonthViewTimeForDate, getNextMonthViewTime, getPreviousMonthViewTime } from "../calendar/monthNavigation";
import { getSeasonsStartingOnDate } from "../calendar/seasonsLogic";
import type { MonthDayCell } from "../calendar/monthView";
import type { CalendarDate, CalendarEvent, CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";
import { getWeatherStateIcon } from "../calendar/weatherState";
import { EventIcon } from "./EventIcon";

const FALLBACK_EVENT_ICON = "◆";

const buildDayTooltip = (dayOfMonth: number, seasonName: string | undefined, events: CalendarEvent[], hasNotes: boolean, notesLabel: string): string => {
  const parts: string[] = [String(dayOfMonth)];
  if (seasonName) parts.push(seasonName);
  if (events.length > 0) parts.push(events.map((event) => event.name).join(", "));
  if (hasNotes) parts.push(notesLabel);
  return parts.join(" — ");
};

export const MonthView = ({ project, onCreateEventForDate, onProjectUpdate, initialSelectedDate }: { project: CalendarProject; onCreateEventForDate?: (date: CalendarDate) => void; onProjectUpdate?: (project: CalendarProject) => void; initialSelectedDate?: CalendarDate | null }) => {
  const [viewedTime, setViewedTime] = useState(getMonthViewTimeForDate(project, absoluteDayToCalendarDate(project.currentTime, project.calendarSystem)));
  const current = absoluteDayToCalendarDate(viewedTime, project.calendarSystem);
  const weekdays = getCurrentMonthWeekdayNames(project.calendarSystem, project.uiSettings.monthGridStartsOnWeekdayId);
  const firstWeekday = getCurrentMonthFirstWeekdayIndex(viewedTime, project.calendarSystem, project.uiSettings.monthGridStartsOnWeekdayId);
  const monthDays: MonthDayCell[] = getCurrentMonthDays(viewedTime, project.calendarSystem);
  const leading = Array.from({ length: firstWeekday }, (_, i) => i);
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
  const lastInitialSelectedDateRef = useRef<string | null>(null);

  useEffect(() => {
    if (!initialSelectedDate) return;
    const key = `${initialSelectedDate.year}:${initialSelectedDate.monthId}:${initialSelectedDate.dayOfMonth}`;
    if (lastInitialSelectedDateRef.current === key) return;
    lastInitialSelectedDateRef.current = key;
    setViewedTime(getMonthViewTimeForDate(project, initialSelectedDate));
    setSelectedDate(initialSelectedDate);
  }, [initialSelectedDate]);
  const dayDetails = selectedDate ? getDayDetails(project, selectedDate) : null;
  const notes = selectedDate ? getDayNotesForDay(project, selectedDate) : [];
  const labels = getAdjacentMonthLabels(project, viewedTime);

  return (
    <>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>{project.name}</div>
      <button type="button" title={t(project.locale, "month.previousMonth")} onClick={() => setViewedTime(getPreviousMonthViewTime(project, viewedTime))} style={{ width: "100%", marginBottom: 6 }}>‹ {labels.previous}</button>
      <div style={{ marginBottom: 8, textAlign: "center" }}><strong>{labels.current}</strong></div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${weekdays.length}, 1fr)`, gap: 4, marginBottom: 4 }}>{weekdays.map((day) => <div key={day} style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>{day}</div>)}</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${weekdays.length}, 1fr)`, gap: 4 }}>
        {leading.map((n) => <div key={`lead-${n}`} />)}
        {monthDays.map((day: MonthDayCell) => {
          const date = { year: current.year, monthId: current.monthId, dayOfMonth: day.dayOfMonth, hour: 0, minute: 0 };
          const events = getEventsForDay(project, date);
          const hasDayNotes = getDayNotesForDay(project, date).length > 0;
          const seasonsStarting = getSeasonsStartingOnDate(project, date);
          const seasonStart = seasonsStarting[0];
          const hasMarkers = events.length > 0 || seasonsStarting.length > 0 || hasDayNotes;
          const firstEvent = events[0];
          const icon = firstEvent?.icon || FALLBACK_EVENT_ICON;
          return (
            <button
              key={day.absoluteDay}
              type="button"
              onClick={() => setSelectedDate(date)}
              title={buildDayTooltip(day.dayOfMonth, seasonStart?.name, events, hasDayNotes, t(project.locale, "month.hasNotes"))}
              style={{ minHeight: 38, borderRadius: 6, border: day.isCurrentDay ? "1px solid #22c55e" : "1px solid #374151", background: day.isCurrentDay ? "#14532d" : "#1f2937", display: "flex", flexDirection: "column", justifyContent: hasMarkers ? "center" : "space-between", alignItems: "center", fontSize: 12, padding: "3px 2px", width: "100%", cursor: "pointer" }}
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
      <button type="button" title={t(project.locale, "month.nextMonth")} onClick={() => setViewedTime(getNextMonthViewTime(project, viewedTime))} style={{ width: "100%", marginTop: 6 }}>
        {labels.next} ›
      </button>
      {dayDetails ? (
        <div style={{ marginTop: 10, border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <strong>{t(project.locale, "month.dayDetailsTitle")}</strong>
            <button type="button" onClick={() => setSelectedDate(null)} style={{ fontSize: 11 }}>{t(project.locale, "month.closeDayDetails")}</button>
          </div>
          <div style={{ fontSize: 12, marginBottom: 6 }}>{dayDetails.formattedDate}</div>
          <div style={{ fontSize: 12, marginBottom: 4 }}><strong>{t(project.locale, "calendar.season")}:</strong> {dayDetails.seasonName ?? t(project.locale, "calendar.noSeason")}</div>
          <div style={{ fontSize: 12, marginBottom: 4 }}><strong>{t(project.locale, "month.dayWeather")}:</strong> {dayDetails.weather ? `${getWeatherStateIcon(dayDetails.weather.state ?? "clear")} ${t(project.locale, `weather.state.${dayDetails.weather.state ?? "clear"}`)} · ${dayDetails.weather.temperature}° · ${t(project.locale, "calendar.wind")} ${dayDetails.weather.windSpeed} · ${t(project.locale, "calendar.rain")} ${dayDetails.weather.rain}` : t(project.locale, "calendar.noWeather")}</div>
          <div style={{ fontSize: 12, marginBottom: 4 }}><strong>{t(project.locale, "month.dayMoons")}:</strong> {dayDetails.moonPhases.length === 0 ? t(project.locale, "calendar.noMoon") : dayDetails.moonPhases.map((m) => `${m.phaseIcon} ${m.moonName}`).join(" · ")}</div>
          <div style={{ fontSize: 12, marginBottom: 4 }}><strong>{t(project.locale, "month.dayEvents")}:</strong></div>
          {dayDetails.events.length === 0 ? <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "month.noEventsForDay")}</div> : (
            <div style={{ display: "grid", gap: 4 }}>
              {dayDetails.events.map((event) => (
                <div key={event.id} style={{ fontSize: 12, border: "1px solid #374151", borderRadius: 6, padding: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><EventIcon icon={event.icon} locale={project.locale} size={14} /><strong>{event.name}</strong></div>
                  {event.summary ? <div style={{ color: "#cbd5e1" }}>{event.summary}</div> : null}
                </div>
              ))}
            </div>
          )}
          {onCreateEventForDate ? <button type="button" onClick={() => onCreateEventForDate(dayDetails.date)} style={{ marginTop: 8, width: "100%" }}>{t(project.locale, "month.createEventForDay")}</button> : null}
          <div style={{ fontSize: 12, marginTop: 8, marginBottom: 4 }}><strong>{t(project.locale, "dayNotes.title")}:</strong></div>
          {notes.length === 0 ? <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "dayNotes.noNotes")}</div> : notes.map((note) => (
            <div key={note.id} style={{ fontSize: 12, border: "1px solid #374151", borderRadius: 6, padding: 4, marginBottom: 4 }}>
              {note.gmNote ? <div><strong>GM:</strong> {note.gmNote}</div> : null}
              {note.playerNote ? <div><strong>Public:</strong> {note.playerNote}</div> : null}
              {onProjectUpdate ? <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <button type="button" onClick={() => { const gmNote = prompt(t(project.locale, "dayNotes.gmNote"), note.gmNote ?? "") ?? note.gmNote; const playerNote = prompt(t(project.locale, "dayNotes.playerNote"), note.playerNote ?? "") ?? note.playerNote; onProjectUpdate(updateDayNote(project, note.id, { gmNote, playerNote })); }}>{t(project.locale, "dayNotes.edit")}</button>
                <button type="button" onClick={() => { if (confirm(t(project.locale, "dayNotes.confirmDelete"))) onProjectUpdate(deleteDayNote(project, note.id)); }}>{t(project.locale, "dayNotes.delete")}</button>
              </div> : null}
            </div>
          ))}
          {onProjectUpdate ? <button type="button" style={{ marginTop: 4 }} onClick={() => {
            const base = createDefaultDayNote(project, dayDetails.date);
            const gmNote = prompt(t(project.locale, "dayNotes.gmNote"), "") ?? "";
            const playerNote = prompt(t(project.locale, "dayNotes.playerNote"), "") ?? "";
            onProjectUpdate(addDayNote(project, { ...base, gmNote, playerNote, visibility: playerNote ? "players" : "gm" }));
          }}>{t(project.locale, "dayNotes.add")}</button> : null}
        </div>
      ) : null}
    </>
  );
};