import { absoluteDayToCalendarDate } from "./dateEngine";
import type { CalendarDate, CalendarProject, Season, SeasonWeatherProfile } from "../domain/types";

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

export const getSeasonsStartingOnDate = (project: CalendarProject, date: CalendarDate): Season[] =>
  sortSeasonsByStartDate(project, project.seasons).filter(
    (season) => season.start.monthId === date.monthId && season.start.dayOfMonth === date.dayOfMonth
  );

export const createDefaultSeason = (project: CalendarProject): Season => {
  const months = [...project.calendarSystem.months].sort((a, b) => a.order - b.order);
  const firstMonth = months[0];
  const monthId = firstMonth?.id ?? "month-1";
  const monthDays = firstMonth?.days ?? 30;
  return {
    id: `season-${Date.now()}`,
    name: project.locale === "fr" ? "Nouvelle saison" : "New season",
    icon: "🌤️",
    start: { monthId, dayOfMonth: 1 },
    end: { monthId, dayOfMonth: monthDays }
  };
};

export const createDefaultSeasonWeatherProfile = (): SeasonWeatherProfile => ({
  temperature: { min: 0, max: 20, average: 10 },
  windSpeed: { min: 0, max: 40, average: 15 },
  rain: { min: 0, max: 10, average: 2 }
});

const normalizeRange = (value: { min: number; max: number; average: number }) => {
  const min = Number.isFinite(value.min) ? value.min : 0;
  let max = Number.isFinite(value.max) ? value.max : min;
  if (min > max) max = min;
  let average = Number.isFinite(value.average) ? value.average : min;
  if (average < min) average = min;
  if (average > max) average = max;
  return { min, max, average };
};

export const normalizeSeasonWeatherProfile = (profile: SeasonWeatherProfile): SeasonWeatherProfile => ({
  temperature: normalizeRange(profile.temperature),
  windSpeed: normalizeRange(profile.windSpeed),
  rain: normalizeRange(profile.rain)
});

export const updateSeason = (project: CalendarProject, seasonId: string, patch: Partial<Season>): CalendarProject => ({
  ...project,
  seasons: project.seasons.map((season) => {
    if (season.id !== seasonId) return season;
    const next = { ...season, ...patch };
    const startMonth = project.calendarSystem.months.find((m) => m.id === next.start.monthId);
    const endMonth = project.calendarSystem.months.find((m) => m.id === next.end.monthId);
    return {
      ...next,
      weatherProfile: next.weatherProfile ? normalizeSeasonWeatherProfile(next.weatherProfile) : undefined,
      start: { ...next.start, dayOfMonth: Math.min(Math.max(1, next.start.dayOfMonth), startMonth?.days ?? 1) },
      end: { ...next.end, dayOfMonth: Math.min(Math.max(1, next.end.dayOfMonth), endMonth?.days ?? 1) }
    };
  })
});

export const deleteSeason = (project: CalendarProject, seasonId: string): CalendarProject => ({
  ...project,
  seasons: project.seasons.filter((season) => season.id !== seasonId)
});