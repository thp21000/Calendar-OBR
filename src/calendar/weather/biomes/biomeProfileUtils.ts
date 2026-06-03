import type { WeatherBiomeProfile, WeatherValueRange } from "./types";

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const clamp01 = (value: number): number => clamp(value, 0, 1);
const safe = (value: unknown, fallback = 0): number => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

const normalizeTemperatureRange = (range: WeatherValueRange): WeatherValueRange => {
  const min = safe(range.min);
  const max = Math.max(min, safe(range.max, min));
  const average = clamp(safe(range.average, min), min, max);
  return { min, average, max };
};

const normalizePositiveRange = (range: WeatherValueRange): WeatherValueRange => {
  const min = Math.max(0, safe(range.min));
  const max = Math.max(min, Math.max(0, safe(range.max, min)));
  const average = clamp(Math.max(0, safe(range.average, min)), min, max);
  return { min, average, max };
};

export const normalizeWeatherBiomeProfile = (profile: WeatherBiomeProfile): WeatherBiomeProfile => ({
  temperature: normalizeTemperatureRange(profile.temperature),
  rain: normalizePositiveRange(profile.rain),
  dailyRain: normalizePositiveRange(profile.dailyRain),
  windSpeed: normalizePositiveRange(profile.windSpeed),
  traits: {
    stability: clamp01(safe(profile.traits.stability, 0.5)),
    precipitationChance: clamp01(safe(profile.traits.precipitationChance, 0.4)),
    fogChance: clamp01(safe(profile.traits.fogChance, 0.2)),
    stormChance: clamp01(safe(profile.traits.stormChance, 0.15)),
    dayNightAmplitude: Math.max(0, safe(profile.traits.dayNightAmplitude, 8)),
    windVariability: Math.max(0, safe(profile.traits.windVariability, 0.4))
  },
  stateWeights: Object.fromEntries(
    Object.entries(profile.stateWeights ?? {}).filter(([, value]) => typeof value === "number" && Number.isFinite(value) && value >= 0)
  ) as WeatherBiomeProfile["stateWeights"]
});
