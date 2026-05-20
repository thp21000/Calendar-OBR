import { absoluteDayToCalendarDate, calendarDateToAbsoluteDay, getMonthById } from "./dateEngine";
import { compareCalendarDates, isEventAllDay } from "./eventsLogic";
import type { CalendarDate, CalendarEvent, CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";

const pad2 = (value: number): string => String(value).padStart(2, "0");

const formatDateLabel = (project: CalendarProject, date: CalendarDate, withTime: boolean): string => {
  const month = getMonthById(project.calendarSystem, date.monthId);
  const internal = calendarDateToAbsoluteDay(date, project.calendarSystem);
  const withWeekday = absoluteDayToCalendarDate(internal, project.calendarSystem);
  const base = withWeekday.weekdayName
    ? `${withWeekday.weekdayName} ${date.dayOfMonth} ${month?.name ?? date.monthId} ${date.year}`
    : `${date.dayOfMonth} ${month?.name ?? date.monthId} ${date.year}`;

  return withTime ? `${base}, ${pad2(date.hour)}:${pad2(date.minute)}` : base;
};

export const formatEventVisibility = (project: CalendarProject, visibility: CalendarEvent["visibility"]): string => {
  if (visibility === "players") return t(project.locale, "events.visibilityPlayers");
  if (visibility === "revealOnTrigger") return t(project.locale, "events.visibilityRevealOnTrigger");
  return t(project.locale, "events.visibilityGm");
};

export const formatEventDateTime = (project: CalendarProject, event: CalendarEvent): string => {
  const allDay = isEventAllDay(event);
  if (!event.endDate) {
    if (allDay) return `${formatDateLabel(project, event.date, false)} — ${t(project.locale, "events.allDay")}`;
    return formatDateLabel(project, event.date, true);
  }

  const sameDay = compareCalendarDates(
    { ...event.date, hour: 0, minute: 0 },
    { ...event.endDate, hour: 0, minute: 0 },
    project
  ) === 0;

  if (allDay) {
    return `${formatDateLabel(project, event.date, false)} → ${formatDateLabel(project, event.endDate, false)} — ${t(project.locale, "events.allDay")}`;
  }

  if (sameDay) return `${formatDateLabel(project, event.date, true)} → ${pad2(event.endDate.hour)}:${pad2(event.endDate.minute)}`;

  return `${formatDateLabel(project, event.date, true)} → ${formatDateLabel(project, event.endDate, true)}`;
};

export const formatEventTimeShort = (project: CalendarProject, event: CalendarEvent): string => {
  const allDay = isEventAllDay(event);
  if (!event.endDate) return allDay ? t(project.locale, "events.allDayShort") : `${pad2(event.date.hour)}:${pad2(event.date.minute)}`;

  const sameDay = compareCalendarDates(
    { ...event.date, hour: 0, minute: 0 },
    { ...event.endDate, hour: 0, minute: 0 },
    project
  ) === 0;

  if (allDay) return t(project.locale, "events.allDayShort");
  if (sameDay) return `${pad2(event.date.hour)}:${pad2(event.date.minute)} → ${pad2(event.endDate.hour)}:${pad2(event.endDate.minute)}`;
  return `${pad2(event.date.hour)}:${pad2(event.date.minute)} → ${formatDateLabel(project, event.endDate, true)}`;
};

export const formatEventRecurrence = (project: CalendarProject, event: CalendarEvent): string => {
  const recurrence = event.recurrence;
  if (recurrence.type === "none") return t(project.locale, "events.recurrenceNone");

  const interval = "interval" in recurrence ? Math.max(1, recurrence.interval) : 1;
  if (recurrence.type === "everyXDays") {
    if (interval === 1) return project.locale === "fr" ? "Tous les jours" : "Every day";
    return t(project.locale, "events.recurrenceEveryDaysLabel").replace("{n}", String(interval));
  }
  if (recurrence.type === "everyXMonths") {
    if (interval === 1) return project.locale === "fr" ? "Tous les mois" : "Every month";
    return t(project.locale, "events.recurrenceEveryMonthsLabel").replace("{n}", String(interval));
  }
  if (interval === 1) return project.locale === "fr" ? "Tous les ans" : "Every year";
  return t(project.locale, "events.recurrenceEveryYearsLabel").replace("{n}", String(interval));
};