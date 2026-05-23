import { useEffect, useRef, useState } from "react";
import { absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { getDayDetails } from "../calendar/dayDetails";
import { getDayNotesForDay } from "../calendar/dayNotesLogic";
import { updateCalendarEvent } from "../calendar/eventsLogic";
import { getAdjacentMonthLabels, getMonthViewTimeForDate, getNextMonthViewTime, getPreviousMonthViewTime } from "../calendar/monthNavigation";
import type { CalendarDate, CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";
import { DayDetailsPanel } from "./month/DayDetailsPanel";
import { EventDetailsPopup } from "./events/EventDetailsPopup";
import { MonthGrid } from "./month/MonthGrid";

export const MonthView = ({ project, onCreateEventForDate, onProjectUpdate, initialSelectedDate }: { project: CalendarProject; onCreateEventForDate?: (date: CalendarDate) => void; onProjectUpdate?: (project: CalendarProject) => void; initialSelectedDate?: CalendarDate | null }) => {
  const [viewedTime, setViewedTime] = useState(getMonthViewTimeForDate(project, absoluteDayToCalendarDate(project.currentTime, project.calendarSystem)));
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
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
  const selectedEvent = selectedEventId ? project.events.find((event) => event.id === selectedEventId) ?? null : null;

  return (
    <>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>{project.name}</div>
      <button type="button" title={t(project.locale, "month.previousMonth")} onClick={() => setViewedTime(getPreviousMonthViewTime(project, viewedTime))} style={{ width: "100%", marginBottom: 6 }}>‹ {labels.previous}</button>
      <div style={{ marginBottom: 8, textAlign: "center" }}><strong>{labels.current}</strong></div>
      <MonthGrid project={project} viewedTime={viewedTime} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <button type="button" title={t(project.locale, "month.nextMonth")} onClick={() => setViewedTime(getNextMonthViewTime(project, viewedTime))} style={{ width: "100%", marginTop: 6 }}>
        {labels.next} ›
      </button>
      {dayDetails ? <DayDetailsPanel project={project} dayDetails={dayDetails} notes={notes} onClose={() => setSelectedDate(null)} onCreateEventForDate={onCreateEventForDate} onProjectUpdate={onProjectUpdate} onOpenEvent={setSelectedEventId} /> : null}
      {selectedEvent ? <EventDetailsPopup project={project} event={selectedEvent} onClose={() => setSelectedEventId(null)} onUpdate={onProjectUpdate ? (updatedEvent) => onProjectUpdate(updateCalendarEvent(project, updatedEvent.id, updatedEvent)) : undefined} /> : null}
    </>
  );
};