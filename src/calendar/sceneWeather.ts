import type { CalendarProject, SceneWeatherProfile, WeatherOverride, WeatherSnapshot } from "../domain/types";
import { getCurrentWeather } from "./weatherLogic";
import { toAbsoluteMinutes } from "./weatherEventsLogic";
import { changeWeatherBiome } from "./weather/biomes";

export const DEFAULT_SCENE_WEATHER_DURATION_MINUTES = 120;
export const MIN_SCENE_WEATHER_DURATION_MINUTES = 5;
export const DEFAULT_SCENE_WEATHER_TRANSITION_MINUTES = 15;
export const MIN_SCENE_WEATHER_TRANSITION_MINUTES = 0;

const hasNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const clampDuration = (value: number | undefined): number => Math.max(MIN_SCENE_WEATHER_DURATION_MINUTES, Math.trunc(hasNumber(value) ? value : DEFAULT_SCENE_WEATHER_DURATION_MINUTES));
const clampTransition = (value: number | undefined): number => Math.max(MIN_SCENE_WEATHER_TRANSITION_MINUTES, Math.trunc(hasNumber(value) ? value : DEFAULT_SCENE_WEATHER_TRANSITION_MINUTES));

export type ApplySceneWeatherProfileOptions = {
  sceneId?: string;
  sceneName?: string;
  currentWeather?: WeatherSnapshot;
  nowAbsoluteMinutes?: number;
};

export const createDefaultSceneWeatherProfile = (project: CalendarProject): SceneWeatherProfile => ({
  id: `scene-weather-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: project.locale === "fr" ? "Nouvelle météo de scène" : "New scene weather",
  icon: "🎬",
  enabled: true,
  durationMinutes: DEFAULT_SCENE_WEATHER_DURATION_MINUTES,
  transitionMinutes: DEFAULT_SCENE_WEATHER_TRANSITION_MINUTES,
  override: {}
});

export const isSceneWeatherProfileEmpty = (profile: SceneWeatherProfile): boolean => {
  const override = profile.override ?? {};
  return !profile.forceBiomeId && Object.values(override).every((value) => value === undefined || value === "");
};

const cleanSceneWeatherOverride = (override: SceneWeatherProfile["override"]): SceneWeatherProfile["override"] => {
  const next: SceneWeatherProfile["override"] = {};
  for (const key of ["temperature", "dailyMinTemperature", "dailyMaxTemperature", "rain", "dailyRainTotal", "windSpeed"] as const) {
    const value = override[key];
    if (hasNumber(value)) next[key] = key === "rain" || key === "dailyRainTotal" || key === "windSpeed" ? Math.max(0, value) : value;
  }
  if (override.windDirection) next.windDirection = override.windDirection;
  if (override.state) next.state = override.state;
  if (override.dominantState) next.dominantState = override.dominantState;
  if (override.trendKind) next.trendKind = override.trendKind;
  if (typeof override.gmNote === "string" && override.gmNote.trim().length > 0) next.gmNote = override.gmNote;
  return next;
};

const buildTransitionFrom = (weather: WeatherSnapshot | undefined): WeatherOverride["transitionFrom"] => weather ? {
  temperature: weather.temperature,
  dailyMinTemperature: weather.dailyMinTemperature,
  dailyMaxTemperature: weather.dailyMaxTemperature,
  rain: weather.rain,
  dailyRainTotal: weather.dailyRainTotal,
  windSpeed: weather.windSpeed
} : undefined;

export const applySceneWeatherProfile = (
  project: CalendarProject,
  profile: SceneWeatherProfile,
  options: ApplySceneWeatherProfileOptions = {}
): CalendarProject => {
  if (!profile.enabled || isSceneWeatherProfileEmpty(profile)) return project;

  const nowAbsoluteMinutes = options.nowAbsoluteMinutes ?? toAbsoluteMinutes(project.currentTime);
  const startAbsoluteDay = Math.floor(nowAbsoluteMinutes / 1440);
  const startMinute = ((nowAbsoluteMinutes % 1440) + 1440) % 1440;
  const durationMinutes = clampDuration(profile.durationMinutes);
  const transitionMinutes = clampTransition(profile.transitionMinutes);
  const cleanedOverride = cleanSceneWeatherOverride(profile.override ?? {});

  let nextProject = profile.forceBiomeId ? changeWeatherBiome(project, profile.forceBiomeId, nowAbsoluteMinutes) : project;
  const transitionFrom = buildTransitionFrom(options.currentWeather ?? getCurrentWeather(project));
  const existing = (nextProject.weatherOverrides ?? []).filter((override) => !(override.source === "sceneWeather" && (!options.sceneId || override.sceneId === options.sceneId)));
  const overrides: WeatherOverride[] = [];
  let remaining = durationMinutes;
  let day = startAbsoluteDay;
  let minute = startMinute;
  let index = 0;

  while (remaining > 0) {
    const chunk = Math.min(remaining, 1440 - minute);
    const override: WeatherOverride = {
      id: `scene-weather-override-${profile.id}-${nowAbsoluteMinutes}-${index}`,
      absoluteDay: day,
      startMinuteOfDay: minute,
      endMinuteOfDay: minute + chunk,
      label: `${profile.icon ?? "🎬"} ${profile.name}`.trim(),
      ...cleanedOverride,
      source: "sceneWeather",
      sourceId: profile.id,
      sceneId: options.sceneId,
      sceneName: options.sceneName,
      transitionStartAtMinutes: nowAbsoluteMinutes,
      transitionDurationMinutes: transitionMinutes,
      transitionFrom
    };
    overrides.push(override);
    remaining -= chunk;
    day += 1;
    minute = 0;
    index += 1;
  }

  return { ...nextProject, weatherOverrides: [...existing, ...overrides] };
};

export const disableSceneWeatherForScene = (project: CalendarProject, sceneId?: string): CalendarProject => ({
  ...project,
  weatherOverrides: (project.weatherOverrides ?? []).filter((override) => !(override.source === "sceneWeather" && (!sceneId || override.sceneId === sceneId)))
});

export const hasActiveSceneWeatherOverride = (project: CalendarProject, profileId: string | undefined, currentAbsoluteMinutes: number, sceneId?: string): boolean =>
  (project.weatherOverrides ?? []).some((override) => {
    if (override.source !== "sceneWeather") return false;
    if (profileId && override.sourceId !== profileId) return false;
    if (sceneId && override.sceneId !== sceneId) return false;
    const startMinute = typeof override.startMinuteOfDay === "number" ? override.startMinuteOfDay : 0;
    const endMinute = typeof override.endMinuteOfDay === "number" ? override.endMinuteOfDay : 1440;
    const start = override.absoluteDay * 1440 + startMinute;
    const end = override.absoluteDay * 1440 + endMinute;
    return currentAbsoluteMinutes >= start && currentAbsoluteMinutes < end;
  });

export const cleanupExpiredSceneWeatherOverrides = (project: CalendarProject, currentAbsoluteMinutes: number): CalendarProject => ({
  ...project,
  weatherOverrides: (project.weatherOverrides ?? []).filter((override) => {
    if (override.source !== "sceneWeather") return true;
    const endMinute = typeof override.endMinuteOfDay === "number" ? override.endMinuteOfDay : 1440;
    return override.absoluteDay * 1440 + endMinute > currentAbsoluteMinutes;
  })
});
