import { absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { getPlayerVisibleEventsForCurrentDay, getPlayerVisibleEventsForDay } from "../calendar/eventsLogic";
import { getPlayerVisibleDayNotesForDay } from "../calendar/dayNotesLogic";
import { formatDisplayDate } from "../calendar/formatDisplayDate";
import { formatEventTimeShort } from "../calendar/formatEvent";
import { getTriggeredMoonEventsAtTime } from "../calendar/moonEventsLogic";
import { normalizeEventDisplayHistory, normalizeEventDisplaySettings, selectVisibleLunarEvents, selectVisibleWeatherEvents } from "../calendar/eventDisplayLogic";
import { filterPlayerPublishableLunarEvents, filterPlayerPublishableWeatherEvents, getPlayerLunarEventDisplayCandidates, getPlayerWeatherEventDisplayCandidates } from "../calendar/eventPublicationLogic";
import { getCurrentMoonPhases } from "../calendar/moonLogic";
import { getCurrentSeason, getSeasonForDate } from "../calendar/seasonsLogic";
import { generateWeatherForTime, getCurrentWeather, getHourlyWeatherForecast } from "../calendar/weatherLogic";
import { getCurrentWeatherBiomeDefinition } from "../calendar/weather/biomes";
import { getCurrentlyMatchingWeatherEvents } from "../calendar/weatherEventsLogic";
import { formatRainTotal, formatTemperature, formatWindSpeed, getWeatherUnitLabels, toDisplayRain, toDisplayTemperature, toDisplayWindSpeed } from "../calendar/weatherUnits";
import type { CalendarCurrentTime, CalendarDate, CalendarProject, InternalTime, LocaleCode, MoonPhaseId, PlayerViewSettings, WeatherSnapshot, WeatherState, WeatherTrendKind, WindDirection } from "../domain/types";
import { t } from "../i18n/messages";
import { normalizePlayerViewSettings } from "../calendar/playerViewSettings";
import { getCurrentMonthDays, getCurrentMonthFirstWeekdayIndex, getCurrentMonthWeekdayNames } from "../calendar/monthView";
import { getDailyWeatherForecastEntries } from "../calendar/dayDetails";
import { getWeatherStateLabel, getConfiguredWeatherStateIcon, getConfiguredWeatherTrendIcon, getWeatherTrendLabel } from "../calendar/weatherAdvancedSettings";
import { getAdjacentMonthLabels, getMonthViewTimeForDate, getNextMonthViewTime, getPreviousMonthViewTime } from "../calendar/monthNavigation";

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
  trendKind?: WeatherTrendKind;
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

export type PublicMonthMarkerSnapshot = {
  id: string;
  icon: string;
  label: string;
  type: "event" | "weather" | "moon" | "note" | "season" | "weatherSummary";
};

export type PublicMonthWeatherSummarySnapshot = {
  state?: WeatherState;
  stateIcon: string;
  stateLabel: string;
  temperatureLabel?: string;
  temperatureCelsius?: number;
  windSpeedLabel?: string;
  windSpeedKmh?: number;
  windDirection?: WindDirection;
  rainTotalLabel?: string;
  trendKind?: WeatherTrendKind;
  trendIcon?: string;
  trendLabel?: string;
  dominantState?: WeatherState;
  dominantStateIcon?: string;
  dominantStateLabel?: string;
  broadLabel?: string;
  broadTemperature?: string;
  broadWind?: string;
  broadRain?: string;
  broadSoil?: string;
  broadTrend?: string;
  broadDominant?: string;
  narrativeLabel?: string;
};

export type PublicMonthDaySnapshot = {
  key: string;
  absoluteDay: number;
  dayOfMonth: number;
  dateLabel: string;
  isToday: boolean;
  season?: PublicCalendarSeasonSnapshot;
  weatherSummary?: PublicMonthWeatherSummarySnapshot;
  events: PublicCalendarEventSnapshot[];
  weatherEvents: Array<{ id: string; name: string; icon?: string; summary?: string; playerDescription?: string; link?: string }>;
  moonEvents: Array<{ id: string; name: string; icon?: string; summary?: string; playerDescription?: string; moonName: string; phaseId: MoonPhaseId }>;
  dayNotes: Array<{ id: string; playerNote: string }>;
  markers: PublicMonthMarkerSnapshot[];
};

export type PublicDailyForecastSnapshot = {
  offsetDays: number;
  absoluteDay: number;
  dateLabel: string;
  stateIcon: string;
  stateLabel: string;
  averageTemperature?: number;
  averageWindSpeed?: number;
  dominantWindDirection?: WindDirection;
  rainTotal24h?: number;
  averageTemperatureCelsius?: number;
  averageWindSpeedKmh?: number;
  trendKind?: WeatherTrendKind;
  trendIcon?: string;
  trendLabel?: string;
  broadLabel?: string;
  broadTemperature?: string;
  broadWind?: string;
  broadRain?: string;
  broadSoil?: string;
  broadTrend?: string;
  broadDominant?: string;
  narrativeLabel?: string;
  units: { temperature: string; windSpeed: string; rainTotal: string };
};


export type PublicMonthSnapshot = {
  viewedTime: InternalTime;
  previousViewedTime: InternalTime;
  nextViewedTime: InternalTime;
  monthLabel: string;
  previousMonthLabel: string;
  nextMonthLabel: string;
  weekdays: string[];
  leadingEmptyDays: number;
  days: PublicMonthDaySnapshot[];
  dailyForecast?: PublicDailyForecastSnapshot[];
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
  month?: PublicMonthSnapshot;
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
    trendKind: weather.trendKind,
    units: { temperature: weatherUnits.temperature, windSpeed: weatherUnits.windSpeed, rain: weatherUnits.rain }
  }));
};

const shortDateLabel = (project: CalendarProject, date: CalendarDate): string => {
  const monthName = project.calendarSystem.months.find((month) => month.id === date.monthId)?.name ?? "";
  return `${date.dayOfMonth} ${monthName}`.trim();
};

const broadTemperatureLabel = (project: CalendarProject, temperature: number): string => {
  if (temperature < -10) return t(project.locale, "player.weatherBroad.freezing");
  if (temperature < 0) return t(project.locale, "player.weatherBroad.cold");
  if (temperature < 10) return t(project.locale, "player.weatherBroad.cool");
  if (temperature < 22) return t(project.locale, "player.weatherBroad.mild");
  if (temperature < 32) return t(project.locale, "player.weatherBroad.warm");
  if (temperature < 40) return t(project.locale, "player.weatherBroad.hot");
  return t(project.locale, "player.weatherBroad.scorching");
};

const broadWindLabel = (project: CalendarProject, windSpeed: number, direction?: WindDirection): string => {
  const level = windSpeed < 5 ? "player.weatherBroad.windCalm" : windSpeed < 20 ? "player.weatherBroad.windLight" : windSpeed < 40 ? "player.weatherBroad.windModerate" : windSpeed < 70 ? "player.weatherBroad.windStrong" : "player.weatherBroad.windViolent";
  return `${t(project.locale, level)}${direction ? ` ${t(project.locale, `player.weatherBroad.direction.${direction}`)}` : ""}`;
};

const broadRainLabel = (project: CalendarProject, rain: number): string => {
  const level = rain <= 0.05 ? "player.weatherBroad.rainDry" : rain < 1 ? "player.weatherBroad.rainDrizzle" : rain < 5 ? "player.weatherBroad.rainLight" : rain < 15 ? "player.weatherBroad.rainModerate" : rain < 30 ? "player.weatherBroad.rainHeavy" : "player.weatherBroad.rainDeluge";
  return t(project.locale, level);
};

const broadSoilLabel = (project: CalendarProject, rainTotal = 0): string => {
  const level = rainTotal <= 0.2 ? "player.weatherBroad.soilDry" : rainTotal < 2 ? "player.weatherBroad.soilSlightlyWet" : rainTotal < 8 ? "player.weatherBroad.soilWet" : rainTotal < 20 ? "player.weatherBroad.soilSoaked" : "player.weatherBroad.soilFlooded";
  return t(project.locale, level);
};

const fillNarrative = (template: string, values: Record<string, string>): string => Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);

const buildPublicBroadWeather = (project: CalendarProject, weather: { temperature: number; windSpeed: number; windDirection?: WindDirection; rain: number; rainTotal?: number; stateLabel: string; dominantIcon: string; dominantLabel: string; trendIcon?: string; trendLabel?: string }) => {
  const temperature = broadTemperatureLabel(project, weather.temperature);
  const wind = broadWindLabel(project, weather.windSpeed, weather.windDirection);
  const rain = broadRainLabel(project, weather.rain);
  const soil = broadSoilLabel(project, weather.rainTotal);
  const trend = weather.trendLabel ?? t(project.locale, "player.weatherBroad.trendStable");
  return {
    broadLabel: `🌡️ ${temperature} · 🌬️ ${wind} · 🌧️ ${rain}`,
    broadTemperature: `🌡️ ${t(project.locale, "weather.temperature")} ${temperature}`,
    broadWind: `🌬️ ${wind}`,
    broadRain: `🌧️ ${rain}`,
    broadSoil: `💧 ${soil}`,
    broadTrend: `${weather.trendIcon ?? "⚖️"} ${t(project.locale, "weather.trend")}: ${trend}`,
    broadDominant: `${weather.dominantIcon} ${t(project.locale, "weather.dominantState")}: ${weather.dominantLabel}`,
    narrativeLabel: fillNarrative(t(project.locale, "player.weatherNarrative.summary"), { icon: weather.dominantIcon, state: weather.stateLabel.toLowerCase(), temperature, wind, rain, soil, trend: trend.toLowerCase(), dominant: weather.dominantLabel.toLowerCase() })
  };
};

const toPublicEventSnapshot = (project: CalendarProject, event: ReturnType<typeof getPlayerVisibleEventsForDay>[number]): PublicCalendarEventSnapshot => ({
  id: event.id,
  name: event.name,
  icon: event.icon,
  summary: event.summary || undefined,
  playerDescription: event.playerDescription || undefined,
  link: event.link || undefined,
  timeLabel: formatEventTimeShort(project, event)
});

export const buildPublicMonthSnapshot = (
  project: CalendarProject,
  settings: PlayerViewSettings,
  requestedViewedTime?: InternalTime
): PublicMonthSnapshot => {
  const currentMonthDate = absoluteDayToCalendarDate(requestedViewedTime ?? project.currentTime, project.calendarSystem);
  const viewedTime = getMonthViewTimeForDate(project, currentMonthDate);
  const adjacentLabels = getAdjacentMonthLabels(project, viewedTime);
  const previousViewedTime = getPreviousMonthViewTime(project, viewedTime);
  const nextViewedTime = getNextMonthViewTime(project, viewedTime);
  const monthDays = getCurrentMonthDays(viewedTime, project.calendarSystem);
  const weekdays = getCurrentMonthWeekdayNames(project.calendarSystem, project.uiSettings.monthGridStartsOnWeekdayId);
  const leadingEmptyDays = getCurrentMonthFirstWeekdayIndex(viewedTime, project.calendarSystem, project.uiSettings.monthGridStartsOnWeekdayId);
  const weatherUnits = getWeatherUnitLabels(project.units);
  const eventDisplaySettings = normalizeEventDisplaySettings(project.eventDisplaySettings);
  const eventDisplayHistory = normalizeEventDisplayHistory(project.eventDisplayHistory);
  const days = monthDays.map((day) => {
    const date = absoluteDayToCalendarDate({ absoluteDay: day.absoluteDay, hour: 0, minute: 0 }, project.calendarSystem);
    const eventDate = { ...date, hour: 0, minute: 0 };
    const events = settings.month.showPublicEvents ? getPlayerVisibleEventsForDay(project, eventDate).map((event) => toPublicEventSnapshot(project, event)) : [];
    const weather = settings.month.showWeatherSummary || settings.month.showWeatherEvents
      ? generateWeatherForTime(project, day.absoluteDay, 12)
      : undefined;
    const dayMinutes = day.absoluteDay * 1440 + 12 * 60;
    const rawWeatherEvents = settings.month.showWeatherEvents && weather ? getCurrentlyMatchingWeatherEvents(project, weather, { absoluteDay: day.absoluteDay, hour: 12, minute: 0 }) : [];
    const selectedWeatherEvents = selectVisibleWeatherEvents({ activeEvents: rawWeatherEvents, settings: eventDisplaySettings, history: eventDisplayHistory, absoluteMinutes: dayMinutes, seed: project.weatherSettings.seed ?? project.id });
    const weatherCandidates = getPlayerWeatherEventDisplayCandidates(project, selectedWeatherEvents.visibleEvents, selectedWeatherEvents.hiddenEvents);
    const publishedWeatherEvents = filterPlayerPublishableWeatherEvents(project, weatherCandidates, settings.month.showWeatherEvents);
    const weatherEvents = publishedWeatherEvents.map((event) => ({
      id: event.id, name: event.name, icon: event.icon, summary: event.summary || undefined, playerDescription: event.playerDescription || undefined, link: event.link || undefined
    }));
    const rawMoonEvents = settings.month.showMoonEvents ? getTriggeredMoonEventsAtTime(project, { absoluteDay: day.absoluteDay, hour: 12, minute: 0 }) : [];
    const selectedMoonEvents = selectVisibleLunarEvents({ activeEvents: rawMoonEvents, settings: eventDisplaySettings, history: eventDisplayHistory, absoluteMinutes: dayMinutes, seed: project.weatherSettings.seed ?? project.id });
    const moonCandidates = getPlayerLunarEventDisplayCandidates(project, selectedMoonEvents.visibleEvents, selectedMoonEvents.hiddenEvents);
    const publishedMoonEvents = filterPlayerPublishableLunarEvents(project, moonCandidates, settings.month.showMoonEvents);
    const moonEvents = publishedMoonEvents.map((event) => ({
      id: event.id, name: event.name, icon: event.icon, summary: event.summary || undefined, playerDescription: event.playerDescription || undefined, moonName: project.moons.find((moon) => moon.id === event.moonId)?.name ?? "?", phaseId: event.phaseId
    }));
    const dayNotes = settings.month.showDayNotes ? getPlayerVisibleDayNotesForDay(project, eventDate).filter((note) => Boolean(note.playerNote?.trim())).map((note) => ({ id: note.id, playerNote: note.playerNote?.trim() ?? "" })) : [];
    const season = settings.month.showWeatherSummary ? getSeasonForDate(project, eventDate) : undefined;
    const weatherState = weather?.state ?? "clear";
    const weatherSummary = settings.month.showWeatherSummary && weather ? (() => {
      const stateLabel = getWeatherStateLabel(project, weatherState, project.locale);
      const dominantState = weather.dominantState ?? weatherState;
      const broadWeather = buildPublicBroadWeather(project, {
        temperature: weather.temperature,
        windSpeed: weather.windSpeed,
        windDirection: weather.windDirection,
        rain: weather.rain,
        rainTotal: weather.dailyRainTotal,
        stateLabel,
        dominantIcon: getConfiguredWeatherStateIcon(project, dominantState),
        dominantLabel: getWeatherStateLabel(project, dominantState, project.locale),
        trendIcon: weather.trendKind ? getConfiguredWeatherTrendIcon(project, weather.trendKind) : undefined,
        trendLabel: weather.trendKind ? getWeatherTrendLabel(project, weather.trendKind, project.locale) : undefined
      });
      return {
        state: weatherState,
        stateIcon: getConfiguredWeatherStateIcon(project, weatherState),
        stateLabel,
        ...(settings.month.weatherDetailLevel === "precise" ? {
          temperatureLabel: formatTemperature(weather.temperature, project.units, project.locale),
          temperatureCelsius: weather.temperature,
          windSpeedLabel: formatWindSpeed(weather.windSpeed, project.units, project.locale),
          windSpeedKmh: weather.windSpeed,
          windDirection: weather.windDirection,
          rainTotalLabel: weather.dailyRainTotal !== undefined ? formatRainTotal(weather.dailyRainTotal, project.units, project.locale) : undefined,
          trendKind: weather.trendKind,
          trendIcon: weather.trendKind ? getConfiguredWeatherTrendIcon(project, weather.trendKind) : undefined,
          trendLabel: weather.trendKind ? getWeatherTrendLabel(project, weather.trendKind, project.locale) : undefined,
          dominantState: weather.dominantState,
          dominantStateIcon: weather.dominantState ? getConfiguredWeatherStateIcon(project, weather.dominantState) : undefined,
          dominantStateLabel: weather.dominantState ? getWeatherStateLabel(project, weather.dominantState, project.locale) : undefined
        } : broadWeather)
      };
    })() : undefined;
    const markers: PublicMonthMarkerSnapshot[] = [
      ...events.map((event) => ({ id: `event:${event.id}`, icon: event.icon ?? "📌", label: event.name, type: "event" as const })),
      ...weatherEvents.map((event) => ({ id: `weather:${event.id}`, icon: event.icon ?? "⛈️", label: event.name, type: "weather" as const })),
      ...moonEvents.map((event) => ({ id: `moon:${event.id}`, icon: event.icon ?? "🌕", label: event.name, type: "moon" as const })),
      ...dayNotes.map((note) => ({ id: `note:${note.id}`, icon: "📝", label: t(project.locale, "player.publicMonthNotes"), type: "note" as const }))
    ];
    return {
      key: `${date.year}:${date.monthId}:${date.dayOfMonth}`,
      absoluteDay: day.absoluteDay,
      dayOfMonth: day.dayOfMonth,
      dateLabel: shortDateLabel(project, date),
      isToday: day.absoluteDay === project.currentTime.absoluteDay,
      season: season ? { name: season.name, icon: season.icon } : undefined,
      weatherSummary,
      events,
      weatherEvents,
      moonEvents,
      dayNotes,
      markers
    };
  });
  const forecast = settings.month.showFiveDayForecast ? getDailyWeatherForecastEntries(project, 5).map((entry) => {
    const broadWeather = entry.dailyWeather ? buildPublicBroadWeather(project, {
      temperature: entry.dailyWeather.averageTemperature,
      windSpeed: entry.dailyWeather.averageWindSpeed,
      windDirection: entry.dailyWeather.dominantWindDirection,
      rain: entry.dailyWeather.rainTotal24h / 24,
      rainTotal: entry.dailyWeather.rainTotal24h,
      stateLabel: getWeatherStateLabel(project, entry.dailyWeather.dominantState, project.locale),
      dominantIcon: getConfiguredWeatherStateIcon(project, entry.dailyWeather.dominantState),
      dominantLabel: getWeatherStateLabel(project, entry.dailyWeather.dominantState, project.locale),
      trendIcon: entry.dailyWeather.trendKind ? getConfiguredWeatherTrendIcon(project, entry.dailyWeather.trendKind) : undefined,
      trendLabel: entry.dailyWeather.trendKind ? getWeatherTrendLabel(project, entry.dailyWeather.trendKind, project.locale) : undefined
    }) : {};
    return {
      offsetDays: entry.offsetDays,
      absoluteDay: entry.absoluteDay,
      dateLabel: entry.offsetDays === 0 ? t(project.locale, "common.today") : shortDateLabel(project, entry.date),
      stateIcon: entry.dailyWeather ? getConfiguredWeatherStateIcon(project, entry.dailyWeather.dominantState) : "☁️",
      stateLabel: entry.dailyWeather ? getWeatherStateLabel(project, entry.dailyWeather.dominantState, project.locale) : t(project.locale, "calendar.noWeather"),
      averageTemperature: entry.dailyWeather ? Math.round(toDisplayTemperature(entry.dailyWeather.averageTemperature, project.units.temperature)) : undefined,
      averageTemperatureCelsius: entry.dailyWeather?.averageTemperature,
      averageWindSpeed: entry.dailyWeather ? Math.round(toDisplayWindSpeed(entry.dailyWeather.averageWindSpeed, project.units.windSpeed)) : undefined,
      averageWindSpeedKmh: entry.dailyWeather?.averageWindSpeed,
      dominantWindDirection: entry.dailyWeather?.dominantWindDirection,
      rainTotal24h: entry.dailyWeather ? roundPublicWeatherValue(toDisplayRain(entry.dailyWeather.rainTotal24h, project.units.rain), project.units.rain === "inch" ? 2 : 1) : undefined,
      trendKind: entry.dailyWeather?.trendKind,
      trendIcon: entry.dailyWeather?.trendKind ? getConfiguredWeatherTrendIcon(project, entry.dailyWeather.trendKind) : undefined,
      trendLabel: entry.dailyWeather?.trendKind ? getWeatherTrendLabel(project, entry.dailyWeather.trendKind, project.locale) : undefined,
      ...broadWeather,
      units: { temperature: weatherUnits.temperature, windSpeed: weatherUnits.windSpeed, rainTotal: weatherUnits.rainTotal }
    };
  }) : [];
  return {
    viewedTime,
    previousViewedTime,
    nextViewedTime,
    monthLabel: adjacentLabels.current,
    previousMonthLabel: adjacentLabels.previous,
    nextMonthLabel: adjacentLabels.next,
    weekdays,
    leadingEmptyDays,
    days,
    dailyForecast: forecast
  };
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
  const publicWeather = currentWeather ? (() => {
    const { heatPressure: _heatPressure, ...publicWeatherData } = currentWeather;
    return {
      ...publicWeatherData,
      temperature: roundPublicWeatherValue(toDisplayTemperature(currentWeather.temperature, project.units.temperature), 0),
      dailyMinTemperature: currentWeather.dailyMinTemperature === undefined ? undefined : roundPublicWeatherValue(toDisplayTemperature(currentWeather.dailyMinTemperature, project.units.temperature), 0),
      dailyMaxTemperature: currentWeather.dailyMaxTemperature === undefined ? undefined : roundPublicWeatherValue(toDisplayTemperature(currentWeather.dailyMaxTemperature, project.units.temperature), 0),
      windSpeed: roundPublicWeatherValue(toDisplayWindSpeed(currentWeather.windSpeed, project.units.windSpeed), 0),
      rain: roundPublicWeatherValue(toDisplayRain(currentWeather.rain, project.units.rain), rainDecimals),
      dailyRainTotal: currentWeather.dailyRainTotal === undefined ? undefined : roundPublicWeatherValue(toDisplayRain(currentWeather.dailyRainTotal, project.units.rain), rainDecimals),
      units: weatherUnits
    };
  })() : undefined;
  const activeWeatherEvents = currentWeather
    ? getCurrentlyMatchingWeatherEvents(project, currentWeather, project.currentTime)
    : [];
  const eventDisplaySettings = normalizeEventDisplaySettings(project.eventDisplaySettings);
  const eventDisplayHistory = normalizeEventDisplayHistory(project.eventDisplayHistory);
  const absoluteMinutes = project.currentTime.absoluteDay * 1440 + project.currentTime.hour * 60 + project.currentTime.minute;
  const arbitratedWeatherEvents = selectVisibleWeatherEvents({ activeEvents: activeWeatherEvents, settings: eventDisplaySettings, history: eventDisplayHistory, absoluteMinutes, seed: project.weatherSettings.seed ?? project.id });
  const weatherCandidates = getPlayerWeatherEventDisplayCandidates(project, arbitratedWeatherEvents.visibleEvents, arbitratedWeatherEvents.hiddenEvents);
  const publishedWeatherEvents = filterPlayerPublishableWeatherEvents(project, weatherCandidates, playerView.today.showWeatherEvents);
  const arbitratedMoonEvents = selectVisibleLunarEvents({ activeEvents: getTriggeredMoonEventsAtTime(project, project.currentTime), settings: eventDisplaySettings, history: eventDisplayHistory, absoluteMinutes, seed: project.weatherSettings.seed ?? project.id });
  const moonCandidates = getPlayerLunarEventDisplayCandidates(project, arbitratedMoonEvents.visibleEvents, arbitratedMoonEvents.hiddenEvents);
  const publishedMoonEvents = filterPlayerPublishableLunarEvents(project, moonCandidates, playerView.today.showMoonEvents);

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
    weatherEventsToday: publishedWeatherEvents.map((event) => ({
      id: event.id,
      name: event.name,
      icon: event.icon,
      summary: event.summary || undefined,
      playerDescription: event.playerDescription || undefined,
      link: event.link || undefined
    })),
    moonEventsToday: publishedMoonEvents.map((event) => ({
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
    month: buildPublicMonthSnapshot(project, playerView),
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