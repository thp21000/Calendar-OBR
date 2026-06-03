import type { DailyWeatherSummary } from "../../weatherDaily";
import type { CalendarProject, InternalTime, WeatherSnapshot, WeatherState } from "../../../domain/types";
import { getWeatherBiomeDefinition } from "./biomeDefinitions";
import { getCurrentWeatherBiomeDefinition, getWeatherBiomeState, resolveEffectiveWeatherProfile } from "./biomeProfileResolver";
import type { WeatherBiomeId, WeatherBiomeProfile } from "./types";

const strongestWeight = (weights: WeatherBiomeProfile["stateWeights"]): WeatherState | undefined => {
  let best: WeatherState | undefined;
  let bestWeight = 1;
  for (const [state, weight] of Object.entries(weights)) {
    if (typeof weight !== "number" || weight <= bestWeight) continue;
    best = state as WeatherState;
    bestWeight = weight;
  }
  return bestWeight > 1.2 ? best : undefined;
};

export const adjustStateForWeatherProfile = (
  state: WeatherState | undefined,
  input: { temperature: number; rain: number; windSpeed: number; profile: WeatherBiomeProfile }
): WeatherState | undefined => {
  if (!state) return state;
  const weights = input.profile.stateWeights ?? {};

  if (input.temperature <= 0 && input.rain > 0 && (weights.snow ?? 1) > 1.2) return "snow";
  if ((weights.heavyRain ?? 1) < 0.2 && state === "heavyRain") return input.rain > 1 ? "lightRain" : "cloudy";
  if ((weights.storm ?? 1) < 0.2 && (state === "storm" || state === "tempest")) return (weights.fog ?? 1) > 1.2 ? "fog" : "overcast";
  if ((weights.snow ?? 1) < 0.05 && state === "snow") return input.windSpeed > 45 ? "strongWind" : "clear";
  if ((weights.strongWind ?? 1) > 1.5 && input.windSpeed >= 60) return input.rain >= 6 ? "tempest" : "strongWind";

  const currentWeight = weights[state] ?? 1;
  if (currentWeight >= 0.5) return state;
  return strongestWeight(weights) ?? state;
};

/**
 * Compatibility helper for callers that still need to project an already-built
 * snapshot through the effective biome+saison profile. Core generation now uses
 * resolveEffectiveWeatherProfile before values are generated, so this helper is
 * not applied a second time in weatherLogic/weatherDaily.
 */
export const applyBiomeToWeatherSnapshot = <T extends WeatherSnapshot>(
  project: CalendarProject,
  weather: T,
  time: Pick<InternalTime, "absoluteDay" | "hour"> & { minute?: number }
): T => {
  const profile = resolveEffectiveWeatherProfile(project, time);
  const state = adjustStateForWeatherProfile(weather.state, { temperature: weather.temperature, rain: weather.rain, windSpeed: weather.windSpeed, profile });
  const dominantState = adjustStateForWeatherProfile(weather.dominantState, {
    temperature: weather.temperature,
    rain: weather.dailyRainTotal ?? weather.rain,
    windSpeed: weather.windSpeed,
    profile
  });
  return { ...weather, state, dominantState };
};

export const applyBiomeToDailyWeatherSummary = (
  project: CalendarProject,
  summary: DailyWeatherSummary,
  time: Pick<InternalTime, "absoluteDay" | "hour"> & { minute?: number }
): DailyWeatherSummary => {
  const profile = resolveEffectiveWeatherProfile(project, time);
  const dominantState = adjustStateForWeatherProfile(summary.dominantState, {
    temperature: summary.averageTemperature,
    rain: summary.rainTotal24h,
    windSpeed: summary.maxWindSpeed,
    profile
  }) ?? summary.dominantState;
  return { ...summary, dominantState };
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

export { getCurrentWeatherBiomeDefinition };