import { absoluteDayToCalendarDate, calendarDateToAbsoluteDay } from "./dateEngine";
import type { CalendarDate, CalendarProject, InternalTime } from "../domain/types";

const sortedMonths = (project: CalendarProject) => [...project.calendarSystem.months].sort((a, b) => a.order - b.order);

const toMonthStartTime = (project: CalendarProject, year: number, monthId: string): InternalTime =>
  calendarDateToAbsoluteDay({ year, monthId, dayOfMonth: 1, hour: 0, minute: 0 }, project.calendarSystem);

export const getMonthViewTimeForDate = (project: CalendarProject, date: CalendarDate): InternalTime =>
  toMonthStartTime(project, date.year, date.monthId);

export const getPreviousMonthViewTime = (project: CalendarProject, viewedTime: InternalTime): InternalTime => {
  const current = absoluteDayToCalendarDate(viewedTime, project.calendarSystem);
  const months = sortedMonths(project);
  const idx = months.findIndex((m) => m.id === current.monthId);
  if (idx <= 0) return toMonthStartTime(project, current.year - 1, months[months.length - 1].id);
  return toMonthStartTime(project, current.year, months[idx - 1].id);
};

export const getNextMonthViewTime = (project: CalendarProject, viewedTime: InternalTime): InternalTime => {
  const current = absoluteDayToCalendarDate(viewedTime, project.calendarSystem);
  const months = sortedMonths(project);
  const idx = months.findIndex((m) => m.id === current.monthId);
  if (idx < 0 || idx >= months.length - 1) return toMonthStartTime(project, current.year + 1, months[0].id);
  return toMonthStartTime(project, current.year, months[idx + 1].id);
};

export const getAdjacentMonthLabels = (project: CalendarProject, viewedTime: InternalTime): { previous: string; current: string; next: string } => {
  const prev = absoluteDayToCalendarDate(getPreviousMonthViewTime(project, viewedTime), project.calendarSystem);
  const cur = absoluteDayToCalendarDate(viewedTime, project.calendarSystem);
  const next = absoluteDayToCalendarDate(getNextMonthViewTime(project, viewedTime), project.calendarSystem);
  return {
    previous: `${prev.monthName} ${prev.year}`,
    current: `${cur.monthName} ${cur.year}`,
    next: `${next.monthName} ${next.year}`
  };
};
