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

const getEventTriggerStartDate = (event: CalendarEvent): CalendarDate => ({
  ...event.date,
  hour: event.allDay ? 0 : event.date.hour,
  minute: event.allDay ? 0 : event.date.minute
});

const getEventCompletionDate = (project: CalendarProject, startDate: CalendarDate, event: CalendarEvent): CalendarDate => {
  if (event.endDate) {
    if (!event.allDay) return event.endDate;
    const endDayInternal = calendarDateToAbsoluteDay({ ...event.endDate, hour: 0, minute: 0 }, project.calendarSystem);
    return absoluteDayToCalendarDate({ absoluteDay: endDayInternal.absoluteDay + 1, hour: 0, minute: 0 }, project.calendarSystem);
  }
  if (!event.allDay) return startDate;
  const startInternal = calendarDateToAbsoluteDay({ ...startDate, hour: 0, minute: 0 }, project.calendarSystem);
  return absoluteDayToCalendarDate({ absoluteDay: startInternal.absoluteDay + 1, hour: 0, minute: 0 }, project.calendarSystem);
};

const isEventVisibleInActiveViews = (event: CalendarEvent): boolean =>
  event.status !== "archived" && event.status !== "disabled";

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
  sortEventsByDate(project.events.filter((event) => isEventVisibleInActiveViews(event) && eventOccursOnDay(event, date, project)), project);

export const getEventsForCurrentDay = (project: CalendarProject): CalendarEvent[] => {
  const currentDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  return getEventsForDay(project, currentDate);
};

export const getEventTimeBucket = (
  project: CalendarProject,
  event: CalendarEvent
): "past" | "today" | "future" => {
  const currentDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  if (eventOccursOnDay(event, currentDate, project)) return "today";

  if (event.recurrence.type !== "none") {
    return event.status === "active" ? "future" : "past";
  }

  const eventStartDay = toAbsoluteDayOnly(project, event.date);
  const eventEndDay = event.endDate ? toAbsoluteDayOnly(project, event.endDate) : eventStartDay;
  const currentDay = project.currentTime.absoluteDay;

  if (eventEndDay < currentDay) return "past";
  if (eventStartDay > currentDay) return "future";
  return "today";
};

const toAbsoluteMinute = (project: CalendarProject, date: CalendarDate): number => {
  const internal = calendarDateToAbsoluteDay(date, project.calendarSystem);
  return internal.absoluteDay * 1440 + internal.hour * 60 + internal.minute;
};

const internalToAbsoluteMinute = (time: { absoluteDay: number; hour: number; minute: number }): number =>
  time.absoluteDay * 1440 + time.hour * 60 + time.minute;

const isEventTriggerable = (event: CalendarEvent): boolean =>
  event.notifyOnTrigger === true && event.status !== "archived" && event.status !== "disabled";

const eventStartsBetween = (startMinute: number, fromMinute: number, toMinute: number): boolean =>
  startMinute > fromMinute && startMinute <= toMinute;

const getRecurringOccurrenceStartsBetween = (
  project: CalendarProject,
  event: CalendarEvent,
  fromMinute: number,
  toMinute: number
): number[] => {
  const starts: number[] = [];
  const startInternal = calendarDateToAbsoluteDay(getEventTriggerStartDate(event), project.calendarSystem);
  const baseStartMinute = internalToAbsoluteMinute(startInternal);

  if (event.recurrence.type === "everyXDays") {
    const interval = event.recurrence.interval;
    if (interval <= 0) return starts;
    const stepMinutes = interval * 1440;
    let k = Math.max(0, Math.floor((fromMinute - baseStartMinute) / stepMinutes));
    while (baseStartMinute + k * stepMinutes <= toMinute) {
      const occ = baseStartMinute + k * stepMinutes;
      if (eventStartsBetween(occ, fromMinute, toMinute)) starts.push(occ);
      k += 1;
    }
    return starts;
  }

  const months = [...project.calendarSystem.months].sort((a, b) => a.order - b.order);
  const monthCount = months.length;
  const baseMonthIndex = months.findIndex((m) => m.id === event.date.monthId);
  if (baseMonthIndex < 0) return starts;

  const buildOccurrenceDate = (year: number, monthIndex: number): CalendarDate | null => {
    const month = months[monthIndex];
    if (!month) return null;
    const day = Math.min(event.date.dayOfMonth, month.days);
    const triggerStart = getEventTriggerStartDate(event);
    return { year, monthId: month.id, dayOfMonth: day, hour: triggerStart.hour, minute: triggerStart.minute };
  };

  if (event.recurrence.type === "everyXMonths") {
    const interval = event.recurrence.interval;
    if (interval <= 0) return starts;
    const stepMonths = interval;
    const baseSerial = event.date.year * monthCount + baseMonthIndex;
    let k = Math.max(0, Math.floor(((fromMinute - baseStartMinute) / 1440) / 28));
    // reset with exact month serial progression to avoid missing first match
    let serial = baseSerial + k * stepMonths;
    while (true) {
      const year = Math.floor(serial / monthCount);
      const monthIndex = ((serial % monthCount) + monthCount) % monthCount;
      const occDate = buildOccurrenceDate(year, monthIndex);
      if (!occDate) break;
      const occMinute = toAbsoluteMinute(project, occDate);
      if (occMinute > toMinute) break;
      if (eventStartsBetween(occMinute, fromMinute, toMinute)) starts.push(occMinute);
      serial += stepMonths;
    }
    return starts;
  }

  if (event.recurrence.type === "yearly") {
    const interval = event.recurrence.interval;
    if (interval <= 0) return starts;
    const stepYears = interval;
    let year = event.date.year + Math.max(0, Math.floor((fromMinute - baseStartMinute) / (1440 * 300))) * stepYears;
    while (true) {
      const occDate = buildOccurrenceDate(year, baseMonthIndex);
      if (!occDate) break;
      const occMinute = toAbsoluteMinute(project, occDate);
      if (occMinute > toMinute) break;
      if (eventStartsBetween(occMinute, fromMinute, toMinute)) starts.push(occMinute);
      year += stepYears;
    }
  }

  return starts;
};

const getRecurringOccurrenceStartsUpTo = (
  project: CalendarProject,
  event: CalendarEvent,
  toMinute: number
): number[] => {
  const startInternal = calendarDateToAbsoluteDay(getEventTriggerStartDate(event), project.calendarSystem);
  const baseStartMinute = internalToAbsoluteMinute(startInternal);
  if (toMinute < baseStartMinute) return [];

  return getRecurringOccurrenceStartsBetween(project, event, baseStartMinute - 1, toMinute);
};

const toInternalTime = (absoluteMinute: number): { absoluteDay: number; hour: number; minute: number } => ({
  absoluteDay: Math.floor(absoluteMinute / 1440),
  hour: Math.floor((absoluteMinute % 1440) / 60),
  minute: absoluteMinute % 60
});

const getOccurrenceCompletionMinute = (project: CalendarProject, event: CalendarEvent, occurrenceStartMinute: number): number => {
  if (event.recurrence.type === "none") {
    const completion = getEventCompletionDate(project, absoluteDayToCalendarDate(toInternalTime(occurrenceStartMinute), project.calendarSystem), event);
    return toAbsoluteMinute(project, completion);
  }

  const baseStartMinute = toAbsoluteMinute(project, getEventTriggerStartDate(event));
  if (event.allDay) {
    const completionDays = event.endDate
      ? Math.max(1, toAbsoluteDayOnly(project, event.endDate) - toAbsoluteDayOnly(project, event.date) + 1)
      : 1;
    return occurrenceStartMinute + completionDays * 1440;
  }
  const baseCompletionMinute = event.endDate ? toAbsoluteMinute(project, event.endDate) : baseStartMinute;
  const durationMinutes = Math.max(0, baseCompletionMinute - baseStartMinute);
  return occurrenceStartMinute + durationMinutes;
};

export const getTriggeredEventsBetween = (
  project: CalendarProject,
  fromTime: { absoluteDay: number; hour: number; minute: number },
  toTime: { absoluteDay: number; hour: number; minute: number }
): CalendarEvent[] => {
  const fromMinute = internalToAbsoluteMinute(fromTime);
  const toMinute = internalToAbsoluteMinute(toTime);
  if (toMinute <= fromMinute) return [];

  return project.events.filter((event) => {
    if (!isEventTriggerable(event)) return false;

    if (event.recurrence.type === "none") {
      const startMinute = toAbsoluteMinute(project, getEventTriggerStartDate(event));
      return eventStartsBetween(startMinute, fromMinute, toMinute);
    }

    const occurrences = getRecurringOccurrenceStartsBetween(project, event, fromMinute, toMinute);
    return occurrences.length > 0;
  });
};

export const getCompletedEventsBetween = (
  project: CalendarProject,
  fromTime: { absoluteDay: number; hour: number; minute: number },
  toTime: { absoluteDay: number; hour: number; minute: number }
): CalendarEvent[] => {
  const fromMinute = internalToAbsoluteMinute(fromTime);
  const toMinute = internalToAbsoluteMinute(toTime);
  if (toMinute <= fromMinute) return [];

  return project.events.filter((event) => {
    if (event.status === "archived" || event.status === "disabled") return false;

    if (event.recurrence.type === "none") {
      const completionMinute = toAbsoluteMinute(project, getEventCompletionDate(project, getEventTriggerStartDate(event), event));
      return completionMinute > fromMinute && completionMinute <= toMinute;
    }

    const occurrenceStarts = getRecurringOccurrenceStartsUpTo(project, event, toMinute);
    for (const occurrenceStartMinute of occurrenceStarts) {
      const completionMinute = getOccurrenceCompletionMinute(project, event, occurrenceStartMinute);
      if (completionMinute > fromMinute && completionMinute <= toMinute) return true;
    }
    return false;
  });
};

export const applyEventCompletionActions = (project: CalendarProject, completedEvents: CalendarEvent[]): CalendarProject => {
  if (completedEvents.length === 0) return project;
  const completedIds = new Set(completedEvents.map((event) => event.id));

  const nextEvents = project.events
    .filter((event) => !(completedIds.has(event.id) && event.deleteAfterTrigger))
    .map((event) => {
      if (!completedIds.has(event.id)) return event;
      if (event.deleteAfterTrigger) return event;
      if (event.archiveAfterTrigger) return { ...event, status: "archived" as const };
      if (event.recurrence.type === "none") return { ...event, status: "triggered" as const };
      return event;
    });

  return { ...project, events: nextEvents };
};