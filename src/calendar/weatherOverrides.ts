import type { CalendarProject, WeatherOverride } from "../domain/types";
import type { DailyWeatherSummary } from "./weatherDaily";

const round1 = (v: number) => Math.round(v * 10) / 10;
const MINUTES_PER_DAY = 1440;

const hasNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const absoluteMinutesFor = (absoluteDay: number, hour: number, minute: number): number => absoluteDay * MINUTES_PER_DAY + Math.trunc(hour) * 60 + Math.trunc(minute);
const transitionRatio = (override: WeatherOverride, absoluteMinutes: number): number => {
  if (override.source !== "sceneWeather") return 1;
  if (!hasNumber(override.transitionStartAtMinutes) || !hasNumber(override.transitionDurationMinutes)) return 1;
  if (override.transitionDurationMinutes <= 0) return 1;
  return Math.max(0, Math.min(1, (absoluteMinutes - override.transitionStartAtMinutes) / override.transitionDurationMinutes));
};
const lerp = (from: number, to: number, ratio: number): number => from + (to - from) * ratio;

export const resolveWeatherOverrideTransition = (override: WeatherOverride, absoluteMinutes: number): WeatherOverride => {
  if (override.source !== "sceneWeather" || !override.transitionFrom) return override;
  const ratio = transitionRatio(override, absoluteMinutes);
  if (ratio >= 1) return override;

  const next: WeatherOverride = { ...override };
  for (const key of ["temperature", "dailyMinTemperature", "dailyMaxTemperature", "rain", "dailyRainTotal", "windSpeed"] as const) {
    const from = override.transitionFrom[key];
    const to = override[key];
    if (hasNumber(from) && hasNumber(to)) next[key] = round1(lerp(from, to, ratio));
  }

  if (ratio < 0.5) {
    if (override.state) delete next.state;
    if (override.dominantState) delete next.dominantState;
    if (override.windDirection) delete next.windDirection;
    if (override.trendKind) delete next.trendKind;
  }
  return next;
};

export const getWeatherOverrideForDay = (project: CalendarProject, absoluteDay: number): WeatherOverride | undefined =>
  getWeatherOverrideForTime(project, absoluteDay, 12, 0);

export const getWeatherOverrideForTime = (
  project: CalendarProject,
  absoluteDay: number,
  hour: number,
  minute = 0
): WeatherOverride | undefined => {
  const minuteOfDay = Math.max(0, Math.min(1440, Math.trunc(hour) * 60 + Math.trunc(minute)));
  const absoluteMinutes = absoluteMinutesFor(absoluteDay, hour, minute);
  const overrides = [...(project.weatherOverrides ?? [])].reverse();

  const windowedOverride = overrides.find((override) => {
    if (override.absoluteDay !== absoluteDay) return false;
    if (typeof override.startMinuteOfDay !== "number" || typeof override.endMinuteOfDay !== "number") return false;
    return minuteOfDay >= override.startMinuteOfDay && minuteOfDay < override.endMinuteOfDay;
  });

  if (windowedOverride) return resolveWeatherOverrideTransition(windowedOverride, absoluteMinutes);

  const dayOverride = overrides.find((override) => {
    if (override.absoluteDay !== absoluteDay) return false;
    return typeof override.startMinuteOfDay !== "number" || typeof override.endMinuteOfDay !== "number";
  });
  return dayOverride ? resolveWeatherOverrideTransition(dayOverride, absoluteMinutes) : undefined;
};

export const applyWeatherOverrideToDailySummary = (
  summary: DailyWeatherSummary | undefined,
  override: WeatherOverride | undefined
): DailyWeatherSummary | undefined => {
  if (!summary || !override) return summary;
  const next: DailyWeatherSummary = { ...summary };
  if (typeof override.temperature === "number" && Number.isFinite(override.temperature)) next.averageTemperature = round1(override.temperature);
  if (typeof override.dailyMinTemperature === "number" && Number.isFinite(override.dailyMinTemperature)) next.minTemperature = round1(override.dailyMinTemperature);
  if (typeof override.dailyMaxTemperature === "number" && Number.isFinite(override.dailyMaxTemperature)) next.maxTemperature = round1(override.dailyMaxTemperature);
  if (next.minTemperature > next.maxTemperature) {
    const lo = Math.min(next.minTemperature, next.maxTemperature);
    const hi = Math.max(next.minTemperature, next.maxTemperature);
    next.minTemperature = lo;
    next.maxTemperature = hi;
  }
  if (typeof override.dailyRainTotal === "number" && Number.isFinite(override.dailyRainTotal)) next.rainTotal24h = round1(Math.max(0, override.dailyRainTotal));
  if (typeof override.windSpeed === "number" && Number.isFinite(override.windSpeed)) next.maxWindSpeed = round1(Math.max(0, override.windSpeed));
  if (override.dominantState) next.dominantState = override.dominantState;
  if (override.trendKind) next.trendKind = override.trendKind;
  if (override.windDirection) next.dominantWindDirection = override.windDirection;
  return next;
};