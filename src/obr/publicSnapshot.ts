import { absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { getPlayerVisibleEventsForCurrentDay } from "../calendar/eventsLogic";
import { getPlayerVisibleDayNotesForDay } from "../calendar/dayNotesLogic";
import { formatDisplayDate } from "../calendar/formatDisplayDate";
import { formatEventTimeShort } from "../calendar/formatEvent";
import { getPlayerVisibleMoonEvents } from "../calendar/moonEventsLogic";
import { getCurrentMoonPhases } from "../calendar/moonLogic";
import { getCurrentSeason } from "../calendar/seasonsLogic";
import { getCurrentWeather, getHourlyWeatherForecast } from "../calendar/weatherLogic";
import { getCurrentWeatherBiomeDefinition } from "../calendar/weather/biomes";
import { getPlayerVisibleWeatherEvents } from "../calendar/weatherEventsLogic";
import { getWeatherUnitLabels, toDisplayRain, toDisplayTemperature, toDisplayWindSpeed } from "../calendar/weatherUnits";
import type { CalendarCurrentTime, CalendarProject, LocaleCode, MoonPhaseId, PlayerViewSettings, WeatherSnapshot, WeatherState, WindDirection } from "../domain/types";
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


export type PublicHourlyForecastSnapshot = {
  offsetHours: number;
  timeLabel: string;
  state?: WeatherState;
  stateLabel?: string;
  stateIcon?: string;
  temperature?: number;
  windSpeed?: number;
  windDirection?: WindDirection;
  rain?: number;
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
  hourlyForecast?: PublicHourlyForecastSnapshot[];
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


const publicForecastTimeLabel = (project: CalendarProject, offsetHours: number): string => {
  const totalMinutes = project.currentTime.absoluteDay * 1440 + project.currentTime.hour * 60 + project.currentTime.minute + offsetHours * 60;
  const hour = Math.floor((((totalMinutes % 1440) + 1440) % 1440) / 60);
  const minute = ((totalMinutes % 60) + 60) % 60;
  return project.uiSettings.timeFormat === "12h"
    ? new Intl.DateTimeFormat(project.locale === "fr" ? "fr-FR" : "en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(Date.UTC(2000, 0, 1, hour, minute)))
    : `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const buildPublicHourlyForecast = (project: CalendarProject, settings: PlayerViewSettings): PublicHourlyForecastSnapshot[] => {
  if (!settings.today.showHourlyForecast) return [];
  const weatherUnits = getWeatherUnitLabels(project.units);
  const rainDecimals = project.units.rain === "inch" ? 2 : 1;
  return getHourlyWeatherForecast(project, 5).map(({ offsetHours, weather }) => ({
    offsetHours,
    timeLabel: publicForecastTimeLabel(project, offsetHours),
    state: weather.state,
    temperature: roundPublicWeatherValue(toDisplayTemperature(weather.temperature, project.units.temperature), 0),
    windSpeed: roundPublicWeatherValue(toDisplayWindSpeed(weather.windSpeed, project.units.windSpeed), 0),
    windDirection: weather.windDirection,
    rain: roundPublicWeatherValue(toDisplayRain(weather.rain, project.units.rain), rainDecimals),
    units: { temperature: weatherUnits.temperature, windSpeed: weatherUnits.windSpeed, rain: weatherUnits.rain }
  }));
};

export const createPublicCalendarTodaySnapshot = (
  project: CalendarProject,
  revision: number
): PublicCalendarTodaySnapshot => {
  const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  const currentSeason = getCurrentSeason(project);
  const currentWeather = getCurrentWeather(project);
  const currentBiome = getCurrentWeatherBiomeDefinition(project);
  const playerView = normalizePlayerViewSettings(project.uiSettings.playerView);
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
    hourlyForecast: buildPublicHourlyForecast(project, playerView),
    playerView
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