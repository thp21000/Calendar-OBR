import type { DailyWeatherSummary } from "../../weatherDaily";
import type { CalendarProject, InternalTime, WeatherSnapshot, WeatherState } from "../../../domain/types";
import { DEFAULT_WEATHER_BIOME_ID, getWeatherBiomeDefinition } from "./biomeDefinitions";
import type { WeatherBiomeId, WeatherBiomeRules, WeatherBiomeState } from "./types";

const TRANSITION_STEP_MINUTES = 5;
const round1 = (value: number): number => Math.round(value * 10) / 10;
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const lerp = (from: number, to: number, progress: number): number => from + (to - from) * progress;

const WEATHER_STATES: WeatherState[] = ["clear", "cloudy", "overcast", "fog", "lightRain", "heavyRain", "storm", "snow", "strongWind", "tempest"];

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

const getEffectiveBiomeRules = (project: CalendarProject, time: Pick<InternalTime, "absoluteDay" | "hour"> & { minute?: number }): WeatherBiomeRules => {
  const state = getWeatherBiomeState(project);
  const current = getWeatherBiomeDefinition(state.currentBiomeId).rules;
  const progress = getWeatherBiomeTransitionProgress(project, time);
  if (progress >= 1 || !state.previousBiomeId) return current;

  const previous = getWeatherBiomeDefinition(state.previousBiomeId).rules;
  const stateWeights: WeatherBiomeRules["stateWeights"] = {};
  for (const weatherState of WEATHER_STATES) {
    const previousWeight = previous.stateWeights?.[weatherState] ?? 1;
    const currentWeight = current.stateWeights?.[weatherState] ?? 1;
    const value = lerp(previousWeight, currentWeight, progress);
    if (value !== 1) stateWeights[weatherState] = value;
  }

  return {
    temperatureOffset: lerp(previous.temperatureOffset ?? 0, current.temperatureOffset ?? 0, progress),
    rainMultiplier: lerp(previous.rainMultiplier ?? 1, current.rainMultiplier ?? 1, progress),
    windMultiplier: lerp(previous.windMultiplier ?? 1, current.windMultiplier ?? 1, progress),
    stateWeights
  };
};

const adjustStateForBiome = (project: CalendarProject, state: WeatherState | undefined, input: { temperature: number; rain: number; windSpeed: number; rules: WeatherBiomeRules }): WeatherState | undefined => {
  if (!state) return state;
  const biomeId = getWeatherBiomeState(project).currentBiomeId;
  const weights = input.rules.stateWeights ?? {};

  if (biomeId === "arctic" && input.temperature <= 0 && input.rain > 0) return "snow";
  if (biomeId === "desert" && state === "heavyRain") return input.rain > 1 ? "lightRain" : "cloudy";
  if ((biomeId === "underground" || biomeId === "cave") && (state === "storm" || state === "tempest")) return biomeId === "cave" ? "fog" : "overcast";
  if (biomeId === "hell" && state === "snow") return input.windSpeed > 45 ? "strongWind" : "clear";
  if (biomeId === "sea" && input.windSpeed >= 60) return input.rain >= 6 ? "tempest" : "strongWind";

  const currentWeight = weights[state] ?? 1;
  if (currentWeight >= 0.5) return state;
  if (weights.fog && weights.fog > 1.2) return "fog";
  if (weights.clear && weights.clear > 1.2) return "clear";
  if (weights.strongWind && weights.strongWind > 1.2) return "strongWind";
  return state;
};

export const applyBiomeToWeatherSnapshot = <T extends WeatherSnapshot>(project: CalendarProject, weather: T, time: Pick<InternalTime, "absoluteDay" | "hour"> & { minute?: number }): T => {
  const rules = getEffectiveBiomeRules(project, time);
  const temperature = round1(weather.temperature + (rules.temperatureOffset ?? 0));
  const rain = round1(Math.max(0, weather.rain * (rules.rainMultiplier ?? 1)));
  const windSpeed = round1(Math.max(0, weather.windSpeed * (rules.windMultiplier ?? 1)));
  const dailyMinTemperature = typeof weather.dailyMinTemperature === "number" ? round1(weather.dailyMinTemperature + (rules.temperatureOffset ?? 0)) : undefined;
  const dailyMaxTemperature = typeof weather.dailyMaxTemperature === "number" ? round1(weather.dailyMaxTemperature + (rules.temperatureOffset ?? 0)) : undefined;
  const dailyRainTotal = typeof weather.dailyRainTotal === "number" ? round1(Math.max(0, weather.dailyRainTotal * (rules.rainMultiplier ?? 1))) : undefined;
  const state = adjustStateForBiome(project, weather.state, { temperature, rain, windSpeed, rules });
  const dominantState = adjustStateForBiome(project, weather.dominantState, { temperature, rain: dailyRainTotal ?? rain, windSpeed, rules });

  return {
    ...weather,
    temperature,
    rain,
    windSpeed,
    state,
    dailyMinTemperature,
    dailyMaxTemperature,
    dailyRainTotal,
    dominantState
  };
};

export const applyBiomeToDailyWeatherSummary = (project: CalendarProject, summary: DailyWeatherSummary, time: Pick<InternalTime, "absoluteDay" | "hour"> & { minute?: number }): DailyWeatherSummary => {
  const rules = getEffectiveBiomeRules(project, time);
  const minTemperature = round1(summary.minTemperature + (rules.temperatureOffset ?? 0));
  const maxTemperature = round1(summary.maxTemperature + (rules.temperatureOffset ?? 0));
  const averageTemperature = round1(summary.averageTemperature + (rules.temperatureOffset ?? 0));
  const rainTotal24h = round1(Math.max(0, summary.rainTotal24h * (rules.rainMultiplier ?? 1)));
  const maxWindSpeed = round1(Math.max(0, summary.maxWindSpeed * (rules.windMultiplier ?? 1)));
  const dominantState = adjustStateForBiome(project, summary.dominantState, { temperature: averageTemperature, rain: rainTotal24h, windSpeed: maxWindSpeed, rules }) ?? summary.dominantState;
  return { ...summary, minTemperature, maxTemperature, averageTemperature, rainTotal24h, maxWindSpeed, dominantState };
};

export const changeWeatherBiome = (project: CalendarProject, nextBiomeId: WeatherBiomeId, changedAtMinutes: number): CalendarProject => {
  const currentState = getWeatherBiomeState(project);
  if (currentState.currentBiomeId === nextBiomeId) return project;
  const definition = getWeatherBiomeDefinition(nextBiomeId);
  return {
    ...project,
    weatherBiome: {
      currentBiomeId: nextBiomeId,
      previousBiomeId: currentState.currentBiomeId,
      biomeChangedAtMinutes: Math.trunc(changedAtMinutes),
      transitionDurationMinutes: definition.transitionDurationMinutes
    }
  };
};
