import type { CalendarProject, WeatherOverride } from "../domain/types";
import type { DailyWeatherSummary } from "./weatherDaily";

const round1 = (v: number) => Math.round(v * 10) / 10;

export const getWeatherOverrideForDay = (project: CalendarProject, absoluteDay: number): WeatherOverride | undefined =>
  getWeatherOverrideForTime(project, absoluteDay, 12, 0);

export const getWeatherOverrideForTime = (
  project: CalendarProject,
  absoluteDay: number,
  hour: number,
  minute = 0
): WeatherOverride | undefined => {
  const minuteOfDay = Math.max(0, Math.min(1440, Math.trunc(hour) * 60 + Math.trunc(minute)));
  const overrides = [...(project.weatherOverrides ?? [])].reverse();

  const windowedOverride = overrides.find((override) => {
    if (override.absoluteDay !== absoluteDay) return false;
    if (typeof override.startMinuteOfDay !== "number" || typeof override.endMinuteOfDay !== "number") return false;
    return minuteOfDay >= override.startMinuteOfDay && minuteOfDay < override.endMinuteOfDay;
  });

  if (windowedOverride) return windowedOverride;

  return overrides.find((override) => {
    if (override.absoluteDay !== absoluteDay) return false;
    return typeof override.startMinuteOfDay !== "number" || typeof override.endMinuteOfDay !== "number";
  });
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