import { generateWeatherForTime } from "./weatherLogic";
import { absoluteDayToCalendarDate } from "./dateEngine";
import { getSeasonForDate } from "./seasonsLogic";
import type { CalendarProject, InternalTime, WeatherCondition, WeatherEvent, WeatherSnapshot, WeatherState } from "../domain/types";

type WeatherConditionContext = {
  project?: CalendarProject;
  time?: InternalTime;
};

export const isWeatherConditionMet = (weather: WeatherSnapshot, condition: WeatherCondition, context?: WeatherConditionContext): boolean => {
  if (condition.type === "state") {
    return (weather.state ?? "clear") === condition.state;
  }
  if (condition.type === "season") {
    if (!context?.project || !context?.time) return false;
    const date = absoluteDayToCalendarDate(context.time, context.project.calendarSystem);
    const currentSeason = getSeasonForDate(context.project, date);
    return currentSeason?.id === condition.seasonId;
  }
  if (condition.type === "timeOfDay") {
    if (!context?.time) return false;
    const hour = context.time.hour;
    const start = Math.max(0, Math.min(23, Math.trunc(condition.startHour)));
    const end = Math.max(0, Math.min(23, Math.trunc(condition.endHour)));
    if (start <= end) return hour >= start && hour <= end;
    return hour >= start || hour <= end;
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

export const isWeatherEventTriggered = (weather: WeatherSnapshot, event: WeatherEventCompat, context?: WeatherConditionContext): boolean => {
  if (event.enabled === false) return false;
  const conditions = event.conditions ?? [];
  if (conditions.length === 0) return false;
  const requireAll = event.requireAllConditions ?? true;
  return requireAll
    ? conditions.every((condition) => isWeatherConditionMet(weather, condition, context))
    : conditions.some((condition) => isWeatherConditionMet(weather, condition, context));
};

export const getTriggeredWeatherEvents = (
  project: CalendarProject,
  weather: WeatherSnapshot
): WeatherEvent[] =>
  project.weatherEvents.filter((event) => isWeatherEventTriggered(weather, event, { project, time: project.currentTime }));

export const getActiveWeatherEventsWithDuration = (
  project: CalendarProject,
  weather: WeatherSnapshot,
  currentTime: InternalTime,
  lastTriggeredAtMinutesByEventId?: Record<string, number>
): WeatherEvent[] => {
  const nowMinutes = toAbsoluteMinutes(currentTime);
  return project.weatherEvents.filter((event) => {
    if (isWeatherEventTriggered(weather, event, { project, time: currentTime })) return true;
    const lastTriggeredAt = lastTriggeredAtMinutesByEventId?.[event.id];
    if (typeof lastTriggeredAt !== "number") return false;
    return isWithinDurationWindow(lastTriggeredAt, nowMinutes, event.durationHours);
  });
};

export const getNewlyTriggeredWeatherEventsBetween = (
  project: CalendarProject,
  fromTime: InternalTime,
  toTime: InternalTime,
  lastTriggeredAtMinutesByEventId?: Record<string, number>
): WeatherEvent[] => {
  const fromWeather = generateWeatherForTime(project, fromTime.absoluteDay, fromTime.hour);
  const toWeather = generateWeatherForTime(project, toTime.absoluteDay, toTime.hour);
  if (!fromWeather || !toWeather) return [];

  const fromTriggeredIds = new Set(project.weatherEvents.filter((event) => isWeatherEventTriggered(fromWeather, event, { project, time: fromTime })).map((event) => event.id));
  const toMinutes = toAbsoluteMinutes(toTime);
  return project.weatherEvents.filter((event) => isWeatherEventTriggered(toWeather, event, { project, time: toTime })).filter((event) => {
    const lastTriggeredAt = lastTriggeredAtMinutesByEventId?.[event.id];
    if (typeof lastTriggeredAt === "number") {
      if (isWithinDurationWindow(lastTriggeredAt, toMinutes, event.durationHours)) return false;
      if (isWithinCooldownWindow(lastTriggeredAt, toMinutes, event.cooldownHours)) return false;
    }
    return !fromTriggeredIds.has(event.id);
  });
};

export const toAbsoluteMinutes = (time: InternalTime): number => time.absoluteDay * 24 * 60 + time.hour * 60 + time.minute;

export const isWithinDurationWindow = (triggeredAtMinutes: number, currentMinutes: number, durationHours?: number): boolean => {
  if (typeof durationHours !== "number") return false;
  const safeHours = Math.max(0, durationHours);
  return currentMinutes - triggeredAtMinutes < safeHours * 60;
};

export const isWithinCooldownWindow = (triggeredAtMinutes: number, currentMinutes: number, cooldownHours?: number): boolean => {
  if (typeof cooldownHours !== "number") return false;
  const safeHours = Math.max(0, cooldownHours);
  return currentMinutes - triggeredAtMinutes < safeHours * 60;
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

export const addWeatherSeasonCondition = (project: CalendarProject, eventId: string): CalendarProject => ({
  ...project,
  weatherEvents: project.weatherEvents.map((event) =>
    event.id === eventId
      ? {
          ...event,
          conditions: [...(event.conditions ?? []), { type: "season", seasonId: project.seasons[0]?.id ?? "" }]
        }
      : event
  )
});

export const addWeatherTimeOfDayCondition = (project: CalendarProject, eventId: string): CalendarProject => ({
  ...project,
  weatherEvents: project.weatherEvents.map((event) =>
    event.id === eventId
      ? {
          ...event,
          conditions: [...(event.conditions ?? []), { type: "timeOfDay", startHour: 22, endHour: 6 }]
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
    const asMetric = (fallback?: { metric: "temperature" | "windSpeed" | "rain"; operator: "gte" | "lte"; value: number }) => ({
      type: "metric" as const,
      metric: patch.type === "metric" && patch.metric ? patch.metric : ("metric" in patch && patch.metric ? patch.metric : fallback?.metric ?? "temperature"),
      operator: patch.type === "metric" && patch.operator ? patch.operator : ("operator" in patch && patch.operator ? patch.operator : fallback?.operator ?? "gte"),
      value: patch.type === "metric" && typeof patch.value === "number" ? patch.value : ("value" in patch && typeof patch.value === "number" ? patch.value : fallback?.value ?? 35)
    });
    const asState = (fallbackState: WeatherState = "storm") => ({ type: "state" as const, state: patch.type === "state" && patch.state ? patch.state : fallbackState });
    const asSeason = (fallbackSeasonId = "") => ({ type: "season" as const, seasonId: patch.type === "season" && typeof patch.seasonId === "string" ? patch.seasonId : fallbackSeasonId });
    const asTimeOfDay = (fallbackStartHour = 22, fallbackEndHour = 6) => ({
      type: "timeOfDay" as const,
      startHour: patch.type === "timeOfDay" && typeof patch.startHour === "number" ? patch.startHour : fallbackStartHour,
      endHour: patch.type === "timeOfDay" && typeof patch.endHour === "number" ? patch.endHour : fallbackEndHour
    });

    if (patch.type === "state") conditions[conditionIndex] = asState(target.type === "state" ? target.state : "storm");
    else if (patch.type === "season") conditions[conditionIndex] = asSeason(target.type === "season" ? target.seasonId : "");
    else if (patch.type === "timeOfDay") conditions[conditionIndex] = asTimeOfDay(target.type === "timeOfDay" ? target.startHour : 22, target.type === "timeOfDay" ? target.endHour : 6);
    else {
      conditions[conditionIndex] =
        target.type === "metric" || target.type === undefined
          ? asMetric({ metric: target.metric, operator: target.operator, value: target.value })
          : asMetric();
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