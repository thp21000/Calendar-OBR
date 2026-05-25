import { createDefaultSeasonWeatherProfile, getCurrentSeason } from "./seasonsLogic";
import { getHourlyWeatherState, getWeatherState } from "./weatherState";
import { getDailyWeatherSummary } from "./weatherDaily";
import { getHourlyRainForDay } from "./weatherRain";
import { getHourlyWindForDay } from "./weatherWind";
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

const windDirectionIndex = (direction: WindDirection): number => WIND_DIRECTIONS.indexOf(direction);
const wrapDirection = (index: number): WindDirection => WIND_DIRECTIONS[(index + WIND_DIRECTIONS.length) % WIND_DIRECTIONS.length];

export const generateWeatherForTime = (project: CalendarProject, absoluteDay: number, hour: number): WeatherSnapshot | undefined => {
  const season = getCurrentSeason({ ...project, currentTime: { ...project.currentTime, absoluteDay, hour } });
  if (!season) return undefined;
  const profile = season.weatherProfile ?? createDefaultSeasonWeatherProfile();
  const seedBase = project.weatherSettings.seed || project.id;
  const seed = `${seedBase}|${absoluteDay}|${hour}|${season.id}`;

  const dailySummary = getDailyWeatherSummary(project, absoluteDay);
  const temperature = dailySummary
    ? (() => {
        // Simple day/night curve: near min around 05:00, near max around 15:00.
        const h = ((hour % 24) + 24) % 24;
        let normalized: number;
        if (h >= 5 && h <= 15) {
          normalized = (h - 5) / 10;
        } else if (h > 15) {
          normalized = 1 - (h - 15) / 14;
        } else {
          normalized = 1 - (h + 9) / 14;
        }
        normalized = clamp(normalized, 0, 1);
        return round1(dailySummary.minTemperature + (dailySummary.maxTemperature - dailySummary.minTemperature) * normalized);
      })()
    : aroundAverage(profile.temperature.min, profile.temperature.max, profile.temperature.average, seed, "t");
  const hourlyIndex = ((hour % 24) + 24) % 24;
  const hourlyWind = dailySummary ? getHourlyWindForDay(project, absoluteDay, dailySummary)[hourlyIndex] : undefined;
  const windSpeed = hourlyWind
    ? hourlyWind.windSpeed
    : Math.max(0, aroundAverage(profile.windSpeed.min, profile.windSpeed.max, profile.windSpeed.average, seed, "w"));
  const rain = dailySummary
    ? getHourlyRainForDay(project, absoluteDay, dailySummary)[hourlyIndex]
    : Math.max(0, aroundAverage(profile.rain.min, profile.rain.max, profile.rain.average, seed, "r"));
  const windDirection = hourlyWind
    ? hourlyWind.windDirection
    : WIND_DIRECTIONS[Math.floor(seeded(seed, "dir") * WIND_DIRECTIONS.length) % WIND_DIRECTIONS.length];

  return {
    temperature,
    windSpeed,
    windDirection,
    rain,
    state: getHourlyWeatherState({
      temperature,
      windSpeed,
      rain,
      dailyRainTotal: dailySummary?.rainTotal24h,
      dominantState: dailySummary?.dominantState,
      hour
    }),
    dailyMinTemperature: dailySummary?.minTemperature,
    dailyMaxTemperature: dailySummary?.maxTemperature,
    dailyRainTotal: dailySummary?.rainTotal24h,
    dominantState: dailySummary?.dominantState,
    trendKind: dailySummary?.trendKind
  };
};

export const getCurrentWeather = (project: CalendarProject): WeatherSnapshot | undefined =>
  generateWeatherForTime(project, project.currentTime.absoluteDay, project.currentTime.hour);

export const getForecastWeatherForTime = (
  project: CalendarProject,
  absoluteDay: number,
  hour: number,
  offsetHours: number
): WeatherSnapshot | undefined => {
  const realWeather = generateWeatherForTime(project, absoluteDay, hour);
  if (!realWeather) return undefined;

  const mode = project.weatherSettings.forecastMode ?? "fine";
  const absOffset = Math.max(0, Math.floor(Math.abs(offsetHours)));
  const seed = `${project.weatherSettings.seed || project.id}|forecast|${mode}|${absoluteDay}|${hour}|${absOffset}`;
  const errorBase = mode === "wide" ? 3 : 1;
  const distanceFactor = mode === "wide" ? 0.35 : 0.12;
  const errorScale = errorBase + absOffset * distanceFactor;

  const centered = (salt: string) => (seeded(seed, salt) - 0.5) * 2;
  const round = (value: number) => Math.round(value * 10) / 10;

  const temperature = round(realWeather.temperature + centered("temp") * errorScale);
  const windSpeed = Math.max(0, round(realWeather.windSpeed + centered("wind") * errorScale * 1.5));
  const rain = Math.max(0, round(realWeather.rain + centered("rain") * errorScale * 0.8));

  let windDirection = realWeather.windDirection;
  if (mode === "wide") {
    const directionRoll = seeded(seed, "dir");
    if (directionRoll < 0.33) {
      windDirection = wrapDirection(windDirectionIndex(realWeather.windDirection) - 1);
    } else if (directionRoll > 0.66) {
      windDirection = wrapDirection(windDirectionIndex(realWeather.windDirection) + 1);
    }
  }

  return { temperature, windSpeed, windDirection, rain, state: getWeatherState({ temperature, windSpeed, rain }) };
};

export const getHourlyWeatherForecast = (
  project: CalendarProject,
  count: number
): Array<{ offsetHours: number; weather: WeatherSnapshot }> => {
  const entries: Array<{ offsetHours: number; weather: WeatherSnapshot }> = [];
  const safeCount = Math.max(0, Math.floor(count));
  const startAbsoluteDay = project.currentTime.absoluteDay;
  const startHour = project.currentTime.hour;

  for (let offsetHours = 1; offsetHours <= safeCount; offsetHours++) {
    const totalHours = startHour + offsetHours;
    const dayOffset = Math.floor(totalHours / 24);
    const hour = ((totalHours % 24) + 24) % 24;
    const absoluteDay = startAbsoluteDay + dayOffset;
    const weather = getForecastWeatherForTime(project, absoluteDay, hour, offsetHours);

    if (!weather) continue;
    entries.push({ offsetHours, weather });
  }

  return entries;
};

export const getDailyWeatherForecast = (
  project: CalendarProject,
  count: number
): Array<{ offsetDays: number; weather: WeatherSnapshot }> => {
  const entries: Array<{ offsetDays: number; weather: WeatherSnapshot }> = [];
  const safeCount = Math.max(0, Math.floor(count));
  const startAbsoluteDay = project.currentTime.absoluteDay;

  for (let offsetDays = 1; offsetDays <= safeCount; offsetDays++) {
    const absoluteDay = startAbsoluteDay + offsetDays;
    const offsetHours = offsetDays * 24;
    const weather = getForecastWeatherForTime(project, absoluteDay, 12, offsetHours);

    if (!weather) continue;
    entries.push({ offsetDays, weather });
  }

  return entries;
};