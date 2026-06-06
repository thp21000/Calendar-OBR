import { useEffect, useRef, useState } from "react";
import { absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { getDailyWeatherForecastEntries, getDayDetails } from "../calendar/dayDetails";
import { getDayNotesForDay } from "../calendar/dayNotesLogic";
import { addCalendarEvent, updateCalendarEvent } from "../calendar/eventsLogic";
import { getAdjacentMonthLabels, getMonthViewTimeForDate, getNextMonthViewTime, getPreviousMonthViewTime } from "../calendar/monthNavigation";
import type { CalendarDate, CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";
import { DayDetailsPanel } from "./month/DayDetailsPanel";
import { EventCreatePopup } from "./events/EventCreatePopup";
import { EventDetailsPopup } from "./events/EventDetailsPopup";
import { MoonEventDetailsPopup } from "./events/MoonEventDetailsPopup";
import { MonthGrid } from "./month/MonthGrid";
import { MonthWeatherForecastCard } from "./month/MonthWeatherForecastCard";
import { SecondaryButton } from "./ui";

export const MonthView = ({ project, onProjectUpdate, initialSelectedDate }: { project: CalendarProject; onProjectUpdate?: (project: CalendarProject) => void; initialSelectedDate?: CalendarDate | null }) => {
  const [viewedTime, setViewedTime] = useState(getMonthViewTimeForDate(project, absoluteDayToCalendarDate(project.currentTime, project.calendarSystem)));
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedMoonEventId, setSelectedMoonEventId] = useState<string | null>(null);
  const [createEventDate, setCreateEventDate] = useState<CalendarDate | null>(null);
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
  const dailyWeatherForecast = getDailyWeatherForecastEntries(project, 5);
  const notes = selectedDate ? getDayNotesForDay(project, selectedDate) : [];
  const labels = getAdjacentMonthLabels(project, viewedTime);
  const selectedEvent = selectedEventId ? project.events.find((event) => event.id === selectedEventId) ?? null : null;
  const selectedMoonEvent = selectedMoonEventId ? (project.moonEvents ?? []).find((event) => event.id === selectedMoonEventId) ?? null : null;
  const selectedMoonEventDateLabel = dayDetails?.formattedDate;
  const goToToday = () => {
    const todayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
    setViewedTime(getMonthViewTimeForDate(project, todayDate));
    setSelectedDate(todayDate);
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <SecondaryButton type="button" title={t(project.locale, "month.previousMonth")} onClick={() => setViewedTime(getPreviousMonthViewTime(project, viewedTime))} style={{ justifySelf: "start", padding: "6px 8px", fontSize: 12 }}>
          ‹ {labels.previous}
        </SecondaryButton>
        <div style={{ textAlign: "center", display: "grid", justifyItems: "center", gap: 4 }}>
          <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: "nowrap" }}>{labels.current}</div>
          <SecondaryButton type="button" onClick={goToToday} style={{ padding: "2px 8px", fontSize: 11, lineHeight: 1.2 }}>
            {t(project.locale, "common.today")}
          </SecondaryButton>
        </div>
        <SecondaryButton type="button" title={t(project.locale, "month.nextMonth")} onClick={() => setViewedTime(getNextMonthViewTime(project, viewedTime))} style={{ justifySelf: "end", padding: "6px 8px", fontSize: 12 }}>
          {labels.next} ›
        </SecondaryButton>
      </div>
      <MonthGrid project={project} viewedTime={viewedTime} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <MonthWeatherForecastCard project={project} forecast={dailyWeatherForecast} />
      {dayDetails ? <DayDetailsPanel project={project} dayDetails={dayDetails} notes={notes} onClose={() => setSelectedDate(null)} onCreateEventForDate={setCreateEventDate} onProjectUpdate={onProjectUpdate} onOpenEvent={setSelectedEventId} onOpenMoonEvent={setSelectedMoonEventId} /> : null}
      {selectedEvent ? <EventDetailsPopup project={project} event={selectedEvent} onClose={() => setSelectedEventId(null)} onUpdate={onProjectUpdate ? (updatedEvent) => onProjectUpdate(updateCalendarEvent(project, updatedEvent.id, updatedEvent)) : undefined} /> : null}
      {selectedMoonEvent ? <MoonEventDetailsPopup project={project} event={selectedMoonEvent} onClose={() => setSelectedMoonEventId(null)} contextDateLabel={selectedMoonEventDateLabel} /> : null}
      {createEventDate ? <EventCreatePopup project={project} date={createEventDate} onClose={() => setCreateEventDate(null)} onCreate={(event) => {
        if (onProjectUpdate) onProjectUpdate(addCalendarEvent(project, event));
        setCreateEventDate(null);
      }} /> : null}
    </>
  );
};