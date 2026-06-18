import type { CalendarProject } from "../domain/types";
import { createDefaultMoonSystem, ensureDefaultMoonSystem } from "../calendar/moonLogic";
import { sanitizeCalendarProject } from "../importExport/calendarImportExport";
import { DEFAULT_WEATHER_BIOME_ID } from "../calendar/weather/biomes";
import { DEFAULT_SCENE_WEATHER_PROFILES, ensureDefaultSceneWeatherProfiles } from "../calendar/sceneWeatherDefaults";
import { notifyCalendarProjectUpdated } from "./projectSync";
import { DEFAULT_PLAYER_VIEW_SETTINGS } from "../calendar/playerViewSettings";
import { createDefaultAdventureContext, ensureAdventureContext } from "../calendar/adventureContext";
import { DEFAULT_EVENT_DISPLAY_HISTORY, DEFAULT_EVENT_DISPLAY_SETTINGS } from "../calendar/eventDisplayLogic";
import { DEFAULT_MANUAL_PUBLICATIONS } from "../calendar/eventPublicationLogic";

const STORAGE_KEY = "calendar-obr.project.local-dev";
const DEFAULT_WEATHER_SEED = "default-calendar";

const createWeatherSeed = (): string => `meteo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const createDefaultSeasons = (): CalendarProject["seasons"] => [
  {
    id: "season-spring",
    name: "Printemps",
    icon: "🌱",
    start: { monthId: "month-1", dayOfMonth: 1 },
    end: { monthId: "month-1", dayOfMonth: 15 },
    weatherModifier: {
      temperature: { minOffset: 2, averageOffset: 3, maxOffset: 4 },
      rain: { minMultiplier: 1.1, averageMultiplier: 1.2, maxMultiplier: 1.15 },
      dailyRain: { minMultiplier: 1.1, averageMultiplier: 1.25, maxMultiplier: 1.2 },
      windSpeed: { minMultiplier: 0.95, averageMultiplier: 1, maxMultiplier: 1.05 },
      traits: { precipitationChanceOffset: 0.08, stormChanceOffset: 0.03, fogChanceOffset: 0.04 }
    }
  },
  {
    id: "season-summer",
    name: "Été",
    icon: "☀️",
    start: { monthId: "month-1", dayOfMonth: 16 },
    end: { monthId: "month-1", dayOfMonth: 30 },
    weatherModifier: {
      temperature: { minOffset: 8, averageOffset: 10, maxOffset: 12 },
      rain: { minMultiplier: 0.55, averageMultiplier: 0.65, maxMultiplier: 0.8 },
      dailyRain: { minMultiplier: 0.55, averageMultiplier: 0.65, maxMultiplier: 0.85 },
      windSpeed: { minMultiplier: 0.8, averageMultiplier: 0.85, maxMultiplier: 0.95 },
      traits: { precipitationChanceOffset: -0.12, stormChanceOffset: 0.04, fogChanceOffset: -0.08, dayNightAmplitudeMultiplier: 1.15 }
    }
  },
  {
    id: "season-autumn",
    name: "Automne",
    icon: "🍂",
    start: { monthId: "month-2", dayOfMonth: 1 },
    end: { monthId: "month-2", dayOfMonth: 15 },
    weatherModifier: {
      temperature: { minOffset: -1, averageOffset: -2, maxOffset: -3 },
      rain: { minMultiplier: 1.25, averageMultiplier: 1.35, maxMultiplier: 1.45 },
      dailyRain: { minMultiplier: 1.25, averageMultiplier: 1.4, maxMultiplier: 1.5 },
      windSpeed: { minMultiplier: 1.1, averageMultiplier: 1.2, maxMultiplier: 1.25 },
      traits: { precipitationChanceOffset: 0.12, stormChanceOffset: 0.05, fogChanceOffset: 0.08, windVariabilityMultiplier: 1.15 }
    }
  },
  {
    id: "season-winter",
    name: "Hiver",
    icon: "❄️",
    start: { monthId: "month-2", dayOfMonth: 16 },
    end: { monthId: "month-2", dayOfMonth: 30 },
    weatherModifier: {
      temperature: { minOffset: -8, averageOffset: -9, maxOffset: -10 },
      rain: { minMultiplier: 0.9, averageMultiplier: 0.95, maxMultiplier: 1 },
      dailyRain: { minMultiplier: 0.9, averageMultiplier: 1, maxMultiplier: 1.05 },
      windSpeed: { minMultiplier: 1.05, averageMultiplier: 1.15, maxMultiplier: 1.25 },
      traits: { precipitationChanceOffset: 0.02, stormChanceOffset: 0.02, fogChanceOffset: 0.05, dayNightAmplitudeMultiplier: 0.8 }
    }
  }
];

const defaultProject: CalendarProject = {
  schemaVersion: 1,
  appVersion: "0.1.0",
  id: "default-calendar",
  name: "Calendrier de campagne",
  locale: "fr",
  units: { temperature: "celsius", windSpeed: "kmh", rain: "mm" },
  currentTime: { absoluteDay: 0, hour: 8, minute: 0 },
  calendarSystem: {
    eraName: "AR",
    startYear: 1000,
    firstWeekdayOffset: 0,
    months: [
      { id: "month-1", name: "Mois 1", order: 1, days: 30 },
      { id: "month-2", name: "Mois 2", order: 2, days: 30 }
    ],
    weekdays: [
      { id: "day-1", name: "Jour 1", order: 1 },
      { id: "day-2", name: "Jour 2", order: 2 },
      { id: "day-3", name: "Jour 3", order: 3 },
      { id: "day-4", name: "Jour 4", order: 4 },
      { id: "day-5", name: "Jour 5", order: 5 },
      { id: "day-6", name: "Jour 6", order: 6 },
      { id: "day-7", name: "Jour 7", order: 7 }
    ]
  },
  events: [],
  seasons: createDefaultSeasons(),
  moons: createDefaultMoonSystem("fr"),
  moonEvents: [],
  dayNotes: [],
  weatherSettings: { seed: DEFAULT_WEATHER_SEED },
  weatherEvents: [],
  weatherOverrides: [],
  weatherBiome: { currentBiomeId: DEFAULT_WEATHER_BIOME_ID },
  sceneWeatherProfiles: structuredClone(DEFAULT_SCENE_WEATHER_PROFILES),
  adventureContext: createDefaultAdventureContext(),
  eventDisplaySettings: structuredClone(DEFAULT_EVENT_DISPLAY_SETTINGS),
  eventDisplayHistory: structuredClone(DEFAULT_EVENT_DISPLAY_HISTORY),
  manualPublications: structuredClone(DEFAULT_MANUAL_PUBLICATIONS),
  uiSettings: { activeTab: "today", compactMode: true, defaultMoonSystemInitialized: true, playerView: structuredClone(DEFAULT_PLAYER_VIEW_SETTINGS) }
};

export const createDefaultCalendarProject = (): CalendarProject => structuredClone(defaultProject);

const safeStorage = (): Storage | undefined => {
  if (typeof localStorage === "undefined") return undefined;
  return localStorage;
};

export const loadCalendarProject = (storageKey = STORAGE_KEY): CalendarProject => {
  const storage = safeStorage();
  if (!storage) return createDefaultCalendarProject();

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return createDefaultCalendarProject();
    const parsed = JSON.parse(raw) as unknown;
    const sanitized = sanitizeCalendarProject(parsed);
    if (!sanitized.ok) return createDefaultCalendarProject();
    const ensured = ensureAdventureContext(ensureDefaultSceneWeatherProfiles(ensureDefaultMoonSystem(sanitized.project)));
    if (JSON.stringify(ensured) !== JSON.stringify(sanitized.project)) {
      storage.setItem(storageKey, JSON.stringify(ensured));
      notifyCalendarProjectUpdated(storageKey);
    }
    return ensured;
  } catch {
    return createDefaultCalendarProject();
  }
};

export const saveCalendarProject = (project: CalendarProject, storageKey = STORAGE_KEY): { ok: true } | { ok: false; error: string } => {
  const sanitized = sanitizeCalendarProject(project);
  if (!sanitized.ok) return { ok: false, error: sanitized.error };

  const storage = safeStorage();
  if (!storage) return { ok: false, error: "localStorage unavailable" };

  try {
    storage.setItem(storageKey, JSON.stringify(sanitized.project));
    notifyCalendarProjectUpdated(storageKey);
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to persist project." };
  }
};

export const resetCalendarProject = (storageKey = STORAGE_KEY): CalendarProject => {
  const project = createDefaultCalendarProject();
  project.weatherSettings = { ...project.weatherSettings, seed: createWeatherSeed() };
  const storage = safeStorage();
  if (storage) {
    storage.removeItem(storageKey);
    storage.setItem(storageKey, JSON.stringify(project));
    notifyCalendarProjectUpdated(storageKey);
  }
  return project;
};

export const CALENDAR_STORAGE_KEY = STORAGE_KEY;