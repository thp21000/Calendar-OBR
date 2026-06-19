import { absoluteDayToCalendarDate } from "./dateEngine";
import { getSeasonForDate } from "./seasonsLogic";
import { getWeatherTrendForDay } from "./weatherTrend";
import { sampleCenteredMetric, sampleSkewedLowMetric } from "./weatherDistribution";
import { chooseDominantWeatherState, resolveGeneratedDominantState } from "./weatherAdvancedSettings";
import { WEATHER_STATES } from "./weatherStates";
import { applyWeatherOverrideToDailySummary, getWeatherOverrideForTime } from "./weatherOverrides";
import { adjustStateForWeatherProfile } from "./weather/biomes";
import { resolveEffectiveWeatherProfile } from "./weather/biomes/biomeProfileResolver";
import type { CalendarProject, WeatherState, WindDirection } from "../domain/types";

export type DailyWeatherSummary = {
  absoluteDay: number;
  minTemperature: number;
  maxTemperature: number;
  averageTemperature: number;
  heatPressure?: number;
  rainTotal24h: number;
  maxWindSpeed: number;
  dominantWindDirection: WindDirection;
  dominantState: WeatherState;
  trendKind?: import("../domain/types").WeatherTrendKind;
};

const WIND_DIRECTIONS: WindDirection[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const hashSeed = (input: string): number => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const seeded = (seed: string, salt: string): number => {
  const n = hashSeed(`${seed}|${salt}`);
  return n / 4294967295;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const clamp01 = (value: number): number => clamp(value, 0, 1);
const round1 = (value: number): number => Math.round(value * 10) / 10;

export const getHeatPressureForDay = (project: CalendarProject, absoluteDay: number): number => {
  let pressure = 0;
  let consecutiveHotDays = 0;
  const lookbackDays = 5;
  for (let offset = lookbackDays; offset >= 1; offset -= 1) {
    const previous = getDailyHeatPressureInputs(project, absoluteDay - offset);
    if (!previous) continue;
    const hotDay = clamp01((previous.maxTemperature - 27) / 9);
    const hotNight = clamp01((previous.minTemperature - 20) / 8);
    const isHot = hotDay > 0.25 || hotNight > 0.2;
    consecutiveHotDays = isHot ? consecutiveHotDays + 1 : 0;

    const heatGain = hotDay * 0.35 + hotNight * 0.3 + Math.min(0.25, consecutiveHotDays * 0.06);
    pressure = clamp01(pressure + heatGain);

    if (previous.rainTotal24h >= 18) pressure *= 0.25;
    else if (previous.rainTotal24h >= 8) pressure *= 0.55;
    if (previous.maxTemperature < 24) pressure *= 0.65;
  }
  return round1(clamp01(pressure));
};

const getDailyHeatPressureInputs = (
  project: CalendarProject,
  absoluteDay: number
): { minTemperature: number; maxTemperature: number; rainTotal24h: number } | undefined => {
  const date = absoluteDayToCalendarDate({ absoluteDay, hour: 12, minute: 0 }, project.calendarSystem);
  const season = getSeasonForDate(project, date);
  if (!season) return undefined;
  const profileTime =
    absoluteDay === project.currentTime.absoluteDay
      ? project.currentTime
      : { absoluteDay, hour: 12, minute: 0 };
  const profile = resolveEffectiveWeatherProfile(project, profileTime);
  const traits = profile.traits;
  const seedBase = project.weatherSettings.seed || project.id;
  const seed = `${seedBase}|daily|${project.id}|${season.id}|${absoluteDay}`;
  const trend = getWeatherTrendForDay(project, absoluteDay);
  const effectiveStability = clamp01(traits.stability + trend.stabilityModifier);
  const temperatureSpan = Math.max(0, profile.temperature.max - profile.temperature.min);
  const averageTemperature = sampleCenteredMetric({
    range: profile.temperature,
    rolls: [seeded(seed, "temp:avg:a"), seeded(seed, "temp:avg:b"), seeded(seed, "temp:avg:c")],
    extremeRoll: seeded(seed, "temp:extreme"),
    extremeDepthRoll: seeded(seed, "temp:extreme:depth"),
    stability: effectiveStability,
    trendKind: trend.kind,
    trendOffset: trend.temperatureOffset
  });
  const baseSwing = Math.min(temperatureSpan, traits.dayNightAmplitude);
  const swingNoise = (seeded(seed, "temp:swing") - 0.5) * 2;
  const swingFactor = 0.55 + (1 - effectiveStability) * 0.35 + Math.abs(swingNoise) * 0.25;
  const rawSwing = clamp(baseSwing * swingFactor, 0, temperatureSpan);
  const rainHit = seeded(seed, "rain:roll") < traits.precipitationChance;
  const rainIntensity = clamp01(traits.precipitationChance * 0.25 + clamp01(traits.stormChance + trend.stormChanceModifier) * 0.45 + (trend.kind === "wet" ? 0.18 : 0) + (trend.kind === "stormy" ? 0.28 : 0) + (trend.kind === "dry" ? -0.2 : 0));
  const rainTotal24h = rainHit
    ? sampleSkewedLowMetric({
        range: profile.dailyRain,
        roll: seeded(seed, "rain:intensity"),
        moderateRoll: seeded(seed, "rain:moderate"),
        extremeRoll: seeded(seed, "rain:extreme"),
        extremeDepthRoll: seeded(seed, "rain:extreme:depth"),
        stability: effectiveStability,
        intensity: rainIntensity,
        trendKind: trend.kind,
        multiplier: trend.rainMultiplier,
        allowZero: true
      })
    : Math.max(0, clamp(profile.dailyRain.min * trend.rainMultiplier, profile.dailyRain.min, profile.dailyRain.max));
  return {
    minTemperature: round1(clamp(averageTemperature - rawSwing / 2, profile.temperature.min, profile.temperature.max)),
    maxTemperature: round1(clamp(averageTemperature + rawSwing / 2, profile.temperature.min, profile.temperature.max)),
    rainTotal24h: round1(rainTotal24h)
  };
};

const getDominantState = (input: {
  minTemperature: number;
  maxTemperature: number;
  rainTotal24h: number;
  maxWindSpeed: number;
  stormChance: number;
  fogChance: number;
  precipitationChance: number;
  rainAverage: number;
}): WeatherState => {
  const {
    minTemperature,
    maxTemperature,
    rainTotal24h,
    maxWindSpeed,
    stormChance,
    fogChance,
    precipitationChance,
    rainAverage
  } = input;

  if ((maxTemperature <= 1 || minTemperature <= -5) && rainTotal24h > 1.5 && maxWindSpeed > 45 && (stormChance > 0.2 || precipitationChance > 0.45)) return "blizzard";
  if (rainTotal24h > 26 && precipitationChance > 0.58 && (stormChance > 0.2 || rainAverage > 2)) return "monsoon";
  if (rainTotal24h < 0.4 && maxWindSpeed > 70 && maxTemperature >= 28 && precipitationChance < 0.18) return "sandstorm";
  if (fogChance > 0.72 && maxWindSpeed < 18 && rainTotal24h < 4 && (rainAverage > 0 || precipitationChance > 0.25)) return "seaFog";
  if (rainTotal24h > 12 && maxWindSpeed > 55 && stormChance > 0.65) return "tempest";
  if (rainTotal24h > 8 && maxWindSpeed > 40 && stormChance > 0.45) return "storm";
  if (maxTemperature <= 1 && rainTotal24h > 0.2) return "snow";
  if (rainTotal24h > 7) return "heavyRain";
  if (rainTotal24h > 1.2) return "lightRain";
  if (maxWindSpeed > 45) return "strongWind";
  if (fogChance > 0.65 && maxWindSpeed < 15 && (rainTotal24h > 0 || rainAverage > 0 || precipitationChance > 0.3)) return "fog";
  if (precipitationChance > 0.65) return "overcast";
  if (precipitationChance > 0.35) return "cloudy";
  return "clear";
};

export const getDailyWeatherSummary = (project: CalendarProject, absoluteDay: number): DailyWeatherSummary | undefined => {
  const date = absoluteDayToCalendarDate({ absoluteDay, hour: 12, minute: 0 }, project.calendarSystem);
  const season = getSeasonForDate(project, date);
  if (!season) return undefined;

  const profileTime =
    absoluteDay === project.currentTime.absoluteDay
      ? project.currentTime
      : { absoluteDay, hour: 12, minute: 0 };
  const profile = resolveEffectiveWeatherProfile(project, profileTime);
  const traits = profile.traits;
  const seedBase = project.weatherSettings.seed || project.id;
  const seed = `${seedBase}|daily|${project.id}|${season.id}|${absoluteDay}`;

  const trend = getWeatherTrendForDay(project, absoluteDay);
  const effectiveStability = clamp01(traits.stability + trend.stabilityModifier);

  const temperatureSpan = Math.max(0, profile.temperature.max - profile.temperature.min);
  const averageTemperature = sampleCenteredMetric({
    range: profile.temperature,
    rolls: [seeded(seed, "temp:avg:a"), seeded(seed, "temp:avg:b"), seeded(seed, "temp:avg:c")],
    extremeRoll: seeded(seed, "temp:extreme"),
    extremeDepthRoll: seeded(seed, "temp:extreme:depth"),
    stability: effectiveStability,
    trendKind: trend.kind,
    trendOffset: trend.temperatureOffset
  });
  const baseSwing = Math.min(temperatureSpan, traits.dayNightAmplitude);
  const swingNoise = (seeded(seed, "temp:swing") - 0.5) * 2;
  const swingFactor = 0.55 + (1 - effectiveStability) * 0.35 + Math.abs(swingNoise) * 0.25;
  const rawSwing = clamp(baseSwing * swingFactor, 0, temperatureSpan);
  const minTemperature = clamp(averageTemperature - rawSwing / 2, profile.temperature.min, profile.temperature.max);
  const maxTemperature = clamp(averageTemperature + rawSwing / 2, profile.temperature.min, profile.temperature.max);
  const heatPressure = getHeatPressureForDay(project, absoluteDay);
  const summerHeatFactor = clamp01((averageTemperature - 20) / 10);
  const heatStormBoost = heatPressure * summerHeatFactor;
  const effectiveStormChance = clamp01(traits.stormChance + trend.stormChanceModifier + heatStormBoost * 0.32);
  const effectivePrecipitationChance = clamp01(traits.precipitationChance - summerHeatFactor * 0.1 + heatStormBoost * 0.26);

  const rainNoise = seeded(seed, "rain:roll");
  const rainHit = rainNoise < effectivePrecipitationChance;
  const rainIntensity = clamp01(effectivePrecipitationChance * 0.25 + effectiveStormChance * 0.45 + heatStormBoost * 0.35 + (trend.kind === "wet" ? 0.18 : 0) + (trend.kind === "stormy" ? 0.28 : 0) + (trend.kind === "dry" ? -0.2 : 0));
  const rainTotal24h = rainHit
    ? round1(sampleSkewedLowMetric({
        range: profile.dailyRain,
        roll: seeded(seed, "rain:intensity"),
        moderateRoll: seeded(seed, "rain:moderate"),
        extremeRoll: seeded(seed, "rain:extreme"),
        extremeDepthRoll: seeded(seed, "rain:extreme:depth"),
        stability: effectiveStability,
        intensity: rainIntensity,
        trendKind: trend.kind,
        multiplier: trend.rainMultiplier,
        allowZero: true
      }) * (1 + heatStormBoost * 0.75))
    : round1(Math.max(0, clamp(profile.dailyRain.min * trend.rainMultiplier, profile.dailyRain.min, profile.dailyRain.max)));

  const windIntensity = clamp01(traits.windVariability * 0.25 + effectiveStormChance * 0.35 + heatStormBoost * 0.22 + (trend.kind === "windy" ? 0.25 : 0) + (trend.kind === "stormy" ? 0.32 : 0) + (trend.kind === "calm" ? -0.22 : 0) + (trend.kind === "stable" ? -0.08 : 0));
  const maxWindSpeed = Math.max(0, sampleSkewedLowMetric({
    range: profile.windSpeed,
    roll: seeded(seed, "wind:avg"),
    moderateRoll: seeded(seed, "wind:moderate"),
    extremeRoll: seeded(seed, "wind:extreme"),
    extremeDepthRoll: seeded(seed, "wind:extreme:depth"),
    stability: effectiveStability,
    intensity: windIntensity,
    trendKind: trend.kind,
    multiplier: trend.windMultiplier,
    allowZero: false
  }));

  const dominantWindDirection = WIND_DIRECTIONS[Math.floor(seeded(seed, "wind:dir") * WIND_DIRECTIONS.length) % WIND_DIRECTIONS.length];
  const dominanceMetrics = {
    minTemperature,
    maxTemperature,
    rainTotal24h,
    maxWindSpeed,
    stormChance: effectiveStormChance,
    fogChance: traits.fogChance,
    precipitationChance: effectivePrecipitationChance,
    rainAverage: profile.rain.average
  };
  const dominantState = resolveGeneratedDominantState(project, chooseDominantWeatherState(project, dominanceMetrics) ?? getDominantState(dominanceMetrics));

  const weightedState = adjustStateForWeatherProfile(dominantState, {
    temperature: averageTemperature,
    rain: rainTotal24h,
    windSpeed: maxWindSpeed,
    profile
  }) ?? dominantState;
  const safeState = WEATHER_STATES.includes(weightedState) ? resolveGeneratedDominantState(project, weightedState) : "clear";

  const summary: DailyWeatherSummary = {
    absoluteDay,
    minTemperature: round1(minTemperature),
    maxTemperature: round1(maxTemperature),
    averageTemperature: round1(averageTemperature),
    heatPressure,
    rainTotal24h: round1(rainTotal24h),
    maxWindSpeed: round1(maxWindSpeed),
    dominantWindDirection,
    dominantState: safeState,
    trendKind: trend.kind
  };
  const overrideTime =
    absoluteDay === project.currentTime.absoluteDay
      ? project.currentTime
      : { absoluteDay, hour: 12, minute: 0 };
  return applyWeatherOverrideToDailySummary(
    summary,
    getWeatherOverrideForTime(project, overrideTime.absoluteDay, overrideTime.hour, overrideTime.minute)
  );
};
