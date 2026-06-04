import type { CalendarProject, WeatherOverride } from "../domain/types";

const FIVE_MINUTES = 5;
const MINUTES_PER_DAY = 1440;

const hasNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const round1 = (value: number): number => Math.round(value * 10) / 10;
const clampNonNegative = (value: number): number => Math.max(0, value);

const hashSeed = (input: string): number => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const seeded = (seed: string, salt: string): number => hashSeed(`${seed}|${salt}`) / 4294967295;
const centered = (seed: string, salt: string): number => (seeded(seed, salt) - 0.5) * 2;

export const getSceneWeatherVariationRatio = (absoluteDay: number, hour: number, minute = 0): number => {
  const absoluteMinute = Math.trunc(absoluteDay) * MINUTES_PER_DAY + Math.trunc(hour) * 60 + Math.trunc(minute);
  return Math.floor(absoluteMinute / FIVE_MINUTES);
};

export const getSceneWeatherVariationSeed = (
  project: CalendarProject,
  override: WeatherOverride,
  absoluteDay: number,
  hour: number,
  minute = 0
): string => {
  const baseSeed = project.weatherSettings.seed || project.id;
  const fiveMinuteStep = getSceneWeatherVariationRatio(absoluteDay, hour, minute);
  return [baseSeed, project.id, "sceneWeather", override.sourceId ?? "profile", override.sceneId ?? "scene", fiveMinuteStep].join("|");
};

const getTransitionMultiplier = (override: WeatherOverride, absoluteDay: number, hour: number, minute = 0): number => {
  if (!hasNumber(override.transitionStartAtMinutes) || !hasNumber(override.transitionDurationMinutes)) return 1;
  if (override.transitionDurationMinutes <= 0) return 1;
  const absoluteMinute = Math.trunc(absoluteDay) * MINUTES_PER_DAY + Math.trunc(hour) * 60 + Math.trunc(minute);
  return Math.max(0, Math.min(1, (absoluteMinute - override.transitionStartAtMinutes) / override.transitionDurationMinutes));
};

const varyAdditive = (value: number | undefined, seed: string, salt: string, amplitude: number, multiplier: number): number | undefined =>
  hasNumber(value) ? round1(value + centered(seed, salt) * amplitude * multiplier) : undefined;

const varyPercent = (value: number | undefined, seed: string, salt: string, ratio: number, multiplier: number): number | undefined => {
  if (!hasNumber(value)) return undefined;
  if (value === 0) return 0;
  return round1(clampNonNegative(value * (1 + centered(seed, salt) * ratio * multiplier)));
};

export const applySceneWeatherMetricVariation = (
  project: CalendarProject,
  override: WeatherOverride,
  absoluteDay: number,
  hour: number,
  minute = 0
): WeatherOverride => {
  if (override.source !== "sceneWeather") return override;

  const multiplier = getTransitionMultiplier(override, absoluteDay, hour, minute);
  if (multiplier <= 0) return override;

  const seed = getSceneWeatherVariationSeed(project, override, absoluteDay, hour, minute);
  const next: WeatherOverride = { ...override };

  const temperature = varyAdditive(override.temperature, seed, "temperature", 1.5, multiplier);
  const dailyMinTemperature = varyAdditive(override.dailyMinTemperature, seed, "dailyMinTemperature", 1, multiplier);
  const dailyMaxTemperature = varyAdditive(override.dailyMaxTemperature, seed, "dailyMaxTemperature", 1, multiplier);
  const rain = varyPercent(override.rain, seed, "rain", 0.2, multiplier);
  const dailyRainTotal = varyPercent(override.dailyRainTotal, seed, "dailyRainTotal", 0.15, multiplier);
  const windSpeed = varyPercent(override.windSpeed, seed, "windSpeed", 0.15, multiplier);

  if (temperature !== undefined) next.temperature = temperature;
  if (dailyMinTemperature !== undefined) next.dailyMinTemperature = dailyMinTemperature;
  if (dailyMaxTemperature !== undefined) next.dailyMaxTemperature = dailyMaxTemperature;
  if (hasNumber(next.dailyMinTemperature) && hasNumber(next.dailyMaxTemperature) && next.dailyMinTemperature > next.dailyMaxTemperature) {
    const low = Math.min(next.dailyMinTemperature, next.dailyMaxTemperature);
    const high = Math.max(next.dailyMinTemperature, next.dailyMaxTemperature);
    next.dailyMinTemperature = low;
    next.dailyMaxTemperature = high;
  }
  if (rain !== undefined) next.rain = rain;
  if (dailyRainTotal !== undefined) next.dailyRainTotal = dailyRainTotal;
  if (windSpeed !== undefined) next.windSpeed = windSpeed;

  return next;
};
