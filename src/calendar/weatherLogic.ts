import { createDefaultSeasonWeatherProfile, getCurrentSeason } from "./seasonsLogic";
import type { CalendarProject, WeatherSnapshot, WindDirection } from "../domain/types";

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

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

const aroundAverage = (min: number, max: number, average: number, seed: string, salt: string): number => {
  const span = Math.max(0, max - min);
  const variance = span * 0.35;
  const centered = (seeded(seed, `${salt}:center`) - 0.5) * 2;
  const value = average + centered * variance;
  return round1(clamp(value, min, max));
};

export const generateWeatherForTime = (project: CalendarProject, absoluteDay: number, hour: number): WeatherSnapshot | undefined => {
  const season = getCurrentSeason({ ...project, currentTime: { ...project.currentTime, absoluteDay, hour } });
  if (!season) return undefined;
  const profile = season.weatherProfile ?? createDefaultSeasonWeatherProfile();
  const seedBase = project.weatherSettings.seed || project.id;
  const seed = `${seedBase}|${absoluteDay}|${hour}|${season.id}`;

  const temperature = aroundAverage(profile.temperature.min, profile.temperature.max, profile.temperature.average, seed, "t");
  const windSpeed = Math.max(0, aroundAverage(profile.windSpeed.min, profile.windSpeed.max, profile.windSpeed.average, seed, "w"));
  const rain = Math.max(0, aroundAverage(profile.rain.min, profile.rain.max, profile.rain.average, seed, "r"));
  const windDirection = WIND_DIRECTIONS[Math.floor(seeded(seed, "dir") * WIND_DIRECTIONS.length) % WIND_DIRECTIONS.length];

  return { temperature, windSpeed, windDirection, rain };
};

export const getCurrentWeather = (project: CalendarProject): WeatherSnapshot | undefined =>
  generateWeatherForTime(project, project.currentTime.absoluteDay, project.currentTime.hour);

