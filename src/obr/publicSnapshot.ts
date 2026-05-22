import { absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { getPlayerVisibleEventsForCurrentDay } from "../calendar/eventsLogic";
import { formatDisplayDate } from "../calendar/formatDisplayDate";
import { formatEventTimeShort } from "../calendar/formatEvent";
import { getPlayerVisibleMoonEvents } from "../calendar/moonEventsLogic";
import { getCurrentMoonPhases } from "../calendar/moonLogic";
import { getCurrentSeason } from "../calendar/seasonsLogic";
import { getCurrentWeather } from "../calendar/weatherLogic";
import { getWeatherUnitLabels } from "../calendar/weatherUnits";
import type { CalendarCurrentTime, CalendarProject, LocaleCode, MoonPhaseId, WeatherSnapshot } from "../domain/types";

export type PublicCalendarIndex = {
  schemaVersion: 1;
  revision: number;
  updatedAt: number;
  calendarName: string;
  locale: LocaleCode;
  currentTime: CalendarCurrentTime;
};

export type PublicCalendarEventSnapshot = {
  id: string;
  name: string;
  icon?: string;
  summary?: string;
  playerDescription?: string;
  timeLabel: string;
};

export type PublicCalendarSeasonSnapshot = {
  name: string;
  icon?: string;
};

export type PublicCalendarWeatherSnapshot = WeatherSnapshot & {
  units: {
    temperature: string;
    windSpeed: string;
    rain: string;
  };
};

export type PublicCalendarMoonSnapshot = {
  name: string;
  icon: string;
  phaseId: MoonPhaseId;
  phaseIcon: string;
  illumination: number;
};

export type PublicCalendarTodaySnapshot = {
  schemaVersion: 1;
  revision: number;
  updatedAt: number;
  calendarName: string;
  locale: LocaleCode;
  currentTime: CalendarCurrentTime;
  formattedDate: string;
  season?: PublicCalendarSeasonSnapshot;
  weather?: PublicCalendarWeatherSnapshot;
  moons: PublicCalendarMoonSnapshot[];
  eventsToday: PublicCalendarEventSnapshot[];
  moonEventsToday: Array<{
    id: string;
    name: string;
    icon?: string;
    summary?: string;
    playerDescription?: string;
    moonName: string;
    phaseId: MoonPhaseId;
  }>;
};

export const buildPublicCalendarIndex = (project: CalendarProject, revision: number): PublicCalendarIndex => ({
  schemaVersion: 1,
  revision,
  updatedAt: Date.now(),
  calendarName: project.name,
  locale: project.locale,
  currentTime: project.currentTime
});

export const createPublicCalendarTodaySnapshot = (
  project: CalendarProject,
  revision: number
): PublicCalendarTodaySnapshot => {
  const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  const currentSeason = getCurrentSeason(project);
  const currentWeather = getCurrentWeather(project);
  const weatherUnits = getWeatherUnitLabels(project.locale);

  return {
    schemaVersion: 1,
    revision,
    updatedAt: Date.now(),
    calendarName: project.name,
    locale: project.locale,
    currentTime: project.currentTime,
    formattedDate: formatDisplayDate(displayDate, project.locale),
    season: currentSeason ? { name: currentSeason.name, icon: currentSeason.icon } : undefined,
    weather: currentWeather ? { ...currentWeather, units: weatherUnits } : undefined,
    moons: getCurrentMoonPhases(project).map(({ moon, phase }) => ({
      name: moon.name,
      icon: moon.icon ?? phase.icon,
      phaseId: phase.id,
      phaseIcon: phase.icon,
      illumination: phase.illumination
    })),
    eventsToday: getPlayerVisibleEventsForCurrentDay(project).map((event) => ({
      id: event.id,
      name: event.name,
      icon: event.icon,
      summary: event.summary || undefined,
      playerDescription: event.playerDescription || undefined,
      timeLabel: formatEventTimeShort(project, event)
      })),
    moonEventsToday: getPlayerVisibleMoonEvents(project, project.currentTime.absoluteDay).map((event) => ({
      id: event.id,
      name: event.name,
      icon: event.icon,
      summary: event.summary || undefined,
      playerDescription: event.playerDescription || undefined,
      moonName: project.moons.find((moon) => moon.id === event.moonId)?.name ?? "?",
      phaseId: event.phaseId
    }))
  };
};

export const estimateJsonSize = (value: unknown): number => JSON.stringify(value).length;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isPublicCalendarIndex = (value: unknown): value is PublicCalendarIndex => {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== 1) return false;
  if (typeof value.revision !== "number") return false;
  if (typeof value.updatedAt !== "number") return false;
  if (typeof value.calendarName !== "string") return false;
  if (value.locale !== "fr" && value.locale !== "en") return false;
  if (!isRecord(value.currentTime)) return false;
  return (
    typeof value.currentTime.absoluteDay === "number" &&
    typeof value.currentTime.hour === "number" &&
    typeof value.currentTime.minute === "number"
  );
};

export const isPublicCalendarTodaySnapshot = (value: unknown): value is PublicCalendarTodaySnapshot => {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== 1) return false;
  if (typeof value.revision !== "number") return false;
  if (typeof value.updatedAt !== "number") return false;
  if (typeof value.calendarName !== "string") return false;
  if (value.locale !== "fr" && value.locale !== "en") return false;
  if (typeof value.formattedDate !== "string") return false;
  if (!Array.isArray(value.moons)) return false;
  if (!Array.isArray(value.eventsToday)) return false;
  if (!Array.isArray(value.moonEventsToday)) return false;
  return true;
};