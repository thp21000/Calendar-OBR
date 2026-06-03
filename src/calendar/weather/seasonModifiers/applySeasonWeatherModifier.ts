import { normalizeWeatherBiomeProfile } from "../biomes/biomeProfileUtils";
import type { WeatherBiomeProfile, WeatherValueRange } from "../biomes/types";
import type { SeasonWeatherModifier } from "./types";

const safeMultiplier = (value: number | undefined): number => (typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 1);
const safeOffset = (value: number | undefined): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

const applyOffsets = (
  range: WeatherValueRange,
  modifier: { minOffset?: number; averageOffset?: number; maxOffset?: number } | undefined
): WeatherValueRange => ({
  min: range.min + safeOffset(modifier?.minOffset),
  average: range.average + safeOffset(modifier?.averageOffset),
  max: range.max + safeOffset(modifier?.maxOffset)
});

const applyMultipliers = (
  range: WeatherValueRange,
  modifier: { minMultiplier?: number; averageMultiplier?: number; maxMultiplier?: number } | undefined
): WeatherValueRange => ({
  min: range.min * safeMultiplier(modifier?.minMultiplier),
  average: range.average * safeMultiplier(modifier?.averageMultiplier),
  max: range.max * safeMultiplier(modifier?.maxMultiplier)
});

export const applySeasonWeatherModifier = (
  profile: WeatherBiomeProfile,
  modifier: SeasonWeatherModifier | undefined
): WeatherBiomeProfile => {
  const next: WeatherBiomeProfile = {
    temperature: applyOffsets(profile.temperature, modifier?.temperature),
    rain: applyMultipliers(profile.rain, modifier?.rain),
    dailyRain: applyMultipliers(profile.dailyRain, modifier?.dailyRain),
    windSpeed: applyMultipliers(profile.windSpeed, modifier?.windSpeed),
    traits: {
      stability: profile.traits.stability + safeOffset(modifier?.traits?.stabilityOffset),
      precipitationChance: profile.traits.precipitationChance + safeOffset(modifier?.traits?.precipitationChanceOffset),
      fogChance: profile.traits.fogChance + safeOffset(modifier?.traits?.fogChanceOffset),
      stormChance: profile.traits.stormChance + safeOffset(modifier?.traits?.stormChanceOffset),
      dayNightAmplitude: profile.traits.dayNightAmplitude * safeMultiplier(modifier?.traits?.dayNightAmplitudeMultiplier),
      windVariability: profile.traits.windVariability * safeMultiplier(modifier?.traits?.windVariabilityMultiplier)
    },
    stateWeights: { ...profile.stateWeights }
  };

  for (const [state, weight] of Object.entries(modifier?.stateWeights ?? {})) {
    if (typeof weight !== "number" || !Number.isFinite(weight)) continue;
    next.stateWeights[state as keyof typeof next.stateWeights] = (next.stateWeights[state as keyof typeof next.stateWeights] ?? 1) * Math.max(0, weight);
  }

  return normalizeWeatherBiomeProfile(next);
};
