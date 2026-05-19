import { absoluteDayToCalendarDate, calendarDateToAbsoluteDay } from "./dateEngine";
import type { CalendarDate, CalendarEvent, CalendarProject } from "../domain/types";

export type CreateCalendarEventInput = {
  name: string;
  date: CalendarDate;
  icon?: string;
};

const generateId = (): string => `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const createCalendarEvent = (input: CreateCalendarEventInput): CalendarEvent => ({
  id: generateId(),
  name: input.name,
  icon: input.icon,
  date: input.date,
  recurrence: { type: "none" },
  summary: "",
  visibility: "gm",
  notifyOnTrigger: true,
  deleteAfterTrigger: false,
  archiveAfterTrigger: false,
  status: "active",
  allDay: false
});

const getMonthOrder = (project: CalendarProject, monthId: string): number => {
  const month = project.calendarSystem.months.find((item) => item.id === monthId);
  return month?.order ?? Number.MAX_SAFE_INTEGER;
};

export const sortEventsByDate = (events: CalendarEvent[], project: CalendarProject): CalendarEvent[] =>
  [...events].sort((a, b) => {
    if (a.date.year !== b.date.year) return a.date.year - b.date.year;

    const aMonthOrder = getMonthOrder(project, a.date.monthId);
    const bMonthOrder = getMonthOrder(project, b.date.monthId);
    if (aMonthOrder !== bMonthOrder) return aMonthOrder - bMonthOrder;

    if (a.date.dayOfMonth !== b.date.dayOfMonth) return a.date.dayOfMonth - b.date.dayOfMonth;
    if (a.date.hour !== b.date.hour) return a.date.hour - b.date.hour;
    return a.date.minute - b.date.minute;
  });

export const addCalendarEvent = (project: CalendarProject, event: CalendarEvent): CalendarProject => ({
  ...project,
  events: sortEventsByDate([...project.events, event], project)
});

export const updateCalendarEvent = (
  project: CalendarProject,
  eventId: string,
  patch: Partial<CalendarEvent>
): CalendarProject => ({
  ...project,
  events: sortEventsByDate(
    project.events.map((event) => (event.id === eventId ? { ...event, ...patch } : event)),
    project
  )
});

export const deleteCalendarEvent = (project: CalendarProject, eventId: string): CalendarProject => ({
  ...project,
  events: project.events.filter((event) => event.id !== eventId)
});

export const eventOccursOnDay = (event: CalendarEvent, date: CalendarDate): boolean => {
  if (event.recurrence.type !== "none") return false;

  return (
    event.date.year === date.year &&
    event.date.monthId === date.monthId &&
    event.date.dayOfMonth === date.dayOfMonth
  );
};

export const getEventsForDay = (project: CalendarProject, date: CalendarDate): CalendarEvent[] =>
  sortEventsByDate(project.events.filter((event) => eventOccursOnDay(event, date)), project);

export const getEventsForCurrentDay = (project: CalendarProject): CalendarEvent[] => {
  const currentDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  return getEventsForDay(project, currentDate);
};

export const toAbsoluteDayForEvent = (
  project: CalendarProject,
  event: CalendarEvent
): ReturnType<typeof calendarDateToAbsoluteDay> =>
  calendarDateToAbsoluteDay(
    {
      year: event.date.year,
      monthId: event.date.monthId,
      dayOfMonth: event.date.dayOfMonth,
      hour: event.date.hour,
      minute: event.date.minute
    },
    project.calendarSystem
  );
