import { absoluteDayToCalendarDate } from "./dateEngine";
import { deriveSeasonWeatherTraits } from "./seasonWeatherProfile";
import { createDefaultSeasonWeatherProfile, getSeasonForDate } from "./seasonsLogic";
import { getWeatherTrendForDay } from "./weatherTrend";
import { applyWeatherOverrideToDailySummary, getWeatherOverrideForDay } from "./weatherOverrides";
import type { CalendarProject, WeatherState, WindDirection } from "../domain/types";

export type DailyWeatherSummary = {
  absoluteDay: number;
  minTemperature: number;
  maxTemperature: number;
  averageTemperature: number;
  rainTotal24h: number;
  maxWindSpeed: number;
  dominantWindDirection: WindDirection;
  dominantState: WeatherState;
  trendKind?: import("../domain/types").WeatherTrendKind;
};

const WIND_DIRECTIONS: WindDirection[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const WEATHER_STATES: WeatherState[] = ["clear", "cloudy", "overcast", "fog", "lightRain", "heavyRain", "storm", "snow", "strongWind", "tempest"];

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

  const profile = season.weatherProfile ?? createDefaultSeasonWeatherProfile();
  const traits = deriveSeasonWeatherTraits(profile);
  const seedBase = project.weatherSettings.seed || project.id;
  const seed = `${seedBase}|daily|${project.id}|${season.id}|${absoluteDay}`;

  const trend = getWeatherTrendForDay(project, absoluteDay);
  const effectiveStability = clamp01(traits.stability + trend.stabilityModifier);
  const effectiveStormChance = clamp01(traits.stormChance + trend.stormChanceModifier);

  const temperatureSpan = Math.max(0, profile.temperature.max - profile.temperature.min);
  const baseSwing = temperatureSpan * (0.25 + traits.temperatureSwing * 0.75);
  const swingNoise = (seeded(seed, "temp:swing") - 0.5) * 2;
  const swingFactor = 1 + swingNoise * (1 - effectiveStability) * 0.5;
  const rawSwing = clamp(baseSwing * swingFactor, 0, temperatureSpan);

  const avgNoise = (seeded(seed, "temp:avg") - 0.5) * 2;
  const avgVariance = temperatureSpan * (0.05 + (1 - effectiveStability) * 0.2);
  const averageTemperature = clamp(profile.temperature.average + trend.temperatureOffset + avgNoise * avgVariance, profile.temperature.min, profile.temperature.max);
  const minTemperature = clamp(averageTemperature - rawSwing / 2, profile.temperature.min, profile.temperature.max);
  const maxTemperature = clamp(averageTemperature + rawSwing / 2, profile.temperature.min, profile.temperature.max);

  const rainNoise = seeded(seed, "rain:roll");
  const rainHit = rainNoise < traits.precipitationChance;
  const rainIntensity = seeded(seed, "rain:intensity");
  const rainBase = rainHit ? profile.rain.average * trend.rainMultiplier * (0.3 + rainIntensity * (0.7 + (1 - effectiveStability) * 0.6)) : 0;
  const rainBoost = profile.rain.max * effectiveStormChance * trend.rainMultiplier * seeded(seed, "rain:storm");
  const rainTotal24h = Math.max(0, clamp(rainBase + rainBoost, 0, profile.rain.max * 1.8));

  const windNoise = (seeded(seed, "wind:avg") - 0.5) * 2;
  const windVariance = (profile.windSpeed.max - profile.windSpeed.min) * (0.15 + traits.windVariability * 0.85) * (1 + (1 - effectiveStability) * 0.25);
  const windBase = clamp(profile.windSpeed.average * trend.windMultiplier + windNoise * windVariance, profile.windSpeed.min, profile.windSpeed.max);
  const gustFactor = 1 + effectiveStormChance * seeded(seed, "wind:gust") * 0.8;
  const maxWindSpeed = Math.max(0, clamp(windBase * gustFactor, profile.windSpeed.min, profile.windSpeed.max * 1.25));

  const dominantWindDirection = WIND_DIRECTIONS[Math.floor(seeded(seed, "wind:dir") * WIND_DIRECTIONS.length) % WIND_DIRECTIONS.length];
  const dominantState = getDominantState({
    minTemperature,
    maxTemperature,
    rainTotal24h,
    maxWindSpeed,
    stormChance: effectiveStormChance,
    fogChance: traits.fogChance,
    precipitationChance: traits.precipitationChance,
    rainAverage: profile.rain.average
  });

  const safeState = WEATHER_STATES.includes(dominantState) ? dominantState : "clear";

  const summary: DailyWeatherSummary = {
    absoluteDay,
    minTemperature: round1(minTemperature),
    maxTemperature: round1(maxTemperature),
    averageTemperature: round1(averageTemperature),
    rainTotal24h: round1(rainTotal24h),
    maxWindSpeed: round1(maxWindSpeed),
    dominantWindDirection,
    dominantState: safeState,
    trendKind: trend.kind
  };
  return applyWeatherOverrideToDailySummary(summary, getWeatherOverrideForDay(project, absoluteDay));
};
