export const WEATHER_METRIC_STEP_MINUTES = 5;
export const MINUTES_PER_DAY = 1440;

export type NormalizedWeatherTime = {
  absoluteDay: number;
  hour: number;
  minute: number;
};

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
export const round1 = (value: number): number => Math.round(value * 10) / 10;
export const smoothstep = (ratio: number): number => {
  const safeRatio = clamp(ratio, 0, 1);
  return safeRatio * safeRatio * (3 - 2 * safeRatio);
};
export const lerp = (from: number, to: number, ratio: number): number => from + (to - from) * ratio;

export const normalizeWeatherTime = (absoluteDay: number, hour: number, minute = 0): NormalizedWeatherTime => {
  const totalMinutes = Math.trunc(absoluteDay) * MINUTES_PER_DAY + Math.trunc(hour) * 60 + Math.trunc(minute);
  const normalizedDay = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const minuteOfDay = ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return {
    absoluteDay: normalizedDay,
    hour: Math.floor(minuteOfDay / 60),
    minute: minuteOfDay % 60
  };
};

export const floorWeatherMetricMinute = (minute: number): number =>
  Math.floor(Math.max(0, Math.min(59, Math.trunc(minute))) / WEATHER_METRIC_STEP_MINUTES) * WEATHER_METRIC_STEP_MINUTES;

export const getWeatherMetricStepTime = (absoluteDay: number, hour: number, minute = 0): NormalizedWeatherTime => {
  const normalized = normalizeWeatherTime(absoluteDay, hour, minute);
  return { ...normalized, minute: floorWeatherMetricMinute(normalized.minute) };
};

export const getNextWeatherMetricHour = (time: NormalizedWeatherTime): NormalizedWeatherTime =>
  normalizeWeatherTime(time.absoluteDay, time.hour + 1, 0);

export const getSmoothHourlyRatio = (minuteBucket: number): number => smoothstep(clamp(minuteBucket, 0, 59) / 60);
