import { absoluteDayToCalendarDate } from "./dateEngine";
import { getAdventureContextLabel, normalizeAdventureContext } from "./adventureContext";
import { getMoonPhaseForDate } from "./moonLogic";
import { getSeasonForDate } from "./seasonsLogic";
import { getCurrentlyMatchingWeatherEvents } from "./weatherEventsLogic";
import { generateWeatherForTime } from "./weatherLogic";
import { getTriggeredMoonEventsAtTime } from "./moonEventsLogic";
import { normalizeEventDisplayHistory, normalizeEventDisplaySettings, selectVisibleLunarEvents, selectVisibleWeatherEvents } from "./eventDisplayLogic";
import type { CalendarProject, WeatherState, WeatherTrendKind } from "../domain/types";
import type { WeatherBiomeId } from "./weather/biomes";

type SimulationSeasonStats = {
  temperatureTotal: number;
  rainTotal: number;
  windTotal: number;
  hours: number;
};

export type WeatherSimulationOptions = {
  startAbsoluteDay: number;
  durationDays: number;
  biomeId?: WeatherBiomeId;
  activeContextIds?: string[];
  seed?: string;
};

export type WeatherSimulationRow = {
  absoluteDay: number;
  year: number;
  monthId: string;
  monthName: string;
  dayOfMonth: number;
  hour: number;
  season: string;
  biome: string;
  activeContexts: string[];
  temperature?: number;
  dailyMinTemperature?: number;
  dailyMaxTemperature?: number;
  rain?: number;
  dailyRainTotal?: number;
  heatPressure?: number;
  windSpeed?: number;
  windDirection?: string;
  state?: WeatherState;
  dominantState?: WeatherState;
  trendKind?: WeatherTrendKind;
  moonPhases: string[];
  activeWeatherEvents: string[];
  activeMoonEvents: string[];
  visibleWeatherEvents: string[];
  hiddenWeatherEvents: string[];
  visibleMoonEvents: string[];
  hiddenMoonEvents: string[];
};

export type WeatherSimulationSummary = {
  daysSimulated: number;
  totalHours: number;
  rainHours: number;
  snowHours: number;
  fogHours: number;
  stormHours: number;
  strongWindHours: number;
  tempestHours: number;
  dryDays: number;
  rainyDays: number;
  snowyDays: number;
  averageTemperatureBySeason: Record<string, number>;
  averageRainBySeason: Record<string, number>;
  averageWindBySeason: Record<string, number>;
  stateOccurrences: Record<string, number>;
  dominantStateOccurrences: Record<string, number>;
  averageHeatPressure: number;
  maxHeatPressure: number;
  weatherEventOccurrences: Record<string, number>;
  moonEventOccurrences: Record<string, number>;
  visibleWeatherEventOccurrences: Record<string, number>;
  hiddenWeatherEventOccurrences: Record<string, number>;
  visibleMoonEventOccurrences: Record<string, number>;
  hiddenMoonEventOccurrences: Record<string, number>;
  weatherEventDays: Record<string, number>;
  moonEventDays: Record<string, number>;
  visibleWeatherEventDays: Record<string, number>;
  hiddenWeatherEventDays: Record<string, number>;
  visibleMoonEventDays: Record<string, number>;
  hiddenMoonEventDays: Record<string, number>;
  maxVisibleWeatherEventsAtOnce: number;
  maxHiddenWeatherEventsAtOnce: number;
  maxVisibleMoonEventsAtOnce: number;
  maxHiddenMoonEventsAtOnce: number;
};

export type WeatherSimulationResult = {
  options: Required<WeatherSimulationOptions>;
  rows: WeatherSimulationRow[];
  summary: WeatherSimulationSummary;
};

const round2 = (value: number): number => Math.round(value * 100) / 100;
const increment = (record: Record<string, number>, key: string | undefined) => {
  if (!key) return;
  record[key] = (record[key] ?? 0) + 1;
};

export const buildWeatherSimulationProject = (project: CalendarProject, options: WeatherSimulationOptions): CalendarProject => {
  const normalizedContext = normalizeAdventureContext(project.adventureContext);
  const activeContextIds = Array.from(new Set(options.activeContextIds ?? normalizedContext.activeContextIds));
  return {
    ...project,
    currentTime: { ...project.currentTime, absoluteDay: options.startAbsoluteDay, hour: 0, minute: 0 },
    weatherSettings: {
      ...project.weatherSettings,
      seed: options.seed?.trim() ? options.seed.trim() : project.weatherSettings.seed
    },
    weatherBiome: {
      ...(project.weatherBiome ?? { currentBiomeId: "temperate" as WeatherBiomeId }),
      currentBiomeId: options.biomeId ?? project.weatherBiome?.currentBiomeId ?? "temperate"
    },
    weatherOverrides: (project.weatherOverrides ?? []).filter((override) => override.source !== "sceneWeather"),
    adventureContext: {
      ...normalizedContext,
      activeContextIds
    },
    weatherEvents: project.weatherEvents.map((event) => ({ ...event })),
    moonEvents: (project.moonEvents ?? []).map((event) => ({ ...event }))
  };
};

export const runWeatherSimulation = (project: CalendarProject, options: WeatherSimulationOptions): WeatherSimulationResult => {
  const durationDays = Math.max(1, Math.trunc(options.durationDays));
  const startAbsoluteDay = Math.trunc(options.startAbsoluteDay);
  const simProjectBase = buildWeatherSimulationProject(project, { ...options, startAbsoluteDay, durationDays });
  const normalizedContext = normalizeAdventureContext(simProjectBase.adventureContext);
  const activeContextLabels = normalizedContext.activeContextIds.map((id) => {
    const definition = normalizedContext.availableContexts.find((context) => context.id === id);
    return definition ? `${definition.icon} ${getAdventureContextLabel(definition, project.locale)}` : id;
  });

  const rows: WeatherSimulationRow[] = [];
  const summary: WeatherSimulationSummary = {
    daysSimulated: durationDays,
    totalHours: durationDays * 24,
    rainHours: 0,
    snowHours: 0,
    fogHours: 0,
    stormHours: 0,
    strongWindHours: 0,
    tempestHours: 0,
    dryDays: 0,
    rainyDays: 0,
    snowyDays: 0,
    averageTemperatureBySeason: {},
    averageRainBySeason: {},
    averageWindBySeason: {},
    stateOccurrences: {},
    dominantStateOccurrences: {},
    averageHeatPressure: 0,
    maxHeatPressure: 0,
    weatherEventOccurrences: {},
    moonEventOccurrences: {},
    visibleWeatherEventOccurrences: {},
    hiddenWeatherEventOccurrences: {},
    visibleMoonEventOccurrences: {},
    hiddenMoonEventOccurrences: {},
    weatherEventDays: {},
    moonEventDays: {},
    visibleWeatherEventDays: {},
    hiddenWeatherEventDays: {},
    visibleMoonEventDays: {},
    hiddenMoonEventDays: {},
    maxVisibleWeatherEventsAtOnce: 0,
    maxHiddenWeatherEventsAtOnce: 0,
    maxVisibleMoonEventsAtOnce: 0,
    maxHiddenMoonEventsAtOnce: 0
  };
  const displaySettings = normalizeEventDisplaySettings(simProjectBase.eventDisplaySettings);
  const displayHistory = normalizeEventDisplayHistory(simProjectBase.eventDisplayHistory);
  const seasonStats: Record<string, SimulationSeasonStats> = {};
  let heatPressureTotal = 0;
  let heatPressureSamples = 0;

  for (let dayOffset = 0; dayOffset < durationDays; dayOffset += 1) {
    const absoluteDay = startAbsoluteDay + dayOffset;
    let dayRain = false;
    let daySnow = false;
    const weatherEventsSeenToday = new Set<string>();
    const moonEventsSeenToday = new Set<string>();
    const visibleWeatherEventsSeenToday = new Set<string>();
    const hiddenWeatherEventsSeenToday = new Set<string>();
    const visibleMoonEventsSeenToday = new Set<string>();
    const hiddenMoonEventsSeenToday = new Set<string>();
    for (let hour = 0; hour < 24; hour += 1) {
      const time = { absoluteDay, hour, minute: 0 };
      const simProject = { ...simProjectBase, currentTime: time };
      const date = absoluteDayToCalendarDate(time, simProject.calendarSystem);
      const season = getSeasonForDate(simProject, date);
      const weather = generateWeatherForTime(simProject, absoluteDay, hour, 0);
      const activeWeatherEvents = weather ? getCurrentlyMatchingWeatherEvents(simProject, weather, time) : [];
      const activeMoonEvents = getTriggeredMoonEventsAtTime(simProject, time);
      const absoluteMinutes = absoluteDay * 1440 + hour * 60;
      const visibleWeatherSelection = selectVisibleWeatherEvents({ activeEvents: activeWeatherEvents, settings: displaySettings, history: displayHistory, absoluteMinutes, seed: simProject.weatherSettings.seed ?? simProject.id });
      const visibleMoonSelection = selectVisibleLunarEvents({ activeEvents: activeMoonEvents, settings: displaySettings, history: displayHistory, absoluteMinutes, seed: simProject.weatherSettings.seed ?? simProject.id });
      const moonPhases = simProject.moons.map((moon) => `${moon.name}:${getMoonPhaseForDate(moon, absoluteDay).id}`);
      const seasonName = season?.name ?? "";
      if (weather) {
        if (weather.rain > 0) { summary.rainHours += 1; dayRain = true; }
        if (weather.state === "snow") { summary.snowHours += 1; daySnow = true; }
        if (weather.state === "fog") summary.fogHours += 1;
        if (weather.state === "storm") summary.stormHours += 1;
        if (weather.state === "strongWind") summary.strongWindHours += 1;
        if (weather.state === "tempest") summary.tempestHours += 1;
        if (typeof weather.heatPressure === "number") {
          heatPressureTotal += weather.heatPressure;
          heatPressureSamples += 1;
          summary.maxHeatPressure = Math.max(summary.maxHeatPressure, weather.heatPressure);
        }
        increment(summary.stateOccurrences, weather.state);
        increment(summary.dominantStateOccurrences, weather.dominantState);
        const stats = seasonStats[seasonName] ?? { temperatureTotal: 0, rainTotal: 0, windTotal: 0, hours: 0 };
        stats.temperatureTotal += weather.temperature;
        stats.rainTotal += weather.rain;
        stats.windTotal += weather.windSpeed;
        stats.hours += 1;
        seasonStats[seasonName] = stats;
      }
      for (const event of activeWeatherEvents) {
        const key = event.name || event.id;
        increment(summary.weatherEventOccurrences, key);
        weatherEventsSeenToday.add(key);
      }
      for (const event of activeMoonEvents) {
        const key = event.name || event.id;
        increment(summary.moonEventOccurrences, key);
        moonEventsSeenToday.add(key);
      }
      for (const event of visibleWeatherSelection.visibleEvents) {
        const key = event.name || event.id;
        increment(summary.visibleWeatherEventOccurrences, key);
        visibleWeatherEventsSeenToday.add(key);
      }
      for (const event of visibleWeatherSelection.hiddenEvents) {
        const key = event.name || event.id;
        increment(summary.hiddenWeatherEventOccurrences, key);
        hiddenWeatherEventsSeenToday.add(key);
      }
      for (const event of visibleMoonSelection.visibleEvents) {
        const key = event.name || event.id;
        increment(summary.visibleMoonEventOccurrences, key);
        visibleMoonEventsSeenToday.add(key);
      }
      for (const event of visibleMoonSelection.hiddenEvents) {
        const key = event.name || event.id;
        increment(summary.hiddenMoonEventOccurrences, key);
        hiddenMoonEventsSeenToday.add(key);
      }
      summary.maxVisibleWeatherEventsAtOnce = Math.max(summary.maxVisibleWeatherEventsAtOnce, visibleWeatherSelection.visibleEvents.length);
      summary.maxHiddenWeatherEventsAtOnce = Math.max(summary.maxHiddenWeatherEventsAtOnce, visibleWeatherSelection.hiddenEvents.length);
      summary.maxVisibleMoonEventsAtOnce = Math.max(summary.maxVisibleMoonEventsAtOnce, visibleMoonSelection.visibleEvents.length);
      summary.maxHiddenMoonEventsAtOnce = Math.max(summary.maxHiddenMoonEventsAtOnce, visibleMoonSelection.hiddenEvents.length);
      rows.push({
        absoluteDay,
        year: date.year,
        monthId: date.monthId,
        monthName: date.monthName,
        dayOfMonth: date.dayOfMonth,
        hour,
        season: seasonName,
        biome: simProject.weatherBiome?.currentBiomeId ?? "temperate",
        activeContexts: activeContextLabels,
        temperature: weather?.temperature,
        dailyMinTemperature: weather?.dailyMinTemperature,
        dailyMaxTemperature: weather?.dailyMaxTemperature,
        rain: weather?.rain,
        dailyRainTotal: weather?.dailyRainTotal,
        heatPressure: weather?.heatPressure,
        windSpeed: weather?.windSpeed,
        windDirection: weather?.windDirection,
        state: weather?.state,
        dominantState: weather?.dominantState,
        trendKind: weather?.trendKind,
        moonPhases,
        activeWeatherEvents: activeWeatherEvents.map((event) => event.name || event.id),
        activeMoonEvents: activeMoonEvents.map((event) => event.name || event.id),
        visibleWeatherEvents: visibleWeatherSelection.visibleEvents.map((event) => event.name || event.id),
        hiddenWeatherEvents: visibleWeatherSelection.hiddenEvents.map((event) => event.name || event.id),
        visibleMoonEvents: visibleMoonSelection.visibleEvents.map((event) => event.name || event.id),
        hiddenMoonEvents: visibleMoonSelection.hiddenEvents.map((event) => event.name || event.id)
      });
    }
    if (dayRain) summary.rainyDays += 1;
    else summary.dryDays += 1;
    if (daySnow) summary.snowyDays += 1;
    for (const key of weatherEventsSeenToday) increment(summary.weatherEventDays, key);
    for (const key of moonEventsSeenToday) increment(summary.moonEventDays, key);
    for (const key of visibleWeatherEventsSeenToday) increment(summary.visibleWeatherEventDays, key);
    for (const key of hiddenWeatherEventsSeenToday) increment(summary.hiddenWeatherEventDays, key);
    for (const key of visibleMoonEventsSeenToday) increment(summary.visibleMoonEventDays, key);
    for (const key of hiddenMoonEventsSeenToday) increment(summary.hiddenMoonEventDays, key);
  }

  for (const [seasonName, stats] of Object.entries(seasonStats)) {
    if (stats.hours <= 0) continue;
    summary.averageTemperatureBySeason[seasonName] = round2(stats.temperatureTotal / stats.hours);
    summary.averageRainBySeason[seasonName] = round2(stats.rainTotal / stats.hours);
    summary.averageWindBySeason[seasonName] = round2(stats.windTotal / stats.hours);
  }
  summary.averageHeatPressure = heatPressureSamples > 0 ? round2(heatPressureTotal / heatPressureSamples) : 0;

  return {
    options: {
      startAbsoluteDay,
      durationDays,
      biomeId: simProjectBase.weatherBiome?.currentBiomeId ?? "temperate",
      activeContextIds: normalizedContext.activeContextIds,
      seed: simProjectBase.weatherSettings.seed ?? ""
    },
    rows,
    summary
  };
};

const csvEscape = (value: unknown): string => {
  const text = Array.isArray(value) ? value.join(" | ") : value === undefined || value === null ? "" : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const weatherSimulationToCsv = (result: WeatherSimulationResult): string => {
  const columns: Array<keyof WeatherSimulationRow> = ["absoluteDay", "year", "monthName", "dayOfMonth", "hour", "season", "biome", "activeContexts", "temperature", "dailyMinTemperature", "dailyMaxTemperature", "rain", "dailyRainTotal", "heatPressure", "windSpeed", "windDirection", "state", "dominantState", "trendKind", "moonPhases", "activeWeatherEvents", "activeMoonEvents"];
  return [columns.join(","), ...result.rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")), "", "summary", csvEscape(JSON.stringify(result.summary))].join("\n");
};
