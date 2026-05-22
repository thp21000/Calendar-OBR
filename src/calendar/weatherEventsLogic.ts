import { generateWeatherForTime } from "./weatherLogic";
import { absoluteDayToCalendarDate } from "./dateEngine";
import { getSeasonForDate } from "./seasonsLogic";
import type { CalendarProject, InternalTime, WeatherCondition, WeatherEvent, WeatherSnapshot } from "../domain/types";

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
    const metricPatch = patch.type === "metric" || (patch.type === undefined && ("metric" in patch || "operator" in patch || "value" in patch))
      ? patch
      : undefined;
    if (target.type === "state") {
      const nextType = patch.type === "metric" ? "metric" : patch.type === "season" ? "season" : patch.type === "timeOfDay" ? "timeOfDay" : "state";
      conditions[conditionIndex] =
        nextType === "state"
          ? {
              type: "state",
              state: patch.type === "state" ? patch.state ?? target.state : "storm"
            }
          : nextType === "season"
          ? { type: "season", seasonId: "seasonId" in patch && typeof patch.seasonId === "string" ? patch.seasonId : "" }
          : nextType === "timeOfDay"
          ? { type: "timeOfDay", startHour: "startHour" in patch && typeof patch.startHour === "number" ? patch.startHour : 22, endHour: "endHour" in patch && typeof patch.endHour === "number" ? patch.endHour : 6 }
          : {
              type: "metric",
              metric: metricPatch?.metric ?? "temperature",
              operator: metricPatch?.operator ?? "gte",
              value: metricPatch?.value ?? 35
            };
    } else if (target.type === "season") {
      if (patch.type === "state") conditions[conditionIndex] = { type: "state", state: patch.state ?? "storm" };
      else if (patch.type === "timeOfDay") conditions[conditionIndex] = { type: "timeOfDay", startHour: patch.startHour ?? 22, endHour: patch.endHour ?? 6 };
      else if (patch.type === "metric") conditions[conditionIndex] = { type: "metric", metric: patch.metric ?? "temperature", operator: patch.operator ?? "gte", value: patch.value ?? 35 };
      else conditions[conditionIndex] = { type: "season", seasonId: "seasonId" in patch && typeof patch.seasonId === "string" ? patch.seasonId : target.seasonId };
    } else if (target.type === "timeOfDay") {
      if (patch.type === "state") conditions[conditionIndex] = { type: "state", state: patch.state ?? "storm" };
      else if (patch.type === "season") conditions[conditionIndex] = { type: "season", seasonId: patch.seasonId ?? "" };
      else if (patch.type === "metric") conditions[conditionIndex] = { type: "metric", metric: patch.metric ?? "temperature", operator: patch.operator ?? "gte", value: patch.value ?? 35 };
      else {
        conditions[conditionIndex] = {
          type: "timeOfDay",
          startHour: "startHour" in patch && typeof patch.startHour === "number" ? patch.startHour : target.startHour,
          endHour: "endHour" in patch && typeof patch.endHour === "number" ? patch.endHour : target.endHour
        };
      }
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