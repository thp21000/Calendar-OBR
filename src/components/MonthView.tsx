import { useEffect, useRef, useState } from "react";
import { absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { getDailyWeatherForecastEntries, getDayDetails } from "../calendar/dayDetails";
import { getDayNotesForDay } from "../calendar/dayNotesLogic";
import { addCalendarEvent, updateCalendarEvent } from "../calendar/eventsLogic";
import { getAdjacentMonthLabels, getMonthViewTimeForDate, getNextMonthViewTime, getPreviousMonthViewTime } from "../calendar/monthNavigation";
import type { CalendarDate, CalendarProject } from "../domain/types";
import { DayDetailsPanel } from "./month/DayDetailsPanel";
import { EventCreatePopup } from "./events/EventCreatePopup";
import { EventDetailsPopup } from "./events/EventDetailsPopup";
import { MoonEventDetailsPopup } from "./events/MoonEventDetailsPopup";
import { MonthGrid } from "./month/MonthGrid";
import { MonthLayout } from "./month/MonthLayout";
import { MonthWeatherForecastCard } from "./month/MonthWeatherForecastCard";

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
      <MonthLayout
        locale={project.locale}
        navigation={{
          currentLabel: labels.current,
          previousLabel: labels.previous,
          nextLabel: labels.next,
          showTodayButton: true,
          onPrevious: () => setViewedTime(getPreviousMonthViewTime(project, viewedTime)),
          onNext: () => setViewedTime(getNextMonthViewTime(project, viewedTime)),
          onToday: goToToday
        }}
        visibility={{
          showMonthGrid: true,
          showPublicEvents: true,
          showWeatherEvents: true,
          showMoonEvents: true,
          showDayNotes: true,
          showWeatherSummary: true,
          showFiveDayForecast: true
        }}
        actions={{
          canNavigatePreviousNext: true,
          canGoToday: true,
          canSelectDay: true,
          canCreateEvent: Boolean(onProjectUpdate),
          canEditEvent: Boolean(onProjectUpdate),
          canOpenGmDetails: true
        }}
        grid={<MonthGrid project={project} viewedTime={viewedTime} selectedDate={selectedDate} onSelectDate={setSelectedDate} />}
        forecast={<MonthWeatherForecastCard project={project} forecast={dailyWeatherForecast} />}
        selectedDay={dayDetails ? <DayDetailsPanel project={project} dayDetails={dayDetails} notes={notes} onClose={() => setSelectedDate(null)} onCreateEventForDate={setCreateEventDate} onProjectUpdate={onProjectUpdate} onOpenEvent={setSelectedEventId} onOpenMoonEvent={setSelectedMoonEventId} /> : null}
      />
      {selectedEvent ? <EventDetailsPopup project={project} event={selectedEvent} onClose={() => setSelectedEventId(null)} onUpdate={onProjectUpdate ? (updatedEvent) => onProjectUpdate(updateCalendarEvent(project, updatedEvent.id, updatedEvent)) : undefined} /> : null}
      {selectedMoonEvent ? <MoonEventDetailsPopup project={project} event={selectedMoonEvent} onClose={() => setSelectedMoonEventId(null)} contextDateLabel={selectedMoonEventDateLabel} /> : null}
      {createEventDate ? <EventCreatePopup project={project} date={createEventDate} onClose={() => setCreateEventDate(null)} onCreate={(event) => {
        if (onProjectUpdate) onProjectUpdate(addCalendarEvent(project, event));
        setCreateEventDate(null);
      }} /> : null}
    </>
  );
};