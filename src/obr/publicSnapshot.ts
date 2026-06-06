import { absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { getPlayerVisibleEventsForCurrentDay } from "../calendar/eventsLogic";
import { getPlayerVisibleDayNotesForDay } from "../calendar/dayNotesLogic";
import { formatDisplayDate } from "../calendar/formatDisplayDate";
import { formatEventTimeShort } from "../calendar/formatEvent";
import { getPlayerVisibleMoonEvents } from "../calendar/moonEventsLogic";
import { getCurrentMoonPhases } from "../calendar/moonLogic";
import { getCurrentSeason } from "../calendar/seasonsLogic";
import { getCurrentWeather } from "../calendar/weatherLogic";
import { getCurrentWeatherBiomeDefinition } from "../calendar/weather/biomes";
import { getPlayerVisibleWeatherEvents } from "../calendar/weatherEventsLogic";
import { getWeatherUnitLabels, toDisplayRain, toDisplayTemperature, toDisplayWindSpeed } from "../calendar/weatherUnits";
import type { CalendarCurrentTime, CalendarProject, LocaleCode, MoonPhaseId, PlayerViewSettings, WeatherSnapshot } from "../domain/types";
import { t } from "../i18n/messages";
import { normalizePlayerViewSettings } from "../calendar/playerViewSettings";

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
  link?: string;
  timeLabel: string;
};

export type PublicCalendarSeasonSnapshot = {
  name: string;
  icon?: string;
};

export type PublicCalendarBiomeSnapshot = {
  name: string;
  icon: string;
  description: string;
};

export type PublicCalendarWeatherSnapshot = WeatherSnapshot & {
  units: {
    temperature: string;
    windSpeed: string;
    rain: string;
    rainTotal: string;
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
  weatherBiome: PublicCalendarBiomeSnapshot;
  moons: PublicCalendarMoonSnapshot[];
  eventsToday: PublicCalendarEventSnapshot[];
  weatherEventsToday: Array<{
    id: string;
    name: string;
    icon?: string;
    summary?: string;
    playerDescription?: string;
    link?: string;
  }>;
  moonEventsToday: Array<{
    id: string;
    name: string;
    icon?: string;
    summary?: string;
    playerDescription?: string;
    moonName: string;
    phaseId: MoonPhaseId;
  }>;
  dayNotesToday: Array<{ id: string; playerNote?: string }>;
  playerView: PlayerViewSettings;
};

export const buildPublicCalendarIndex = (project: CalendarProject, revision: number): PublicCalendarIndex => ({
  schemaVersion: 1,
  revision,
  updatedAt: Date.now(),
  calendarName: project.name,
  locale: project.locale,
  currentTime: project.currentTime
});

const roundPublicWeatherValue = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const createPublicCalendarTodaySnapshot = (
  project: CalendarProject,
  revision: number
): PublicCalendarTodaySnapshot => {
  const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  const currentSeason = getCurrentSeason(project);
  const currentWeather = getCurrentWeather(project);
  const currentBiome = getCurrentWeatherBiomeDefinition(project);
  const weatherUnits = getWeatherUnitLabels(project.units);
  const rainDecimals = project.units.rain === "inch" ? 2 : 1;
  const publicWeather = currentWeather ? {
    ...currentWeather,
    temperature: roundPublicWeatherValue(toDisplayTemperature(currentWeather.temperature, project.units.temperature), 0),
    dailyMinTemperature: currentWeather.dailyMinTemperature === undefined ? undefined : roundPublicWeatherValue(toDisplayTemperature(currentWeather.dailyMinTemperature, project.units.temperature), 0),
    dailyMaxTemperature: currentWeather.dailyMaxTemperature === undefined ? undefined : roundPublicWeatherValue(toDisplayTemperature(currentWeather.dailyMaxTemperature, project.units.temperature), 0),
    windSpeed: roundPublicWeatherValue(toDisplayWindSpeed(currentWeather.windSpeed, project.units.windSpeed), 0),
    rain: roundPublicWeatherValue(toDisplayRain(currentWeather.rain, project.units.rain), rainDecimals),
    dailyRainTotal: currentWeather.dailyRainTotal === undefined ? undefined : roundPublicWeatherValue(toDisplayRain(currentWeather.dailyRainTotal, project.units.rain), rainDecimals),
    units: weatherUnits
  } : undefined;
  const visibleWeatherEvents = currentWeather
    ? getPlayerVisibleWeatherEvents(project, currentWeather, project.currentTime)
    : [];

  return {
    schemaVersion: 1,
    revision,
    updatedAt: Date.now(),
    calendarName: project.name,
    locale: project.locale,
    currentTime: project.currentTime,
    formattedDate: formatDisplayDate(displayDate, project.locale, project.uiSettings.dateFormat, project.uiSettings.timeFormat),
    season: currentSeason ? { name: currentSeason.name, icon: currentSeason.icon } : undefined,
    weather: publicWeather,
    weatherBiome: {
      name: t(project.locale, currentBiome.nameKey),
      icon: currentBiome.icon,
      description: t(project.locale, currentBiome.descriptionKey)
    },
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
      link: event.link || undefined,
      timeLabel: formatEventTimeShort(project, event)
      })),
    weatherEventsToday: visibleWeatherEvents.map((event) => ({
      id: event.id,
      name: event.name,
      icon: event.icon,
      summary: event.summary || undefined,
      playerDescription: event.playerDescription || undefined,
      link: event.link || undefined
    })),
    moonEventsToday: getPlayerVisibleMoonEvents(project, project.currentTime.absoluteDay).map((event) => ({
      id: event.id,
      name: event.name,
      icon: event.icon,
      summary: event.summary || undefined,
      playerDescription: event.playerDescription || undefined,
      moonName: project.moons.find((moon) => moon.id === event.moonId)?.name ?? "?",
      phaseId: event.phaseId
    })),
    dayNotesToday: getPlayerVisibleDayNotesForDay(project, displayDate).map((note) => ({ id: note.id, playerNote: note.playerNote || undefined })),
    playerView: normalizePlayerViewSettings(project.uiSettings.playerView)
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
  if (!Array.isArray(value.weatherEventsToday)) return false;
  if (!Array.isArray(value.moonEventsToday)) return false;
  if (!Array.isArray(value.dayNotesToday)) return false;
  return true;
};