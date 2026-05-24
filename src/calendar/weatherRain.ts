import type { CalendarProject, WeatherState } from "../domain/types";
import type { DailyWeatherSummary } from "./weatherDaily";

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const round1 = (value: number): number => Math.round(value * 10) / 10;

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

type EpisodeConfig = {
  minEpisodes: number;
  maxEpisodes: number;
  minDuration: number;
  maxDuration: number;
  intensityMin: number;
  intensityMax: number;
};

const getEpisodeConfig = (state: WeatherState): EpisodeConfig => {
  switch (state) {
    case "lightRain":
      return { minEpisodes: 1, maxEpisodes: 2, minDuration: 4, maxDuration: 10, intensityMin: 0.4, intensityMax: 1.1 };
    case "heavyRain":
      return { minEpisodes: 1, maxEpisodes: 3, minDuration: 2, maxDuration: 7, intensityMin: 1, intensityMax: 2.4 };
    case "storm":
      return { minEpisodes: 1, maxEpisodes: 2, minDuration: 1, maxDuration: 4, intensityMin: 2.2, intensityMax: 4.8 };
    case "tempest":
      return { minEpisodes: 1, maxEpisodes: 3, minDuration: 2, maxDuration: 8, intensityMin: 2.8, intensityMax: 6 };
    case "snow":
      return { minEpisodes: 1, maxEpisodes: 2, minDuration: 3, maxDuration: 8, intensityMin: 0.7, intensityMax: 1.8 };
    case "clear":
    case "cloudy":
    case "overcast":
      return { minEpisodes: 1, maxEpisodes: 1, minDuration: 1, maxDuration: 3, intensityMin: 0.2, intensityMax: 0.8 };
    case "fog":
    case "strongWind":
    default:
      return { minEpisodes: 1, maxEpisodes: 2, minDuration: 2, maxDuration: 5, intensityMin: 0.4, intensityMax: 1.2 };
  }
};

export const getHourlyRainForDay = (
  project: CalendarProject,
  absoluteDay: number,
  dailySummary: DailyWeatherSummary
): number[] => {
  const rainTotal = Math.max(0, dailySummary.rainTotal24h);
  if (rainTotal <= 0) return new Array(24).fill(0);

  const seedBase = project.weatherSettings.seed || project.id;
  const seed = `${seedBase}|rain|${project.id}|${absoluteDay}|${dailySummary.dominantState}`;
  const config = getEpisodeConfig(dailySummary.dominantState);

  const hours = new Array(24).fill(0);
  const episodesCount = clamp(
    Math.floor(config.minEpisodes + seeded(seed, "episodes") * (config.maxEpisodes - config.minEpisodes + 1)),
    config.minEpisodes,
    config.maxEpisodes
  );

  const weights: number[] = [];
  let totalWeight = 0;

  for (let index = 0; index < episodesCount; index++) {
    const duration = clamp(
      Math.floor(config.minDuration + seeded(seed, `episode:${index}:duration`) * (config.maxDuration - config.minDuration + 1)),
      config.minDuration,
      config.maxDuration
    );
    const maxStart = Math.max(0, 24 - duration);
    const startHour = clamp(Math.floor(seeded(seed, `episode:${index}:start`) * (maxStart + 1)), 0, maxStart);

    const intensity =
      config.intensityMin + seeded(seed, `episode:${index}:intensity`) * (config.intensityMax - config.intensityMin);

    for (let step = 0; step < duration; step++) {
      const hour = startHour + step;
      if (hour < 0 || hour > 23) continue;
      const midpoint = (duration - 1) / 2;
      const distance = midpoint === 0 ? 0 : Math.abs(step - midpoint) / Math.max(1, midpoint);
      const shape = 0.55 + (1 - distance) * 0.9;
      const weight = intensity * shape;
      weights[hour] = (weights[hour] ?? 0) + weight;
      totalWeight += weight;
    }
  }

  if (totalWeight <= 0) return new Array(24).fill(0);

  for (let hour = 0; hour < 24; hour++) {
    const rawValue = ((weights[hour] ?? 0) / totalWeight) * rainTotal;
    hours[hour] = round1(Math.max(0, rawValue));
  }

  const sum = round1(hours.reduce((acc, value) => acc + value, 0));
  const diff = round1(rainTotal - sum);
  if (Math.abs(diff) > 0) {
    for (let hour = 23; hour >= 0; hour--) {
      if (hours[hour] <= 0 && diff < 0) continue;
      const adjusted = round1(hours[hour] + diff);
      if (adjusted >= 0) {
        hours[hour] = adjusted;
        break;
      }
    }
  }

  return hours.map((value) => round1(Math.max(0, value)));
};
