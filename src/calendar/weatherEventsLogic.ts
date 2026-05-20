import type { CalendarProject, WeatherCondition, WeatherEvent, WeatherSnapshot } from "../domain/types";

export const isWeatherConditionMet = (weather: WeatherSnapshot, condition: WeatherCondition): boolean => {
  const metricValue = weather[condition.metric];
  if (condition.operator === "gte") return metricValue >= condition.value;
  return metricValue <= condition.value;
};

type WeatherEventCompat = Omit<WeatherEvent, "conditions" | "enabled" | "requireAllConditions"> & {
  conditions?: WeatherCondition[];
  enabled?: boolean;
  requireAllConditions?: boolean;
};

export const isWeatherEventTriggered = (weather: WeatherSnapshot, event: WeatherEventCompat): boolean => {
  if (event.enabled === false) return false;
  const conditions = event.conditions ?? [];
  if (conditions.length === 0) return false;
  const requireAll = event.requireAllConditions ?? true;
  return requireAll
    ? conditions.every((condition) => isWeatherConditionMet(weather, condition))
    : conditions.some((condition) => isWeatherConditionMet(weather, condition));
};

export const getTriggeredWeatherEvents = (
  project: CalendarProject,
  weather: WeatherSnapshot
): WeatherEvent[] =>
  project.weatherEvents.filter((event) => isWeatherEventTriggered(weather, event));
