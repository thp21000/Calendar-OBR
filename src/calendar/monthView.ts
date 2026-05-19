import type { CalendarSystem, InternalTime } from "../domain/types";
import { absoluteDayToCalendarDate, getDaysInYear } from "./dateEngine";

export type MonthDayCell = {
  dayOfMonth: number;
  absoluteDay: number;
  isCurrentDay: boolean;
};

const sortedMonths = (system: CalendarSystem) => [...system.months].sort((a, b) => a.order - b.order);
const sortedWeekdays = (system: CalendarSystem) => [...system.weekdays].sort((a, b) => a.order - b.order);

export const getCurrentMonthDays = (currentTime: InternalTime, calendarSystem: CalendarSystem): MonthDayCell[] => {
  const months = sortedMonths(calendarSystem);
  const currentDisplay = absoluteDayToCalendarDate(currentTime, calendarSystem);

  const monthIndex = months.findIndex((month) => month.id === currentDisplay.monthId);
  if (monthIndex < 0) return [];

  const daysBeforeMonth = months.slice(0, monthIndex).reduce((sum, month) => sum + month.days, 0);
  const dayInYearIndex = daysBeforeMonth + (currentDisplay.dayOfMonth - 1);
  const yearStartAbsoluteDay = currentTime.absoluteDay - dayInYearIndex;
  const firstDayAbsolute = yearStartAbsoluteDay + daysBeforeMonth;

  return Array.from({ length: months[monthIndex].days }, (_, index) => {
    const absoluteDay = firstDayAbsolute + index;
    return {
      dayOfMonth: index + 1,
      absoluteDay,
      isCurrentDay: absoluteDay === currentTime.absoluteDay
    };
  });
};

export const getCurrentMonthFirstWeekdayIndex = (currentTime: InternalTime, calendarSystem: CalendarSystem): number => {
  const weekdays = sortedWeekdays(calendarSystem);
  if (weekdays.length === 0) return 0;

  const monthDays = getCurrentMonthDays(currentTime, calendarSystem);
  if (monthDays.length === 0) return 0;

  const firstAbsoluteDay = monthDays[0].absoluteDay;
  const firstWeekdayOffset = calendarSystem.firstWeekdayOffset ?? 0;
  return ((firstAbsoluteDay + firstWeekdayOffset) % weekdays.length + weekdays.length) % weekdays.length;
};

export const getCurrentMonthWeekdayNames = (calendarSystem: CalendarSystem): string[] =>
  sortedWeekdays(calendarSystem).map((day) => day.shortName ?? day.name);

export const getCurrentMonthMeta = (currentTime: InternalTime, calendarSystem: CalendarSystem) => {
  const current = absoluteDayToCalendarDate(currentTime, calendarSystem);
  return {
    monthName: current.monthName,
    year: current.year,
    daysInYear: getDaysInYear(calendarSystem)
  };
};
