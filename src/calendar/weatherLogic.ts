import { getCurrentSeason } from "./seasonsLogic";
import { getConfiguredHourlyWeatherState } from "./weatherAdvancedSettings";
import { getDailyWeatherSummary } from "./weatherDaily";
import { getAccumulatedRainForTime, getSmoothedRainRateForTime } from "./weatherRain";
import { getHourlyWindForDay } from "./weatherWind";
import { getWeatherOverrideForTime } from "./weatherOverrides";
import { getNextWeatherMetricHour, getSmoothHourlyRatio, getWeatherMetricStepTime, lerp, normalizeWeatherTime, round1 } from "./weatherMetricSmoothing";
import { resolveEffectiveWeatherProfile } from "./weather/biomes";
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

const aroundAverage = (min: number, max: number, average: number, seed: string, salt: string): number => {
  const span = Math.max(0, max - min);
  const variance = span * 0.35;
  const centered = (seeded(seed, `${salt}:center`) - 0.5) * 2;
  const value = average + centered * variance;
  return round1(clamp(value, min, max));
};

const windDirectionIndex = (direction: WindDirection): number => WIND_DIRECTIONS.indexOf(direction);
const wrapDirection = (index: number): WindDirection => WIND_DIRECTIONS[(index + WIND_DIRECTIONS.length) % WIND_DIRECTIONS.length];

export const generateWeatherForTime = (project: CalendarProject, absoluteDay: number, hour: number, minute = 0): WeatherSnapshot | undefined => {
  const metricTime = getWeatherMetricStepTime(absoluteDay, hour, minute);
  const scopedProject = { ...project, currentTime: { ...project.currentTime, ...metricTime } };
  const season = getCurrentSeason(scopedProject);
  if (!season) return undefined;
  const profile = resolveEffectiveWeatherProfile(scopedProject, metricTime);
  const seedBase = project.weatherSettings.seed || project.id;
  const seed = `${seedBase}|${metricTime.absoluteDay}|${metricTime.hour}|${metricTime.minute}|${season.id}`;

  const dailySummary = getDailyWeatherSummary(scopedProject, metricTime.absoluteDay);
  const weatherOverride = getWeatherOverrideForTime(scopedProject, metricTime.absoluteDay, metricTime.hour, metricTime.minute);
  const minuteOfDay = metricTime.hour * 60 + metricTime.minute;
  const hourOfDay = minuteOfDay / 60;
  const temperature = dailySummary
    ? (() => {
        // Day/night curve in 5-minute steps: near min around 05:00, near max around 15:00.
        let normalized: number;
        if (hourOfDay >= 5 && hourOfDay <= 15) {
          normalized = (hourOfDay - 5) / 10;
        } else if (hourOfDay > 15) {
          normalized = 1 - (hourOfDay - 15) / 14;
        } else {
          normalized = 1 - (hourOfDay + 9) / 14;
        }
        normalized = clamp(normalized, 0, 1);
        return round1(dailySummary.minTemperature + (dailySummary.maxTemperature - dailySummary.minTemperature) * normalized);
      })()
    : aroundAverage(profile.temperature.min, profile.temperature.max, profile.temperature.average, seed, "t");
  const hourlyIndex = metricTime.hour;
  const nextMetricHour = getNextWeatherMetricHour(metricTime);
  const smoothRatio = getSmoothHourlyRatio(metricTime.minute);
  const hourlyWindPlan = dailySummary ? getHourlyWindForDay(project, metricTime.absoluteDay, dailySummary) : undefined;
  const nextDailySummary = nextMetricHour.absoluteDay === metricTime.absoluteDay
    ? dailySummary
    : getDailyWeatherSummary({ ...project, currentTime: { ...project.currentTime, ...nextMetricHour } }, nextMetricHour.absoluteDay);
  const nextHourlyWindPlan = nextDailySummary ? getHourlyWindForDay(project, nextMetricHour.absoluteDay, nextDailySummary) : undefined;
  const hourlyWind = hourlyWindPlan?.[hourlyIndex];
  const nextHourlyWind = nextHourlyWindPlan?.[nextMetricHour.hour];
  const windSpeed = hourlyWind && nextHourlyWind
    ? round1(Math.max(0, lerp(hourlyWind.windSpeed, nextHourlyWind.windSpeed, smoothRatio)))
    : hourlyWind
      ? hourlyWind.windSpeed
      : Math.max(0, aroundAverage(profile.windSpeed.min, profile.windSpeed.max, profile.windSpeed.average, seed, "w"));
  const rain = dailySummary
    ? getSmoothedRainRateForTime(project, metricTime.absoluteDay, metricTime.hour, metricTime.minute, dailySummary, nextDailySummary)
    : Math.max(0, aroundAverage(profile.rain.min, profile.rain.max, profile.rain.average, seed, "r"));
  const accumulatedRain = dailySummary
    ? getAccumulatedRainForTime(project, metricTime.absoluteDay, metricTime.hour, metricTime.minute, dailySummary, nextDailySummary)
    : undefined;
  const windDirection = hourlyWind
    ? hourlyWind.windDirection
    : WIND_DIRECTIONS[Math.floor(seeded(seed, "dir") * WIND_DIRECTIONS.length) % WIND_DIRECTIONS.length];

  const overriddenTemperature = typeof weatherOverride?.temperature === "number" ? weatherOverride.temperature : temperature;
  const overriddenWindSpeed = typeof weatherOverride?.windSpeed === "number" ? Math.max(0, weatherOverride.windSpeed) : windSpeed;
  const overriddenRain = typeof weatherOverride?.rain === "number" ? Math.max(0, weatherOverride.rain) : rain;
  const overriddenWindDirection = weatherOverride?.windDirection ?? windDirection;
  const computedState = getConfiguredHourlyWeatherState(scopedProject, {
    temperature: overriddenTemperature,
    windSpeed: overriddenWindSpeed,
    rain: overriddenRain,
    dailyRainTotal: typeof weatherOverride?.dailyRainTotal === "number" ? Math.max(0, weatherOverride.dailyRainTotal) : accumulatedRain,
    dominantState: dailySummary?.dominantState,
    hour: metricTime.hour
  });
  const overriddenState = weatherOverride?.state ?? computedState;

  return {
    temperature: overriddenTemperature,
    windSpeed: overriddenWindSpeed,
    windDirection: overriddenWindDirection,
    rain: overriddenRain,
    heatPressure: dailySummary?.heatPressure,
    state: overriddenState,
    dailyMinTemperature: dailySummary?.minTemperature,
    dailyMaxTemperature: dailySummary?.maxTemperature,
    dailyRainTotal: typeof weatherOverride?.dailyRainTotal === "number" ? Math.max(0, weatherOverride.dailyRainTotal) : accumulatedRain,
    dominantState: weatherOverride?.dominantState ?? dailySummary?.dominantState,
    trendKind: weatherOverride?.trendKind ?? dailySummary?.trendKind
  };
};

export const getCurrentWeather = (project: CalendarProject): WeatherSnapshot | undefined =>
  generateWeatherForTime(project, project.currentTime.absoluteDay, project.currentTime.hour, project.currentTime.minute);

export const getForecastWeatherForTime = (
  project: CalendarProject,
  absoluteDay: number,
  hour: number,
  offsetHours: number,
  minute = 0
): WeatherSnapshot | undefined => {
  const metricTime = getWeatherMetricStepTime(absoluteDay, hour, minute);
  const realWeather = generateWeatherForTime(project, metricTime.absoluteDay, metricTime.hour, metricTime.minute);
  if (!realWeather) return undefined;
  const weatherOverride = getWeatherOverrideForTime(project, metricTime.absoluteDay, metricTime.hour, metricTime.minute);

  const mode = project.weatherSettings.forecastMode ?? "fine";
  const absOffset = Math.max(0, Math.floor(Math.abs(offsetHours)));
  const seed = `${project.weatherSettings.seed || project.id}|forecast|${mode}|${metricTime.absoluteDay}|${metricTime.hour}|${metricTime.minute}|${absOffset}`;
  const errorBase = mode === "wide" ? 3 : 1;
  const distanceFactor = mode === "wide" ? 0.35 : 0.12;
  const errorScale = errorBase + absOffset * distanceFactor;

  const centered = (salt: string) => (seeded(seed, salt) - 0.5) * 2;
  const round = (value: number) => Math.round(value * 10) / 10;

  const temperature = typeof weatherOverride?.temperature === "number" ? realWeather.temperature : round(realWeather.temperature + centered("temp") * errorScale);
  const windSpeed = typeof weatherOverride?.windSpeed === "number" ? realWeather.windSpeed : Math.max(0, round(realWeather.windSpeed + centered("wind") * errorScale * 1.5));
  const rain = typeof weatherOverride?.rain === "number" ? realWeather.rain : Math.max(0, round(realWeather.rain + centered("rain") * errorScale * 0.8));

  const dailyTempErrorScale = mode === "wide" ? (0.9 + absOffset * 0.08) : (0.4 + absOffset * 0.03);
  const dailyRainErrorScale = mode === "wide" ? (1.4 + absOffset * 0.14) : (0.6 + absOffset * 0.06);
  
  let windDirection = realWeather.windDirection;
  if (mode === "wide" && !weatherOverride?.windDirection) {
    const directionRoll = seeded(seed, "dir");
    if (directionRoll < 0.33) {
      windDirection = wrapDirection(windDirectionIndex(realWeather.windDirection) - 1);
    } else if (directionRoll > 0.66) {
      windDirection = wrapDirection(windDirectionIndex(realWeather.windDirection) + 1);
    }
  }

  const forecastDailyMin = realWeather.dailyMinTemperature !== undefined
    ? (typeof weatherOverride?.dailyMinTemperature === "number" ? realWeather.dailyMinTemperature : round(realWeather.dailyMinTemperature + centered("daily:min") * dailyTempErrorScale))
    : undefined;
  const forecastDailyMax = realWeather.dailyMaxTemperature !== undefined
    ? (typeof weatherOverride?.dailyMaxTemperature === "number" ? realWeather.dailyMaxTemperature : round(realWeather.dailyMaxTemperature + centered("daily:max") * dailyTempErrorScale))
    : undefined;

  let dailyMinTemperature = forecastDailyMin;
  let dailyMaxTemperature = forecastDailyMax;
  if (dailyMinTemperature !== undefined && dailyMaxTemperature !== undefined && dailyMinTemperature > dailyMaxTemperature) {
    const low = Math.min(dailyMinTemperature, dailyMaxTemperature);
    const high = Math.max(dailyMinTemperature, dailyMaxTemperature);
    dailyMinTemperature = low;
    dailyMaxTemperature = high;
  }

  const dailyRainTotal = realWeather.dailyRainTotal !== undefined
    ? (typeof weatherOverride?.dailyRainTotal === "number" ? realWeather.dailyRainTotal : Math.max(0, round(realWeather.dailyRainTotal + centered("daily:rain") * dailyRainErrorScale)))
    : undefined;

  return {
    temperature,
    windSpeed,
    windDirection,
    rain,
    heatPressure: realWeather.heatPressure,
    state: weatherOverride?.state ?? getConfiguredHourlyWeatherState(project, { temperature, windSpeed, rain, dailyRainTotal, dominantState: realWeather.dominantState, hour: metricTime.hour }),
    dailyMinTemperature,
    dailyMaxTemperature,
    dailyRainTotal,
    dominantState: weatherOverride?.dominantState ?? realWeather.dominantState,
    trendKind: realWeather.trendKind
  };
};

export const getHourlyWeatherForecast = (
  project: CalendarProject,
  count: number
): Array<{ offsetHours: number; weather: WeatherSnapshot }> => {
  const entries: Array<{ offsetHours: number; weather: WeatherSnapshot }> = [];
  const safeCount = Math.max(0, Math.floor(count));
  const startTime = normalizeWeatherTime(project.currentTime.absoluteDay, project.currentTime.hour, project.currentTime.minute);

  for (let offsetHours = 1; offsetHours <= safeCount; offsetHours++) {
    const forecastTime = normalizeWeatherTime(startTime.absoluteDay, startTime.hour + offsetHours, startTime.minute);
    const weather = getForecastWeatherForTime(project, forecastTime.absoluteDay, forecastTime.hour, offsetHours, forecastTime.minute);

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