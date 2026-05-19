import type { CalendarDate, CalendarMonth, CalendarSystem, DisplayDate, InternalTime } from "../domain/types";

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

const normalize = (value: number, modulo: number): [number, number] => {
  const quotient = Math.floor(value / modulo);
  const remainder = ((value % modulo) + modulo) % modulo;
  return [quotient, remainder];
};

const sortedMonths = (system: CalendarSystem): CalendarMonth[] =>
  [...system.months].sort((a, b) => a.order - b.order);

const sortedWeekdays = (system: CalendarSystem) => [...system.weekdays].sort((a, b) => a.order - b.order);

const unique = (values: string[]): boolean => new Set(values).size === values.length;

export const getDaysInYear = (system: CalendarSystem): number =>
  sortedMonths(system).reduce((sum, month) => sum + month.days, 0);

export const getMonthById = (system: CalendarSystem, monthId: string): CalendarMonth | undefined =>
  sortedMonths(system).find((month) => month.id === monthId);

export const assertCalendarSystem = (system: CalendarSystem): void => {
  if (system.months.length === 0) throw new Error("Calendar must define at least one month.");
  if (system.weekdays.length === 0) throw new Error("Calendar must define at least one weekday.");

  const monthIds = system.months.map((month) => month.id);
  const weekdayIds = system.weekdays.map((day) => day.id);
  if (!unique(monthIds)) throw new Error("Month ids must be unique.");
  if (!unique(weekdayIds)) throw new Error("Weekday ids must be unique.");

  const monthOrders = system.months.map((month) => month.order);
  const weekdayOrders = system.weekdays.map((weekday) => weekday.order);
  if (!unique(monthOrders.map(String))) throw new Error("Month orders must be unique.");
  if (!unique(weekdayOrders.map(String))) throw new Error("Weekday orders must be unique.");

  for (const month of system.months) {
    if (month.days < 1) throw new Error(`Month ${month.id} must have at least 1 day.`);
  }

  if ((system.firstWeekdayOffset ?? 0) < 0) {
    throw new Error("firstWeekdayOffset must be >= 0.");
  }
};

export const normalizeClock = (hour: number, minute: number): { dayDelta: number; hour: number; minute: number } => {
  const [extraHours, safeMinute] = normalize(minute, MINUTES_PER_HOUR);
  const [dayDelta, safeHour] = normalize(hour + extraHours, 24);
  return { dayDelta, hour: safeHour, minute: safeMinute };
};

export const absoluteDayToCalendarDate = (internal: InternalTime, system: CalendarSystem): DisplayDate => {
  assertCalendarSystem(system);
  const months = sortedMonths(system);
  const weekdays = sortedWeekdays(system);
  const totalDaysInYear = getDaysInYear(system);
  const yearOffset = Math.floor(internal.absoluteDay / totalDaysInYear);
  const dayOfYear = ((internal.absoluteDay % totalDaysInYear) + totalDaysInYear) % totalDaysInYear;

  let running = dayOfYear;
  const month = months.find((item) => {
    if (running < item.days) return true;
    running -= item.days;
    return false;
  });

  if (!month) throw new Error("Unable to resolve month from absolute day.");

  const firstWeekdayOffset = system.firstWeekdayOffset ?? 0;
  const weekdayIndex = ((internal.absoluteDay + firstWeekdayOffset) % weekdays.length + weekdays.length) % weekdays.length;
  const weekday = weekdays[weekdayIndex];

  return {
    year: system.startYear + yearOffset,
    monthId: month.id,
    monthName: month.name,
    dayOfMonth: running + 1,
    weekdayId: weekday.id,
    weekdayName: weekday.name,
    hour: internal.hour,
    minute: internal.minute
  };
};

export const calendarDateToAbsoluteDay = (date: CalendarDate, system: CalendarSystem): InternalTime => {
  assertCalendarSystem(system);
  const months = sortedMonths(system);
  const monthIndex = months.findIndex((month) => month.id === date.monthId);
  if (monthIndex < 0) throw new Error(`Unknown month id: ${date.monthId}`);
  const month = months[monthIndex];
  if (date.dayOfMonth < 1 || date.dayOfMonth > month.days) {
    throw new Error(`Invalid day ${date.dayOfMonth} for month ${month.id}`);
  }

  const normalized = normalizeClock(date.hour, date.minute);
  const yearOffset = date.year - system.startYear;
  const dayBeforeYear = yearOffset * getDaysInYear(system);
  const dayBeforeMonth = months.slice(0, monthIndex).reduce((sum, item) => sum + item.days, 0);

  return {
    absoluteDay: dayBeforeYear + dayBeforeMonth + (date.dayOfMonth - 1) + normalized.dayDelta,
    hour: normalized.hour,
    minute: normalized.minute
  };
};

export const addMinutes = (internal: InternalTime, minutes: number): InternalTime => {
  const currentTotal = internal.hour * MINUTES_PER_HOUR + internal.minute + minutes;
  const [dayDelta, minuteOfDay] = normalize(currentTotal, MINUTES_PER_DAY);
  const [hour, minute] = normalize(minuteOfDay, MINUTES_PER_HOUR);
  return { absoluteDay: internal.absoluteDay + dayDelta, hour, minute };
};

export const addHours = (internal: InternalTime, hours: number): InternalTime => addMinutes(internal, hours * 60);
export const addDays = (internal: InternalTime, days: number): InternalTime => ({ ...internal, absoluteDay: internal.absoluteDay + days });

export const toDisplayDate = absoluteDayToCalendarDate;
export const toInternalTime = (
  year: number,
  monthId: string,
  dayOfMonth: number,
  hour: number,
  minute: number,
  system: CalendarSystem
): InternalTime => calendarDateToAbsoluteDay({ year, monthId, dayOfMonth, hour, minute }, system);

export const shiftMinutes = addMinutes;