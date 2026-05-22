import { generateWeatherForTime } from "./weatherLogic";
import type { CalendarProject, InternalTime, WeatherCondition, WeatherEvent, WeatherSnapshot } from "../domain/types";

export const isWeatherConditionMet = (weather: WeatherSnapshot, condition: WeatherCondition): boolean => {
  if (condition.type === "state") {
    return (weather.state ?? "clear") === condition.state;
  }
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

export const getNewlyTriggeredWeatherEventsBetween = (
  project: CalendarProject,
  fromTime: InternalTime,
  toTime: InternalTime
): WeatherEvent[] => {
  const fromWeather = generateWeatherForTime(project, fromTime.absoluteDay, fromTime.hour);
  const toWeather = generateWeatherForTime(project, toTime.absoluteDay, toTime.hour);
  if (!fromWeather || !toWeather) return [];

  const fromTriggeredIds = new Set(getTriggeredWeatherEvents(project, fromWeather).map((event) => event.id));
  return getTriggeredWeatherEvents(project, toWeather).filter((event) => !fromTriggeredIds.has(event.id));
};

export const createDefaultWeatherEvent = (locale: CalendarProject["locale"]): WeatherEvent => ({
  id: `weather-event-${Date.now()}`,
  name: locale === "fr" ? "Nouvelle alerte météo" : "New weather alert",
  icon: "🌩️",
  summary: "",
  link: "",
  enabled: true,
  requireAllConditions: true,
  conditions: [{ type: "metric", metric: "temperature", operator: "gte", value: 35 }]
});

export const addWeatherEvent = (project: CalendarProject, event: WeatherEvent): CalendarProject => ({
  ...project,
  weatherEvents: [...project.weatherEvents, event]
});

export const updateWeatherEvent = (
  project: CalendarProject,
  eventId: string,
  patch: Partial<WeatherEvent>
): CalendarProject => ({
  ...project,
  weatherEvents: project.weatherEvents.map((event) => (event.id === eventId ? { ...event, ...patch } : event))
});

export const deleteWeatherEvent = (project: CalendarProject, eventId: string): CalendarProject => ({
  ...project,
  weatherEvents: project.weatherEvents.filter((event) => event.id !== eventId)
});

export const addWeatherCondition = (project: CalendarProject, eventId: string): CalendarProject => ({
  ...project,
  weatherEvents: project.weatherEvents.map((event) =>
    event.id === eventId
      ? {
          ...event,
          conditions: [...(event.conditions ?? []), { type: "metric", metric: "temperature", operator: "gte", value: 35 }]
        }
      : event
  )
});

export const addWeatherStateCondition = (project: CalendarProject, eventId: string): CalendarProject => ({
  ...project,
  weatherEvents: project.weatherEvents.map((event) =>
    event.id === eventId
      ? {
          ...event,
          conditions: [...(event.conditions ?? []), { type: "state", state: "storm" }]
        }
      : event
  )
});

export const updateWeatherCondition = (
  project: CalendarProject,
  eventId: string,
  conditionIndex: number,
  patch: Partial<WeatherCondition>
): CalendarProject => ({
  ...project,
  weatherEvents: project.weatherEvents.map((event) => {
    if (event.id !== eventId) return event;
    const conditions = [...(event.conditions ?? [])];
    const target = conditions[conditionIndex];
    if (!target) return event;
    const metricPatch = patch.type === "metric" || (patch.type === undefined && ("metric" in patch || "operator" in patch || "value" in patch))
      ? patch
      : undefined;
    if (target.type === "state") {
      const nextType = patch.type === "metric" ? "metric" : "state";
      conditions[conditionIndex] =
        nextType === "state"
          ? {
              type: "state",
              state: patch.type === "state" ? patch.state ?? target.state : "storm"
            }
          : {
              type: "metric",
              metric: metricPatch?.metric ?? "temperature",
              operator: metricPatch?.operator ?? "gte",
              value: metricPatch?.value ?? 35
            };
    } else {
      if (patch.type === "state") {
        conditions[conditionIndex] = { type: "state", state: patch.state ?? "storm" };
      } else {
        conditions[conditionIndex] = {
          type: "metric",
          metric: metricPatch?.metric ?? target.metric,
          operator: metricPatch?.operator ?? target.operator,
          value: metricPatch?.value ?? target.value
        };
      }
    }
    return { ...event, conditions };
  })
});

export const deleteWeatherCondition = (project: CalendarProject, eventId: string, conditionIndex: number): CalendarProject => ({
  ...project,
  weatherEvents: project.weatherEvents.map((event) => {
    if (event.id !== eventId) return event;
    return {
      ...event,
      conditions: (event.conditions ?? []).filter((_, index) => index !== conditionIndex)
    };
  })
});