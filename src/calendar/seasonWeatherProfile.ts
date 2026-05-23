import type { SeasonWeatherProfile } from "../domain/types";

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const safe = (value: number, fallback = 0): number => (Number.isFinite(value) ? value : fallback);
const positiveRange = (value: { min: number; max: number; average: number }) => {
  const min = Math.max(0, safe(value.min));
  const max = Math.max(min, Math.max(0, safe(value.max, min)));
  const average = Math.min(max, Math.max(min, Math.max(0, safe(value.average, min))));
  return { min, max, average };
};
const temperatureRange = (value: { min: number; max: number; average: number }) => {
  const min = safe(value.min);
  const max = Math.max(min, safe(value.max, min));
  const average = Math.min(max, Math.max(min, safe(value.average, min)));
  return { min, max, average };
};
const maybeTrait = (value: unknown): number | undefined => (typeof value === "number" && Number.isFinite(value) ? clamp01(value) : undefined);

export const normalizeSeasonWeatherProfile = (profile: SeasonWeatherProfile): SeasonWeatherProfile => ({
  temperature: temperatureRange(profile.temperature),
  windSpeed: positiveRange(profile.windSpeed),
  rain: positiveRange(profile.rain),
  stability: maybeTrait(profile.stability),
  precipitationChance: maybeTrait(profile.precipitationChance),
  stormChance: maybeTrait(profile.stormChance),
  fogChance: maybeTrait(profile.fogChance),
  temperatureSwing: maybeTrait(profile.temperatureSwing),
  windVariability: maybeTrait(profile.windVariability)
});

export type SeasonWeatherTraits = Required<Pick<SeasonWeatherProfile, "stability" | "precipitationChance" | "stormChance" | "fogChance" | "temperatureSwing" | "windVariability">>;

export const deriveSeasonWeatherTraits = (profile: SeasonWeatherProfile): SeasonWeatherTraits => {
  const normalized = normalizeSeasonWeatherProfile(profile);
  const tempSpread = normalized.temperature.max - normalized.temperature.min;
  const windSpread = normalized.windSpeed.max - normalized.windSpeed.min;
  const rainSpread = normalized.rain.max - normalized.rain.min;

  // Simple readable heuristics from seasonal min/avg/max ranges.
  const precipitationChance = normalized.precipitationChance ?? clamp01(normalized.rain.average / Math.max(1, normalized.rain.max || 10));
  const stormChance = normalized.stormChance ?? clamp01(((normalized.rain.max / 12) + (normalized.windSpeed.max / 80)) / 2);
  const fogChance = normalized.fogChance ?? clamp01((normalized.windSpeed.average <= 10 ? 0.45 : 0.15) + (normalized.rain.average > 0 ? 0.25 : 0));
  const temperatureSwing = normalized.temperatureSwing ?? clamp01(tempSpread / 30);
  const windVariability = normalized.windVariability ?? clamp01(windSpread / 50);
  const instability = clamp01(((tempSpread / 35) + (windSpread / 60) + (rainSpread / 12)) / 3);
  const stability = normalized.stability ?? clamp01(1 - instability);

  return { stability, precipitationChance, stormChance, fogChance, temperatureSwing, windVariability };
};
