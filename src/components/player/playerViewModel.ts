import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import { getPlayerVisibleDayNotesForDay } from "../../calendar/dayNotesLogic";
import { getPlayerVisibleEventsForCurrentDay } from "../../calendar/eventsLogic";
import { formatDisplayDate } from "../../calendar/formatDisplayDate";
import { formatEventTimeShort } from "../../calendar/formatEvent";
import { getCurrentMoonPhases } from "../../calendar/moonLogic";
import { getPlayerVisibleMoonEvents } from "../../calendar/moonEventsLogic";
import { getCurrentSeason } from "../../calendar/seasonsLogic";
import { getConfiguredWeatherStateIcon, getWeatherStateLabel, getWeatherTrendLabel } from "../../calendar/weatherAdvancedSettings";
import { getCurrentWeatherBiomeDefinition } from "../../calendar/weather/biomes";
import { getPlayerVisibleWeatherEvents } from "../../calendar/weatherEventsLogic";
import { getCurrentWeather } from "../../calendar/weatherLogic";
import { formatRain, formatRainTotal, formatTemperature, formatWindSpeed } from "../../calendar/weatherUnits";
import type { CalendarProject, LocaleCode } from "../../domain/types";
import type { PublicCalendarTodaySnapshot } from "../../obr/publicSnapshot";
import { t } from "../../i18n/messages";
import type { PublicEventDetails } from "./PublicEventDetailsPopup";

export type PlayerWeatherViewModel = {
  stateIcon: string;
  stateLabel: string;
  temperature: string;
  wind: string;
  rain: string;
  dailyMinMax?: string;
  dailyRainTotal?: string;
  trend?: string;
  dominantState?: string;
};

export type PlayerViewModel = {
  locale: LocaleCode;
  calendarName: string;
  formattedDate: string;
  season?: { name: string; icon?: string };
  biome?: { name: string; icon: string; description: string };
  weather?: PlayerWeatherViewModel;
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

export const buildPlayerViewModelFromSnapshot = (
  project: CalendarProject,
  snapshot: PublicCalendarTodaySnapshot
): PlayerViewModel => ({
  locale: snapshot.locale,
  calendarName: snapshot.calendarName,
  formattedDate: snapshot.formattedDate,
  season: snapshot.season,
  biome: snapshot.weatherBiome,
  weather: snapshot.weather ? {
    stateIcon: getConfiguredWeatherStateIcon(project, snapshot.weather.state ?? "clear"),
    stateLabel: getWeatherStateLabel(project, snapshot.weather.state ?? "clear", snapshot.locale),
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
  } : undefined,
  moons: snapshot.moons.map((moon) => ({
    id: `${moon.name}:${moon.phaseId}`,
    icon: moon.phaseIcon || moon.icon,
    name: moon.name,
    phaseLabel: t(snapshot.locale, `moon.phase.${moon.phaseId}`)
  })),
  events: compactPublicEvents(snapshot.eventsToday),
  weatherEvents: compactPublicEvents(snapshot.weatherEventsToday ?? []),
  moonEvents: compactPublicEvents(snapshot.moonEventsToday.map((event) => ({
    id: event.id,
    name: event.name,
    icon: event.icon,
    summary: event.summary || undefined,
    playerDescription: event.playerDescription || undefined,
    subtitle: `${event.moonName} · ${t(snapshot.locale, `moon.phase.${event.phaseId}`)}`
  }))),
  dayNotes: snapshot.dayNotesToday
    .filter((note) => Boolean(note.playerNote?.trim()))
    .map((note) => ({ id: note.id, playerNote: note.playerNote?.trim() ?? "" }))
});

export const buildPlayerViewModelFromProject = (project: CalendarProject): PlayerViewModel => {
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
    season: currentSeason ? { name: currentSeason.name, icon: currentSeason.icon } : undefined,
    biome: {
      name: t(project.locale, currentBiome.nameKey),
      icon: currentBiome.icon,
      description: t(project.locale, currentBiome.descriptionKey)
    },
    weather: currentWeather ? {
      stateIcon: getConfiguredWeatherStateIcon(project, currentWeather.state ?? "clear"),
      stateLabel: getWeatherStateLabel(project, currentWeather.state ?? "clear"),
      temperature: formatTemperature(currentWeather.temperature, project.units, project.locale),
      wind: `${currentWeather.windDirection} · ${formatWindSpeed(currentWeather.windSpeed, project.units, project.locale)}`,
      rain: formatRain(currentWeather.rain, project.units, project.locale),
      dailyMinMax: currentWeather.dailyMinTemperature !== undefined && currentWeather.dailyMaxTemperature !== undefined
        ? `${formatTemperature(currentWeather.dailyMinTemperature, project.units, project.locale)} / ${formatTemperature(currentWeather.dailyMaxTemperature, project.units, project.locale)}`
        : undefined,
      dailyRainTotal: currentWeather.dailyRainTotal !== undefined ? formatRainTotal(currentWeather.dailyRainTotal, project.units, project.locale) : undefined,
      trend: currentWeather.trendKind ? getWeatherTrendLabel(project, currentWeather.trendKind) : undefined,
      dominantState: currentWeather.dominantState
        ? `${getConfiguredWeatherStateIcon(project, currentWeather.dominantState)} ${getWeatherStateLabel(project, currentWeather.dominantState)}`
        : undefined
    } : undefined,
    moons: currentMoonPhases.map(({ moon, phase }) => ({
      id: moon.id,
      icon: phase.icon,
      name: moon.name,
      phaseLabel: t(project.locale, `moon.phase.${phase.id}`)
    })),
    events: compactPublicEvents(getPlayerVisibleEventsForCurrentDay(project).map((event) => ({
      id: event.id,
      name: event.name,
      icon: event.icon,
      summary: event.summary || undefined,
      playerDescription: event.playerDescription || undefined,
      timeLabel: formatEventTimeShort(project, event),
      link: event.link || undefined
    }))),
    weatherEvents: compactPublicEvents(visibleWeatherEvents.map((event) => ({
      id: event.id,
      name: event.name,
      icon: event.icon,
      summary: event.summary || undefined,
      playerDescription: event.playerDescription || undefined,
      link: event.link || undefined
    }))),
    moonEvents: compactPublicEvents(visibleMoonEvents.map((event) => {
      const moon = project.moons.find((item) => item.id === event.moonId);
      return {
        id: event.id,
        name: event.name,
        icon: event.icon,
        summary: event.summary || undefined,
        playerDescription: event.playerDescription || undefined,
        subtitle: `${moon?.name ?? "?"} · ${t(project.locale, `moon.phase.${event.phaseId}`)}`
      };
    })),
    dayNotes: visibleDayNotes
      .filter((note) => Boolean(note.playerNote?.trim()))
      .map((note) => ({ id: note.id, playerNote: note.playerNote?.trim() ?? "" }))
  };
};
