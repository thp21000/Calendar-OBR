import { absoluteDayToCalendarDate, calendarDateToAbsoluteDay } from "./dateEngine";
import type { CalendarDate, CalendarEvent, CalendarProject } from "../domain/types";

export type CreateCalendarEventInput = {
  name: string;
  date: CalendarDate;
  icon?: string;
  allDay?: boolean;
  endDate?: CalendarDate;
};

const generateId = (): string => `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const isImageUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(trimmed);
};

export const isEventAllDay = (event: CalendarEvent): boolean => event.allDay === true;

export const compareCalendarDates = (a: CalendarDate, b: CalendarDate, project: CalendarProject): number => {
  const aInternal = calendarDateToAbsoluteDay(a, project.calendarSystem);
  const bInternal = calendarDateToAbsoluteDay(b, project.calendarSystem);

  if (aInternal.absoluteDay !== bInternal.absoluteDay) return aInternal.absoluteDay - bInternal.absoluteDay;
  if (aInternal.hour !== bInternal.hour) return aInternal.hour - bInternal.hour;
  return aInternal.minute - bInternal.minute;
};

export const isEventEndBeforeStart = (project: CalendarProject, startDate: CalendarDate, endDate: CalendarDate): boolean =>
  compareCalendarDates(endDate, startDate, project) < 0;

export const normalizeEventDateRange = (
  project: CalendarProject,
  startDate: CalendarDate,
  endDate?: CalendarDate
): CalendarDate | undefined => {
  if (!endDate) return undefined;
  return isEventEndBeforeStart(project, startDate, endDate) ? startDate : endDate;
};

export const createCalendarEvent = (input: CreateCalendarEventInput): CalendarEvent => ({
  id: generateId(),
  name: input.name,
  icon: input.icon,
  date: input.date,
  endDate: input.endDate,
  recurrence: { type: "none" },
  summary: "",
  visibility: "gm",
  notifyOnTrigger: true,
  deleteAfterTrigger: false,
  archiveAfterTrigger: false,
  status: "active",
  allDay: input.allDay ?? false
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