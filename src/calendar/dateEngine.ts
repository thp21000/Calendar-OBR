import type { CalendarSystem, DisplayDate, InternalTime } from "../domain/types";

const MINUTES_PER_DAY = 24 * 60;

const normalize = (value: number, modulo: number): [number, number] => {
  const quotient = Math.floor(value / modulo);
  const remainder = ((value % modulo) + modulo) % modulo;
  return [quotient, remainder];
};

const daysPerYear = (system: CalendarSystem): number =>
  system.months.reduce((sum, month) => sum + month.days, 0);

export const assertCalendarSystem = (system: CalendarSystem): void => {
  if (system.months.length === 0) {
    throw new Error("Calendar must define at least one month.");
  }

  if (system.weekdays.length === 0) {
    throw new Error("Calendar must define at least one weekday.");
  }

  for (const month of system.months) {
    if (month.days < 1) {
      throw new Error(`Month ${month.id} must have at least 1 day.`);
    }
  }
};

export const toDisplayDate = (
  internal: InternalTime,
  system: CalendarSystem
): DisplayDate => {
  assertCalendarSystem(system);

  const totalDaysInYear = daysPerYear(system);
  const yearOffset = Math.floor(internal.absoluteDay / totalDaysInYear);
  const dayOfYear = ((internal.absoluteDay % totalDaysInYear) + totalDaysInYear) % totalDaysInYear;

  let running = dayOfYear;
  const month = system.months.find((item) => {
    if (running < item.days) {
      return true;
    }
    running -= item.days;
    return false;
  });

  if (!month) {
    throw new Error("Unable to resolve month from absolute day.");
  }

  const weekdayIndex = ((internal.absoluteDay % system.weekdays.length) + system.weekdays.length) % system.weekdays.length;
  const weekday = system.weekdays[weekdayIndex];

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

export const toInternalTime = (
  year: number,
  monthId: string,
  dayOfMonth: number,
  hour: number,
  minute: number,
  system: CalendarSystem
): InternalTime => {
  assertCalendarSystem(system);

  const monthIndex = system.months.findIndex((month) => month.id === monthId);
  if (monthIndex < 0) {
    throw new Error(`Unknown month id: ${monthId}`);
  }

  const month = system.months[monthIndex];
  if (dayOfMonth < 1 || dayOfMonth > month.days) {
    throw new Error(`Invalid day ${dayOfMonth} for month ${month.id}`);
  }

  const yearOffset = year - system.startYear;
  const dayBeforeYear = yearOffset * daysPerYear(system);
  const dayBeforeMonth = system.months.slice(0, monthIndex).reduce((sum, item) => sum + item.days, 0);

  return {
    absoluteDay: dayBeforeYear + dayBeforeMonth + (dayOfMonth - 1),
    hour,
    minute
  };
};

export const shiftMinutes = (internal: InternalTime, deltaMinutes: number): InternalTime => {
  const currentTotal = internal.hour * 60 + internal.minute + deltaMinutes;
  const [dayDelta, minuteOfDay] = normalize(currentTotal, MINUTES_PER_DAY);
  const [hour, minute] = normalize(minuteOfDay, 60);

  return {
    absoluteDay: internal.absoluteDay + dayDelta,
    hour,
    minute
  };
};
