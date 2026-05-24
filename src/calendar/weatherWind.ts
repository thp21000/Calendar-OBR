import { deriveSeasonWeatherTraits } from "./seasonWeatherProfile";
import { createDefaultSeasonWeatherProfile, getSeasonForDate } from "./seasonsLogic";
import { absoluteDayToCalendarDate } from "./dateEngine";
import type { CalendarProject, WindDirection } from "../domain/types";
import type { DailyWeatherSummary } from "./weatherDaily";

export type HourlyWind = {
  windSpeed: number;
  windDirection: WindDirection;
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

const directionIndex = (direction: WindDirection): number => Math.max(0, WIND_DIRECTIONS.indexOf(direction));
const wrapDirection = (index: number): WindDirection => WIND_DIRECTIONS[(index + WIND_DIRECTIONS.length) % WIND_DIRECTIONS.length];

const stateSpeedFactor = (state: DailyWeatherSummary["dominantState"]): number => {
  switch (state) {
    case "tempest": return 1.15;
    case "storm": return 1.1;
    case "strongWind": return 1.08;
    case "clear": return 0.8;
    case "cloudy": return 0.88;
    default: return 1;
  }
};

export const getHourlyWindForDay = (
  project: CalendarProject,
  absoluteDay: number,
  dailySummary: DailyWeatherSummary
): HourlyWind[] => {
  const seedBase = project.weatherSettings.seed || project.id;
  const seed = `${seedBase}|wind|${project.id}|${absoluteDay}|${dailySummary.dominantWindDirection}|${dailySummary.dominantState}`;

  const date = absoluteDayToCalendarDate({ absoluteDay, hour: 12, minute: 0 }, project.calendarSystem);
  const season = getSeasonForDate(project, date);
  const profile = season?.weatherProfile ?? createDefaultSeasonWeatherProfile();
  const traits = deriveSeasonWeatherTraits(profile);

  const variability = clamp01(traits.windVariability * 0.75 + (1 - traits.stability) * 0.25);
  const dominantIndex = directionIndex(dailySummary.dominantWindDirection);

  const base = Math.max(0, dailySummary.maxWindSpeed * (0.72 + seeded(seed, "base") * 0.2) * stateSpeedFactor(dailySummary.dominantState));
  const plan: HourlyWind[] = [];

  const strongHour = Math.floor(seeded(seed, "strong-hour") * 24) % 24;

  for (let hour = 0; hour < 24; hour++) {
    const roll = seeded(seed, `dir:${hour}`);
    let offset = 0;
    const adjacentChance = 0.1 + variability * 0.22;
    const twoStepChance = 0.01 + variability * 0.06;

    if (roll < twoStepChance) offset = -2;
    else if (roll > 1 - twoStepChance) offset = 2;
    else if (roll < twoStepChance + adjacentChance) offset = -1;
    else if (roll > 1 - (twoStepChance + adjacentChance)) offset = 1;

    const windDirection = wrapDirection(dominantIndex + offset);

    const diurnal = 0.9 + Math.sin(((hour - 11) / 24) * Math.PI * 2) * 0.12;
    const gust = 0.85 + seeded(seed, `gust:${hour}`) * (0.3 + variability * 0.35);
    const micro = (seeded(seed, `micro:${hour}`) - 0.5) * (0.4 + variability * 0.4);
    const parityNudge = (hour % 2) * 0.1;
    const rawSpeed = base * diurnal * gust + micro + parityNudge;

    let windSpeed = round1(Math.max(0, rawSpeed));

    if (hour === strongHour) {
      windSpeed = round1(Math.max(windSpeed, dailySummary.maxWindSpeed * (0.92 + seeded(seed, "strong-boost") * 0.08)));
    }

    plan.push({ windSpeed: Math.max(0, windSpeed), windDirection });
  }

  const dominantCount = plan.filter((entry) => entry.windDirection === dailySummary.dominantWindDirection).length;
  if (dominantCount < 8) {
    for (let hour = 0; hour < 24 && plan.filter((entry) => entry.windDirection === dailySummary.dominantWindDirection).length < 8; hour += 3) {
      plan[hour] = { ...plan[hour], windDirection: dailySummary.dominantWindDirection };
    }
  }

  return plan;
};
