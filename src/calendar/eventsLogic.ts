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

const getMonthById = (project: CalendarProject, monthId: string) =>
  project.calendarSystem.months.find((month) => month.id === monthId);

const getSortedMonths = (project: CalendarProject) => [...project.calendarSystem.months].sort((a, b) => a.order - b.order);

const getMonthIndex = (project: CalendarProject, monthId: string): number =>
  getSortedMonths(project).findIndex((month) => month.id === monthId);

const toAbsoluteDayOnly = (project: CalendarProject, value: CalendarDate): number =>
  calendarDateToAbsoluteDay({ ...value, hour: 0, minute: 0 }, project.calendarSystem).absoluteDay;

const fromYearMonthDayLike = (project: CalendarProject, year: number, monthId: string, day: number, ref: CalendarDate): CalendarDate => {
  const month = getMonthById(project, monthId);
  if (!month) throw new Error(`Unknown month id: ${monthId}`);
  return { year, monthId, dayOfMonth: Math.min(day, month.days), hour: ref.hour, minute: ref.minute };
};

const getEventDurationDays = (project: CalendarProject, event: CalendarEvent): number => {
  if (!event.endDate) return 1;
  return Math.max(1, toAbsoluteDayOnly(project, event.endDate) - toAbsoluteDayOnly(project, event.date) + 1);
};

const occursOnRange = (target: number, start: number, durationDays: number): boolean =>
  target >= start && target <= start + durationDays - 1;

const eventOccursOnEveryXDays = (project: CalendarProject, event: CalendarEvent, date: CalendarDate, interval: number): boolean => {
  if (interval <= 0) return false;
  const targetDay = toAbsoluteDayOnly(project, date);
  const startDay = toAbsoluteDayOnly(project, event.date);
  if (targetDay < startDay) return false;

  const duration = getEventDurationDays(project, event);
  const delta = targetDay - startDay;
  const kMin = Math.max(0, Math.floor((delta - duration + 1 + interval - 1) / interval));
  const kMax = Math.floor(delta / interval);
  for (let k = kMin; k <= kMax; k++) {
    if (occursOnRange(targetDay, startDay + k * interval, duration)) return true;
  }
  return false;
};

const eventOccursOnEveryXMonths = (project: CalendarProject, event: CalendarEvent, date: CalendarDate, interval: number): boolean => {
  if (interval <= 0) return false;
  const startMonthIndex = getMonthIndex(project, event.date.monthId);
  const targetMonthIndex = getMonthIndex(project, date.monthId);
  if (startMonthIndex < 0 || targetMonthIndex < 0) return false;

  const monthsPerYear = getSortedMonths(project).length;
  const eventMonthSerial = event.date.year * monthsPerYear + startMonthIndex;
  const targetMonthSerial = date.year * monthsPerYear + targetMonthIndex;
  if (targetMonthSerial < eventMonthSerial) return false;

  const monthDelta = targetMonthSerial - eventMonthSerial;
  if (monthDelta % interval !== 0) return false;

  const occStart = fromYearMonthDayLike(project, date.year, date.monthId, event.date.dayOfMonth, event.date);
  const targetDay = toAbsoluteDayOnly(project, date);
  const occStartDay = toAbsoluteDayOnly(project, occStart);
  return occursOnRange(targetDay, occStartDay, getEventDurationDays(project, event));
};

const eventOccursOnYearly = (project: CalendarProject, event: CalendarEvent, date: CalendarDate, interval: number): boolean => {
  if (interval <= 0) return false;
  if (date.year < event.date.year) return false;
  if ((date.year - event.date.year) % interval !== 0) return false;
  if (!getMonthById(project, event.date.monthId)) return false;
  if (date.monthId !== event.date.monthId) return false;

  const occStart = fromYearMonthDayLike(project, date.year, event.date.monthId, event.date.dayOfMonth, event.date);
  const targetDay = toAbsoluteDayOnly(project, date);
  const occStartDay = toAbsoluteDayOnly(project, occStart);
  return occursOnRange(targetDay, occStartDay, getEventDurationDays(project, event));
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

export const updateCalendarEvent = (project: CalendarProject, eventId: string, patch: Partial<CalendarEvent>): CalendarProject => ({
  ...project,
  events: sortEventsByDate(project.events.map((event) => (event.id === eventId ? { ...event, ...patch } : event)), project)
});

export const deleteCalendarEvent = (project: CalendarProject, eventId: string): CalendarProject => ({
  ...project,
  events: project.events.filter((event) => event.id !== eventId)
});

export const eventOccursOnDay = (event: CalendarEvent, date: CalendarDate, project?: CalendarProject): boolean => {
  if (!project) {
    return event.date.year === date.year && event.date.monthId === date.monthId && event.date.dayOfMonth === date.dayOfMonth;
  }

  switch (event.recurrence.type) {
    case "none": {
      if (!event.endDate) return event.date.year === date.year && event.date.monthId === date.monthId && event.date.dayOfMonth === date.dayOfMonth;
      const targetDay = toAbsoluteDayOnly(project, date);
      const startDay = toAbsoluteDayOnly(project, event.date);
      const endDay = toAbsoluteDayOnly(project, event.endDate);
      return targetDay >= startDay && targetDay <= endDay;
    }
    case "everyXDays":
      return eventOccursOnEveryXDays(project, event, date, event.recurrence.interval);
    case "everyXMonths":
      return eventOccursOnEveryXMonths(project, event, date, event.recurrence.interval);
    case "yearly":
      return eventOccursOnYearly(project, event, date, event.recurrence.interval);
    default:
      return false;
  }
};

export const getEventsForDay = (project: CalendarProject, date: CalendarDate): CalendarEvent[] =>
  sortEventsByDate(project.events.filter((event) => eventOccursOnDay(event, date, project)), project);

export const getEventsForCurrentDay = (project: CalendarProject): CalendarEvent[] => {
  const currentDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  return getEventsForDay(project, currentDate);
};