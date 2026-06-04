import { absoluteDayToCalendarDate } from "./dateEngine";
import { getSeasonForDate } from "./seasonsLogic";
import { resolveEffectiveWeatherProfile } from "./weather/biomes";
import { getEnabledWeatherTrends, getWeatherTrendConfig } from "./weatherAdvancedSettings";
import type { CalendarProject, WeatherTrendKind } from "../domain/types";

export type WeatherTrendSummary = {
  kind: WeatherTrendKind;
  startAbsoluteDay: number;
  endAbsoluteDay: number;
  durationDays: number;
  temperatureOffset: number;
  rainMultiplier: number;
  windMultiplier: number;
  stormChanceModifier: number;
  stabilityModifier: number;
};

const hashSeed = (input: string): number => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const seeded = (seed: string, salt: string): number => hashSeed(`${seed}|${salt}`) / 4294967295;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const chooseKind = (weights: Record<WeatherTrendKind, number>, roll: number): WeatherTrendKind => {
  const entries = Object.entries(weights) as Array<[WeatherTrendKind, number]>;
  const total = entries.reduce((s, [, w]) => s + Math.max(0.0001, w), 0);
  let acc = 0;
  for (const [k, w] of entries) {
    acc += Math.max(0.0001, w) / total;
    if (roll <= acc) return k;
  }
  return "stable";
};

const profileForKind = (project: CalendarProject, kind: WeatherTrendKind): Omit<WeatherTrendSummary, "kind" | "startAbsoluteDay" | "endAbsoluteDay" | "durationDays"> => {
  const config = getWeatherTrendConfig(project, kind);
  return {
    temperatureOffset: config.temperatureOffset ?? 0,
    rainMultiplier: config.rainMultiplier ?? 1,
    windMultiplier: config.windMultiplier ?? 1,
    stormChanceModifier: config.stormChanceModifier ?? 0,
    stabilityModifier: config.stabilityModifier ?? 0
  };
};

export const getWeatherTrendForDay = (project: CalendarProject, absoluteDay: number): WeatherTrendSummary => {
  const date = absoluteDayToCalendarDate({ absoluteDay, hour: 12, minute: 0 }, project.calendarSystem);
  const season = getSeasonForDate(project, date);
  const profile = resolveEffectiveWeatherProfile(project, { absoluteDay, hour: 12, minute: 0 });
  const traits = profile.traits;
  const seedBase = project.weatherSettings.seed || project.id;

  const avgDuration = traits.stability >= 0.7 ? 8 : traits.stability >= 0.4 ? 5.5 : 3;
  const durationMin = traits.stability >= 0.7 ? 6 : traits.stability >= 0.4 ? 4 : 2;
  const durationMax = traits.stability >= 0.7 ? 10 : traits.stability >= 0.4 ? 7 : 4;

  const cycleLength = 60;
  const cycleStart = Math.floor(absoluteDay / cycleLength) * cycleLength;
  const cycleSeed = `${seedBase}|trend|${project.id}|${season?.id ?? "none"}|${cycleStart}`;
  let start = cycleStart;
  let idx = 0;
  while (true) {
    const local = `${cycleSeed}|${idx}`;
    const jitter = (seeded(local, "dur") - 0.5) * 2;
    const dur = Math.round(clamp(avgDuration + jitter * 1.5, durationMin, durationMax));
    const end = start + dur - 1;
    if (absoluteDay <= end) {
      const tAvg = profile.temperature.average;
      const weights: Record<WeatherTrendKind, number> = {
        cold: tAvg <= 6 ? 1.2 : 0.5,
        warm: tAvg >= 18 ? 1.2 : 0.5,
        wet: 0.4 + traits.precipitationChance * 1.6,
        dry: 0.4 + (1 - traits.precipitationChance) * 1.6,
        windy: 0.4 + traits.windVariability * 1.3,
        calm: 0.4 + traits.stability * 1.2,
        stormy: 0.2 + traits.stormChance * 2,
        stable: 0.3 + traits.stability * 1.5,
        unstable: 0.3 + (1 - traits.stability) * 1.8
      };
      const enabledTrends = getEnabledWeatherTrends(project);
      const weightedEnabled = Object.fromEntries(
        (Object.entries(weights) as Array<[WeatherTrendKind, number]>).filter(([trend]) => enabledTrends.includes(trend))
      ) as Record<WeatherTrendKind, number>;
      const kind = chooseKind(Object.keys(weightedEnabled).length > 0 ? weightedEnabled : weights, seeded(local, "kind"));
      const modifiers = profileForKind(project, kind);
      return { kind, startAbsoluteDay: start, endAbsoluteDay: end, durationDays: dur, ...modifiers };
    }
    start = end + 1;
    idx += 1;
  }
};
