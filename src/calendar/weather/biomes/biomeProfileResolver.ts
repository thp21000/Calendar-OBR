import { absoluteDayToCalendarDate } from "../../dateEngine";
import { getSeasonForDate } from "../../seasonsLogic";
import { applySeasonWeatherModifier } from "../seasonModifiers";
import type { CalendarProject, InternalTime, WeatherState } from "../../../domain/types";
import { DEFAULT_WEATHER_BIOME_PROFILES } from "./biomeProfileDefaults";
import { DEFAULT_WEATHER_BIOME_ID, getWeatherBiomeDefinition } from "./biomeDefinitions";
import { normalizeWeatherBiomeProfile } from "./biomeProfileUtils";
import type { WeatherBiomeId, WeatherBiomeProfile, WeatherBiomeState, WeatherValueRange } from "./types";

const TRANSITION_STEP_MINUTES = 5;
const WEATHER_STATES: WeatherState[] = ["clear", "cloudy", "overcast", "fog", "lightRain", "heavyRain", "storm", "snow", "strongWind", "tempest"];
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const lerp = (from: number, to: number, progress: number): number => from + (to - from) * progress;

export const getAbsoluteMinutes = (time: Pick<InternalTime, "absoluteDay" | "hour"> & { minute?: number }): number =>
  Math.trunc(time.absoluteDay) * 1440 + Math.trunc(time.hour) * 60 + Math.trunc(time.minute ?? 0);

export const getWeatherBiomeState = (project: CalendarProject): WeatherBiomeState =>
  project.weatherBiome ?? { currentBiomeId: DEFAULT_WEATHER_BIOME_ID };

export const getCurrentWeatherBiomeDefinition = (project: CalendarProject) =>
  getWeatherBiomeDefinition(getWeatherBiomeState(project).currentBiomeId);

export const getWeatherBiomeTransitionProgress = (project: CalendarProject, time: Pick<InternalTime, "absoluteDay" | "hour"> & { minute?: number }): number => {
  const state = getWeatherBiomeState(project);
  if (!state.previousBiomeId || typeof state.biomeChangedAtMinutes !== "number") return 1;
  const duration = Math.max(1, state.transitionDurationMinutes ?? getWeatherBiomeDefinition(state.currentBiomeId).transitionDurationMinutes);
  const elapsedMinutes = Math.max(0, getAbsoluteMinutes(time) - state.biomeChangedAtMinutes);
  const steppedElapsed = Math.floor(elapsedMinutes / TRANSITION_STEP_MINUTES) * TRANSITION_STEP_MINUTES;
  return clamp(steppedElapsed / duration, 0, 1);
};

const getBiomeProfile = (project: CalendarProject, biomeId: WeatherBiomeId): WeatherBiomeProfile =>
  normalizeWeatherBiomeProfile(project.weatherBiomeProfiles?.[biomeId] ?? DEFAULT_WEATHER_BIOME_PROFILES[biomeId] ?? DEFAULT_WEATHER_BIOME_PROFILES[DEFAULT_WEATHER_BIOME_ID]);

const interpolateRange = (from: WeatherValueRange, to: WeatherValueRange, progress: number): WeatherValueRange => ({
  min: lerp(from.min, to.min, progress),
  average: lerp(from.average, to.average, progress),
  max: lerp(from.max, to.max, progress)
});

const interpolateProfiles = (from: WeatherBiomeProfile, to: WeatherBiomeProfile, progress: number): WeatherBiomeProfile => {
  const stateWeights: WeatherBiomeProfile["stateWeights"] = {};
  for (const state of WEATHER_STATES) {
    const weight = lerp(from.stateWeights[state] ?? 1, to.stateWeights[state] ?? 1, progress);
    if (weight !== 1) stateWeights[state] = weight;
  }

  return normalizeWeatherBiomeProfile({
    temperature: interpolateRange(from.temperature, to.temperature, progress),
    rain: interpolateRange(from.rain, to.rain, progress),
    dailyRain: interpolateRange(from.dailyRain, to.dailyRain, progress),
    windSpeed: interpolateRange(from.windSpeed, to.windSpeed, progress),
    traits: {
      stability: lerp(from.traits.stability, to.traits.stability, progress),
      precipitationChance: lerp(from.traits.precipitationChance, to.traits.precipitationChance, progress),
      fogChance: lerp(from.traits.fogChance, to.traits.fogChance, progress),
      stormChance: lerp(from.traits.stormChance, to.traits.stormChance, progress),
      dayNightAmplitude: lerp(from.traits.dayNightAmplitude, to.traits.dayNightAmplitude, progress),
      windVariability: lerp(from.traits.windVariability, to.traits.windVariability, progress)
    },
    stateWeights
  });
};

export const resolveBiomeWeatherProfile = (project: CalendarProject, time: Pick<InternalTime, "absoluteDay" | "hour"> & { minute?: number }): WeatherBiomeProfile => {
  const state = getWeatherBiomeState(project);
  const current = getBiomeProfile(project, state.currentBiomeId);
  const progress = getWeatherBiomeTransitionProgress(project, time);
  if (progress >= 1 || !state.previousBiomeId) return current;
  return interpolateProfiles(getBiomeProfile(project, state.previousBiomeId), current, progress);
};

export const resolveEffectiveWeatherProfile = (project: CalendarProject, time: Pick<InternalTime, "absoluteDay" | "hour"> & { minute?: number }): WeatherBiomeProfile => {
  const biomeProfile = resolveBiomeWeatherProfile(project, time);
  const date = absoluteDayToCalendarDate({ absoluteDay: time.absoluteDay, hour: time.hour, minute: time.minute ?? 0 }, project.calendarSystem);
  const season = getSeasonForDate(project, date);
  return applySeasonWeatherModifier(biomeProfile, season?.weatherModifier);
};
