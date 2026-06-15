import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import { getPlayerVisibleDayNotesForDay } from "../../calendar/dayNotesLogic";
import { getPlayerVisibleEventsForCurrentDay } from "../../calendar/eventsLogic";
import { formatDisplayDate } from "../../calendar/formatDisplayDate";
import { formatEventTimeShort } from "../../calendar/formatEvent";
import { getCurrentMoonPhases } from "../../calendar/moonLogic";
import { getPlayerVisibleMoonEvents } from "../../calendar/moonEventsLogic";
import { normalizePlayerViewSettings } from "../../calendar/playerViewSettings";
import { getCurrentSeason } from "../../calendar/seasonsLogic";
import { getConfiguredWeatherStateIcon, getWeatherStateLabel, getWeatherTrendLabel } from "../../calendar/weatherAdvancedSettings";
import { getCurrentWeatherBiomeDefinition } from "../../calendar/weather/biomes";
import { getPlayerVisibleWeatherEvents } from "../../calendar/weatherEventsLogic";
import { getCurrentWeather, getHourlyWeatherForecast } from "../../calendar/weatherLogic";
import { formatRain, formatRainTotal, formatTemperature, formatWindSpeed } from "../../calendar/weatherUnits";
import type { CalendarProject, LocaleCode, PlayerForecastDetailLevel, PlayerViewSettings, PlayerWeatherDetailLevel, WeatherSnapshot, WindDirection } from "../../domain/types";
import type { PublicCalendarTodaySnapshot, PublicHourlyForecastSnapshot } from "../../obr/publicSnapshot";
import { t } from "../../i18n/messages";
import type { PublicEventDetails } from "./PublicEventDetailsPopup";

export type PlayerWeatherViewModel = {
  stateIcon: string;
  stateLabel: string;
  detailLevel: PlayerWeatherDetailLevel;
  temperature?: string;
  wind?: string;
  rain?: string;
  dailyMinMax?: string;
  dailyRainTotal?: string;
  trend?: string;
  dominantState?: string;
  broadTemperature?: string;
  broadWind?: string;
  broadRain?: string;
  narrativeLabel?: string;
};

export type PlayerHourlyForecastEntry = {
  offsetHours: number;
  timeLabel: string;
  stateIcon: string;
  stateLabel: string;
  detailLevel: PlayerForecastDetailLevel;
  temperature?: string;
  wind?: string;
  rain?: string;
  broadTemperature?: string;
  broadWind?: string;
  broadRain?: string;
};

export type PlayerViewModel = {
  locale: LocaleCode;
  calendarName: string;
  formattedDate: string;
  season?: { name: string; icon?: string };
  biome?: { name: string; icon: string; description: string };
  weather?: PlayerWeatherViewModel;
  hourlyForecast: PlayerHourlyForecastEntry[];
  moons: Array<{ id: string; icon: string; name: string; phaseLabel: string }>;
  events: PublicEventDetails[];
  weatherEvents: PublicEventDetails[];
  moonEvents: PublicEventDetails[];
  dayNotes: Array<{ id: string; playerNote: string }>;
};

const compactPublicEvents = (events: PublicEventDetails[]): PublicEventDetails[] =>
  events.map((event) => ({
    id: event.id,
    name: event.name,
    icon: event.icon,
    subtitle: event.subtitle,
    summary: event.summary || undefined,
    playerDescription: event.playerDescription || undefined,
    timeLabel: event.timeLabel,
    link: event.link
  }));

const temperatureBroadKey = (valueCelsius: number): string => {
  if (valueCelsius < 0) return "player.weatherBroad.cold";
  if (valueCelsius < 10) return "player.weatherBroad.cool";
  if (valueCelsius < 22) return "player.weatherBroad.mild";
  if (valueCelsius < 32) return "player.weatherBroad.warm";
  return "player.weatherBroad.hot";
};

const windBroadKey = (valueKmh: number): string => {
  if (valueKmh < 5) return "player.weatherBroad.windCalm";
  if (valueKmh < 20) return "player.weatherBroad.windLight";
  if (valueKmh < 40) return "player.weatherBroad.windModerate";
  if (valueKmh < 70) return "player.weatherBroad.windStrong";
  return "player.weatherBroad.windViolent";
};

const rainBroadKey = (valueMm: number): string => {
  if (valueMm <= 0.05) return "player.weatherBroad.rainDry";
  if (valueMm < 1) return "player.weatherBroad.rainDrizzle";
  if (valueMm < 5) return "player.weatherBroad.rainLight";
  return "player.weatherBroad.rainHeavy";
};

const displayTemperatureToCelsius = (value: number, unitLabel: string): number => unitLabel === "°F" ? (value - 32) * 5 / 9 : value;
const displayWindToKmh = (value: number, unitLabel: string): number => unitLabel === "mph" ? value / 0.621371 : value;
const displayRainToMm = (value: number, unitLabel: string): number => unitLabel.startsWith("in") ? value * 25.4 : value;

const buildBroadLabels = (locale: LocaleCode, weather: Pick<WeatherSnapshot, "temperature" | "windSpeed" | "rain">) => ({
  broadTemperature: t(locale, temperatureBroadKey(weather.temperature)),
  broadWind: t(locale, windBroadKey(weather.windSpeed)),
  broadRain: t(locale, rainBroadKey(weather.rain))
});

const buildWeatherViewModel = (
  project: CalendarProject,
  weather: WeatherSnapshot,
  detailLevel: PlayerWeatherDetailLevel
): PlayerWeatherViewModel => {
  const state = weather.state ?? "clear";
  const broad = buildBroadLabels(project.locale, weather);
  const effectiveDetailLevel = detailLevel === "narrative" ? "broad" : detailLevel;
  return {
    stateIcon: getConfiguredWeatherStateIcon(project, state),
    stateLabel: getWeatherStateLabel(project, state, project.locale),
    detailLevel: effectiveDetailLevel,
    ...(effectiveDetailLevel === "precise" ? {
      temperature: formatTemperature(weather.temperature, project.units, project.locale),
      wind: `${weather.windDirection} · ${formatWindSpeed(weather.windSpeed, project.units, project.locale)}`,
      rain: formatRain(weather.rain, project.units, project.locale),
      dailyMinMax: weather.dailyMinTemperature !== undefined && weather.dailyMaxTemperature !== undefined
        ? `${formatTemperature(weather.dailyMinTemperature, project.units, project.locale)} / ${formatTemperature(weather.dailyMaxTemperature, project.units, project.locale)}`
        : undefined,
      dailyRainTotal: weather.dailyRainTotal !== undefined ? formatRainTotal(weather.dailyRainTotal, project.units, project.locale) : undefined,
      trend: weather.trendKind ? getWeatherTrendLabel(project, weather.trendKind, project.locale) : undefined,
      dominantState: weather.dominantState
        ? `${getConfiguredWeatherStateIcon(project, weather.dominantState)} ${getWeatherStateLabel(project, weather.dominantState, project.locale)}`
        : undefined
    } : {
      ...broad,
      // TODO: replace broad fallback with richer narrative text.
      narrativeLabel: detailLevel === "narrative" ? `${broad.broadTemperature} · ${broad.broadWind} · ${broad.broadRain}` : undefined
    })
  };
};

const buildWeatherViewModelFromSnapshot = (
  project: CalendarProject,
  snapshot: PublicCalendarTodaySnapshot,
  detailLevel: PlayerWeatherDetailLevel
): PlayerWeatherViewModel | undefined => {
  if (!snapshot.weather) return undefined;
  const state = snapshot.weather.state ?? "clear";
  const broad = buildBroadLabels(snapshot.locale, {
    temperature: displayTemperatureToCelsius(snapshot.weather.temperature, snapshot.weather.units.temperature),
    windSpeed: displayWindToKmh(snapshot.weather.windSpeed, snapshot.weather.units.windSpeed),
    rain: displayRainToMm(snapshot.weather.rain, snapshot.weather.units.rain)
  });
  const effectiveDetailLevel = detailLevel === "narrative" ? "broad" : detailLevel;
  return {
    stateIcon: getConfiguredWeatherStateIcon(project, state),
    stateLabel: getWeatherStateLabel(project, state, snapshot.locale),
    detailLevel: effectiveDetailLevel,
    ...(effectiveDetailLevel === "precise" ? {
      temperature: `${snapshot.weather.temperature} ${snapshot.weather.units.temperature}`,
      wind: `${snapshot.weather.windDirection} · ${snapshot.weather.windSpeed} ${snapshot.weather.units.windSpeed}`,
      rain: `${snapshot.weather.rain} ${snapshot.weather.units.rain}`,
      dailyMinMax: snapshot.weather.dailyMinTemperature !== undefined && snapshot.weather.dailyMaxTemperature !== undefined
        ? `${snapshot.weather.dailyMinTemperature} / ${snapshot.weather.dailyMaxTemperature} ${snapshot.weather.units.temperature}`
        : undefined,
      dailyRainTotal: snapshot.weather.dailyRainTotal !== undefined ? `${snapshot.weather.dailyRainTotal} ${snapshot.weather.units.rainTotal}` : undefined,
      trend: snapshot.weather.trendKind ? getWeatherTrendLabel(project, snapshot.weather.trendKind, snapshot.locale) : undefined,
      dominantState: snapshot.weather.dominantState
        ? `${getConfiguredWeatherStateIcon(project, snapshot.weather.dominantState)} ${getWeatherStateLabel(project, snapshot.weather.dominantState, snapshot.locale)}`
        : undefined
    } : {
      ...broad,
      // TODO: replace broad fallback with richer narrative text.
      narrativeLabel: detailLevel === "narrative" ? `${broad.broadTemperature} · ${broad.broadWind} · ${broad.broadRain}` : undefined
    })
  };
};

const forecastTimeLabel = (project: CalendarProject, offsetHours: number): string => {
  const totalMinutes = project.currentTime.absoluteDay * 1440 + project.currentTime.hour * 60 + project.currentTime.minute + offsetHours * 60;
  const hour = Math.floor(((totalMinutes % 1440) + 1440) % 1440 / 60);
  const minute = ((totalMinutes % 60) + 60) % 60;
  return project.uiSettings.timeFormat === "12h"
    ? new Intl.DateTimeFormat(project.locale === "fr" ? "fr-FR" : "en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(Date.UTC(2000, 0, 1, hour, minute)))
    : `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const buildHourlyForecastEntry = (
  project: CalendarProject,
  offsetHours: number,
  weather: WeatherSnapshot,
  detailLevel: PlayerForecastDetailLevel
): PlayerHourlyForecastEntry => {
  const state = weather.state ?? "clear";
  const effectiveDetailLevel = detailLevel === "narrative" ? "broad" : detailLevel;
  return {
    offsetHours,
    timeLabel: forecastTimeLabel(project, offsetHours),
    stateIcon: getConfiguredWeatherStateIcon(project, state),
    stateLabel: getWeatherStateLabel(project, state, project.locale),
    detailLevel: effectiveDetailLevel,
    ...(effectiveDetailLevel === "precise" ? {
      temperature: formatTemperature(weather.temperature, project.units, project.locale),
      wind: `${weather.windDirection} · ${formatWindSpeed(weather.windSpeed, project.units, project.locale)}`,
      rain: formatRain(weather.rain, project.units, project.locale)
    } : buildBroadLabels(project.locale, weather))
  };
};

const buildHourlyForecastEntryFromSnapshot = (
  project: CalendarProject,
  entry: PublicHourlyForecastSnapshot,
  detailLevel: PlayerForecastDetailLevel,
  locale: LocaleCode
): PlayerHourlyForecastEntry => {
  const state = entry.state ?? "clear";
  const effectiveDetailLevel = detailLevel === "narrative" ? "broad" : detailLevel;
  return {
    offsetHours: entry.offsetHours,
    timeLabel: entry.timeLabel,
    stateIcon: entry.stateIcon ?? getConfiguredWeatherStateIcon(project, state),
    stateLabel: entry.stateLabel ?? getWeatherStateLabel(project, state, locale),
    detailLevel: effectiveDetailLevel,
    ...(effectiveDetailLevel === "precise" ? {
      temperature: entry.temperature === undefined ? undefined : `${entry.temperature} ${entry.units.temperature}`,
      wind: entry.windSpeed === undefined ? undefined : `${entry.windDirection ? `${entry.windDirection} · ` : ""}${entry.windSpeed} ${entry.units.windSpeed}`,
      rain: entry.rain === undefined ? undefined : `${entry.rain} ${entry.units.rain}`
    } : buildBroadLabels(locale, {
      temperature: entry.temperature === undefined ? 0 : displayTemperatureToCelsius(entry.temperature, entry.units.temperature),
      windSpeed: entry.windSpeed === undefined ? 0 : displayWindToKmh(entry.windSpeed, entry.units.windSpeed),
      rain: entry.rain === undefined ? 0 : displayRainToMm(entry.rain, entry.units.rain)
    }))
  };
};

export const buildPlayerViewModelFromSnapshot = (
  project: CalendarProject,
  snapshot: PublicCalendarTodaySnapshot,
  rawSettings?: PlayerViewSettings
): PlayerViewModel => {
  const settings = normalizePlayerViewSettings(rawSettings ?? snapshot.playerView);
  return {
    locale: snapshot.locale,
    calendarName: snapshot.calendarName,
    formattedDate: snapshot.formattedDate,
    season: settings.today.showSeason ? snapshot.season : undefined,
    biome: settings.today.showBiome ? snapshot.weatherBiome : undefined,
    weather: settings.today.showWeather ? buildWeatherViewModelFromSnapshot(project, snapshot, settings.today.weatherDetailLevel) : undefined,
    hourlyForecast: settings.today.showHourlyForecast
      ? (snapshot.hourlyForecast ?? []).map((entry) => buildHourlyForecastEntryFromSnapshot(project, entry, settings.today.forecastDetailLevel, snapshot.locale))
      : [],
    moons: settings.today.showMoons ? snapshot.moons.map((moon) => ({
      id: `${moon.name}:${moon.phaseId}`,
      icon: moon.phaseIcon || moon.icon,
      name: moon.name,
      phaseLabel: t(snapshot.locale, `moon.phase.${moon.phaseId}`)
    })) : [],
    events: settings.today.showEvents ? compactPublicEvents(snapshot.eventsToday) : [],
    weatherEvents: settings.today.showWeatherEvents ? compactPublicEvents(snapshot.weatherEventsToday ?? []) : [],
    moonEvents: settings.today.showMoonEvents ? compactPublicEvents(snapshot.moonEventsToday.map((event) => ({
      id: event.id,
      name: event.name,
      icon: event.icon,
      summary: event.summary || undefined,
      playerDescription: event.playerDescription || undefined,
      subtitle: `${event.moonName} · ${t(snapshot.locale, `moon.phase.${event.phaseId}`)}`
    }))) : [],
    dayNotes: settings.today.showDayNotes ? snapshot.dayNotesToday
      .filter((note) => Boolean(note.playerNote?.trim()))
      .map((note) => ({ id: note.id, playerNote: note.playerNote?.trim() ?? "" })) : []
  };
};

export const buildPlayerViewModelFromProject = (project: CalendarProject, rawSettings?: PlayerViewSettings): PlayerViewModel => {
  const settings = normalizePlayerViewSettings(rawSettings ?? project.uiSettings.playerView);
  const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  const currentSeason = getCurrentSeason(project);
  const currentWeather = getCurrentWeather(project);
  const currentBiome = getCurrentWeatherBiomeDefinition(project);
  const currentMoonPhases = getCurrentMoonPhases(project);
  const visibleWeatherEvents = currentWeather ? getPlayerVisibleWeatherEvents(project, currentWeather, project.currentTime) : [];
  const visibleMoonEvents = getPlayerVisibleMoonEvents(project, project.currentTime.absoluteDay);
  const visibleDayNotes = getPlayerVisibleDayNotesForDay(project, displayDate);

  return {
    locale: project.locale,
    calendarName: project.name,
    formattedDate: formatDisplayDate(displayDate, project.locale, project.uiSettings.dateFormat, project.uiSettings.timeFormat),
    season: settings.today.showSeason && currentSeason ? { name: currentSeason.name, icon: currentSeason.icon } : undefined,
    biome: settings.today.showBiome ? {
      name: t(project.locale, currentBiome.nameKey),
      icon: currentBiome.icon,
      description: t(project.locale, currentBiome.descriptionKey)
    } : undefined,
    weather: settings.today.showWeather && currentWeather ? buildWeatherViewModel(project, currentWeather, settings.today.weatherDetailLevel) : undefined,
    hourlyForecast: settings.today.showHourlyForecast
      ? getHourlyWeatherForecast(project, 5).map((entry) => buildHourlyForecastEntry(project, entry.offsetHours, entry.weather, settings.today.forecastDetailLevel))
      : [],
    moons: settings.today.showMoons ? currentMoonPhases.map(({ moon, phase }) => ({
      id: moon.id,
      icon: phase.icon,
      name: moon.name,
      phaseLabel: t(project.locale, `moon.phase.${phase.id}`)
    })) : [],
    events: settings.today.showEvents ? compactPublicEvents(getPlayerVisibleEventsForCurrentDay(project).map((event) => ({
      id: event.id,
      name: event.name,
      icon: event.icon,
      summary: event.summary || undefined,
      playerDescription: event.playerDescription || undefined,
      timeLabel: formatEventTimeShort(project, event),
      link: event.link || undefined
    }))) : [],
    weatherEvents: settings.today.showWeatherEvents ? compactPublicEvents(visibleWeatherEvents.map((event) => ({
      id: event.id,
      name: event.name,
      icon: event.icon,
      summary: event.summary || undefined,
      playerDescription: event.playerDescription || undefined,
      link: event.link || undefined
    }))) : [],
    moonEvents: settings.today.showMoonEvents ? compactPublicEvents(visibleMoonEvents.map((event) => {
      const moon = project.moons.find((item) => item.id === event.moonId);
      return {
        id: event.id,
        name: event.name,
        icon: event.icon,
        summary: event.summary || undefined,
        playerDescription: event.playerDescription || undefined,
        subtitle: `${moon?.name ?? "?"} · ${t(project.locale, `moon.phase.${event.phaseId}`)}`
      };
    })) : [],
    dayNotes: settings.today.showDayNotes ? visibleDayNotes
      .filter((note) => Boolean(note.playerNote?.trim()))
      .map((note) => ({ id: note.id, playerNote: note.playerNote?.trim() ?? "" })) : []
  };
};