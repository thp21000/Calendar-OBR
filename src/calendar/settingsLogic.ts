import { calendarDateToAbsoluteDay } from "./dateEngine";
import type { CalendarDate, CalendarProject, CalendarSystem, InternalTime } from "../domain/types";

const sortedMonths = (system: CalendarSystem) => [...system.months].sort((a, b) => a.order - b.order);

export const clampDateParts = (date: CalendarDate, system: CalendarSystem): CalendarDate => {
  const months = sortedMonths(system);
  const month = months.find((m) => m.id === date.monthId) ?? months[0];
  const dayOfMonth = Math.max(1, Math.min(date.dayOfMonth, month.days));
  const hour = Math.max(0, Math.min(23, Math.trunc(date.hour)));
  const minute = Math.max(0, Math.min(59, Math.trunc(date.minute)));
  return { ...date, monthId: month.id, dayOfMonth, hour, minute };
};

export const updateCurrentTimeFromDate = (project: CalendarProject, date: CalendarDate): InternalTime => {
  const clamped = clampDateParts(date, project.calendarSystem);
  return calendarDateToAbsoluteDay(clamped, project.calendarSystem);
};

export const ensureValidCalendarSystem = (system: CalendarSystem): CalendarSystem => {
  const months = system.months.length > 0 ? system.months : [{ id: "month-1", name: "Month 1", order: 1, days: 30 }];
  const weekdays =
    system.weekdays.length > 0
      ? system.weekdays
      : [{ id: "day-1", name: "Day 1", shortName: "D1", order: 1 }];

  return {
    ...system,
    firstWeekdayOffset: Math.max(0, Math.trunc(system.firstWeekdayOffset ?? 0)),
    months: months.map((m, i) => ({ ...m, days: Math.max(1, Math.trunc(m.days)), order: i + 1 })),
    weekdays: weekdays.map((d, i) => ({ ...d, order: i + 1 }))
  };
};
