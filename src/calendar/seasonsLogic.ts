import { absoluteDayToCalendarDate } from "./dateEngine";
import type { CalendarDate, CalendarProject, Season } from "../domain/types";

const seasonDateToOrdinal = (project: CalendarProject, value: { monthId: string; dayOfMonth: number }): number => {
  const months = [...project.calendarSystem.months].sort((a, b) => a.order - b.order);
  let day = 0;
  for (const month of months) {
    if (month.id === value.monthId) return day + value.dayOfMonth;
    day += month.days;
  }
  return Number.MAX_SAFE_INTEGER;
};

const calendarDateToOrdinal = (project: CalendarProject, date: CalendarDate): number =>
  seasonDateToOrdinal(project, { monthId: date.monthId, dayOfMonth: date.dayOfMonth });

export const sortSeasonsByStartDate = (project: CalendarProject, seasons: Season[]): Season[] =>
  [...seasons].sort((a, b) => seasonDateToOrdinal(project, a.start) - seasonDateToOrdinal(project, b.start));

export const seasonContainsDate = (project: CalendarProject, season: Season, date: CalendarDate): boolean => {
  const start = seasonDateToOrdinal(project, season.start);
  const end = seasonDateToOrdinal(project, season.end);
  const target = calendarDateToOrdinal(project, date);
  if (start <= end) return target >= start && target <= end;
  return target >= start || target <= end;
};

export const getSeasonForDate = (project: CalendarProject, date: CalendarDate): Season | undefined => {
  const seasons = sortSeasonsByStartDate(project, project.seasons);
  return seasons.find((season) => seasonContainsDate(project, season, date));
};

export const getCurrentSeason = (project: CalendarProject): Season | undefined =>
  getSeasonForDate(project, absoluteDayToCalendarDate(project.currentTime, project.calendarSystem));

