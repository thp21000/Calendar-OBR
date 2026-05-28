import { generateWeatherForTime } from "./weatherLogic";
import { absoluteDayToCalendarDate, addHours } from "./dateEngine";
import { getMoonPhaseForDate } from "./moonLogic";
import { getSeasonForDate } from "./seasonsLogic";
import type { CalendarProject, InternalTime, WeatherCondition, WeatherConditionMetric, WeatherEvent, WeatherEventTriggerHistoryEntry, WeatherSnapshot, WeatherState, WeatherOverride } from "../domain/types";

export type PlayerVisibleWeatherEvent = {
  id: string;
  name: string;
  icon?: string;
  summary?: string;
  playerDescription?: string;
  link?: string;
};

type WeatherConditionContext = {
  project?: CalendarProject;
  time?: InternalTime;
};

export const isWeatherConditionMet = (weather: WeatherSnapshot, condition: WeatherCondition, context?: WeatherConditionContext): boolean => {
  if (condition.type === "state") {
    return (weather.state ?? "clear") === condition.state;
  }
  if (condition.type === "dominantState") {
    return weather.dominantState === condition.state;
  }
  if (condition.type === "windDirection") {
    return weather.windDirection === condition.direction;
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
  if (condition.type === "moonPhase") {
    if (!context?.project || !context?.time) return false;
    const moon = context.project.moons.find((m) => m.id === condition.moonId);
    if (!moon) return false;
    return getMoonPhaseForDate(moon, context.time.absoluteDay).id === condition.phaseId;
  }

  const metricValue = weather[condition.metric];
  if (typeof metricValue !== "number") return false;
  if (condition.operator === "gte") return metricValue >= condition.value;
  return metricValue <= condition.value;
};

type WeatherEventCompat = Omit<WeatherEvent, "conditions" | "enabled" | "requireAllConditions"> & {
  conditions?: WeatherCondition[];
  enabled?: boolean;
  requireAllConditions?: boolean;
};

export const isWeatherEventTriggered = (weather: WeatherSnapshot, event: WeatherEventCompat, context?: WeatherConditionContext): boolean => {
  const status = event.status ?? "active";
  if (event.enabled === false || status === "archived" || status === "disabled") return false;
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
    const chance = normalizeTriggerChancePercent(event.triggerChancePercent);
    if (chance >= 100 && isWeatherEventTriggered(weather, event, { project, time: currentTime })) return true;
    if (event.enabled === false || event.status === "archived" || event.status === "disabled") return false;
    const lastTriggeredAt = typeof event.lastTriggeredAtMinutes === "number" ? event.lastTriggeredAtMinutes : lastTriggeredAtMinutesByEventId?.[event.id];
    if (typeof lastTriggeredAt !== "number") return false;
    return isWithinDurationWindow(lastTriggeredAt, nowMinutes, getWeatherEventDurationHours(event));
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
    if (event.enabled === false || event.status === "archived" || event.status === "disabled") return false;
    const lastTriggeredAt = typeof event.lastTriggeredAtMinutes === "number" ? event.lastTriggeredAtMinutes : lastTriggeredAtMinutesByEventId?.[event.id];
    if (typeof lastTriggeredAt === "number") {
      if (isWithinDurationWindow(lastTriggeredAt, toMinutes, getWeatherEventDurationHours(event))) return false;
      if (isWithinCooldownWindow(lastTriggeredAt, toMinutes, event.cooldownHours)) return false;
    }
    if (fromTriggeredIds.has(event.id)) return false;
    return didWeatherEventChanceSucceed(project, event, toMinutes);
  });
};

export const applyWeatherEventTriggerActions = (
  project: CalendarProject,
  triggeredWeatherEvents: WeatherEvent[],
  triggerTime: InternalTime,
  weather?: WeatherSnapshot
): CalendarProject => {
  const ids = new Set(triggeredWeatherEvents.map((event) => event.id));
  const at = toAbsoluteMinutes(triggerTime);
  return {
    ...project,
    weatherOverrides: applyWeatherEffectsToOverrides(project, triggeredWeatherEvents, triggerTime),
    weatherEvents: project.weatherEvents.map((event) => {
      if (!ids.has(event.id)) return event;
      const nextStatus = event.disableAfterTrigger ? "disabled" : event.archiveAfterTrigger ? "archived" : "triggered";
      const entry: WeatherEventTriggerHistoryEntry = {
        id: `weather-trigger-${event.id}-${at}`,
        triggeredAtMinutes: at,
        weatherState: weather?.state,
        dominantState: weather?.dominantState,
        temperature: weather?.temperature,
        rain: weather?.rain,
        windSpeed: weather?.windSpeed
      };
      const nextHistory = [...(event.triggerHistory ?? []), entry].slice(-10);
      return { ...event, lastTriggeredAtMinutes: at, status: nextStatus, triggerHistory: nextHistory };
    })
  };
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

export const getWeatherEventDurationHours = (event: WeatherEvent): number | undefined => {
  if (typeof event.durationHours === "number") return event.durationHours;
  if ((event.kind ?? "informational") === "weatherEffect") return 1;
  if (normalizeTriggerChancePercent(event.triggerChancePercent) < 100) return 1;
  return undefined;
};

export const getWeatherEventDiagnostics = (
  project: CalendarProject,
  event: WeatherEvent,
  time: InternalTime,
  weather: WeatherSnapshot
) => {
  const status = event.status ?? "active";
  const enabled = event.enabled !== false;
  const blockedByStatus = status === "archived" || status === "disabled";
  const conditions = event.conditions ?? [];
  const conditionDiagnostics = conditions.map((condition) => ({
    condition,
    met: isWeatherConditionMet(weather, condition, { project, time })
  }));
  const requireAll = event.requireAllConditions ?? true;
  const conditionsMet = conditionDiagnostics.length > 0
    ? requireAll
      ? conditionDiagnostics.every((diagnostic) => diagnostic.met)
      : conditionDiagnostics.some((diagnostic) => diagnostic.met)
    : false;
  const nowMinutes = toAbsoluteMinutes(time);
  const lastTriggeredAtMinutes = event.lastTriggeredAtMinutes;
  const durationHours = getWeatherEventDurationHours(event);
  const blockedByCooldown = typeof lastTriggeredAtMinutes === "number"
    ? isWithinCooldownWindow(lastTriggeredAtMinutes, nowMinutes, event.cooldownHours)
    : false;
  const alreadyActive = typeof lastTriggeredAtMinutes === "number"
    ? isWithinDurationWindow(lastTriggeredAtMinutes, nowMinutes, durationHours)
    : false;

  return {
    conditions: conditionDiagnostics,
    conditionsMet,
    enabled,
    blockedByStatus,
    blockedByCooldown,
    alreadyActive,
    status,
    triggerChancePercent: normalizeTriggerChancePercent(event.triggerChancePercent),
    durationHours,
    lastTriggeredAtMinutes,
    cooldownHours: event.cooldownHours,
    isCurrentlyTriggerable: enabled && !blockedByStatus && !blockedByCooldown && !alreadyActive && conditionsMet
  };
};

export type WeatherEventUpcomingTriggerWindow = {
  startTime: InternalTime;
  endTime: InternalTime;
  durationHours: number;
  matchedConditionsCount: number;
  totalConditionsCount: number;
};

export const getWeatherEventUpcomingTriggerWindows = (
  project: CalendarProject,
  event: WeatherEvent,
  fromTime: InternalTime,
  scanHours = 48
): WeatherEventUpcomingTriggerWindow[] => {
  const status = event.status ?? "active";
  const conditions = event.conditions ?? [];
  if (event.enabled === false || status === "archived" || status === "disabled" || conditions.length === 0) return [];

  const safeScanHours = Math.max(0, Math.floor(scanHours));
  const windows: WeatherEventUpcomingTriggerWindow[] = [];
  let activeWindow: WeatherEventUpcomingTriggerWindow | undefined;

  for (let offset = 0; offset < safeScanHours; offset += 1) {
    const scannedTime = addHours(fromTime, offset);
    const weather = generateWeatherForTime(project, scannedTime.absoluteDay, scannedTime.hour);
    if (!weather) {
      activeWindow = undefined;
      continue;
    }

    const diagnostics = getWeatherEventDiagnostics(project, event, scannedTime, weather);
    if (!diagnostics.isCurrentlyTriggerable) {
      activeWindow = undefined;
      continue;
    }

    const matchedConditionsCount = diagnostics.conditions.filter((condition) => condition.met).length;
    const totalConditionsCount = diagnostics.conditions.length;
    const endTime = addHours(scannedTime, 1);

    if (activeWindow) {
      activeWindow.endTime = endTime;
      activeWindow.durationHours += 1;
      activeWindow.matchedConditionsCount = Math.max(activeWindow.matchedConditionsCount, matchedConditionsCount);
      activeWindow.totalConditionsCount = Math.max(activeWindow.totalConditionsCount, totalConditionsCount);
    } else {
      activeWindow = {
        startTime: scannedTime,
        endTime,
        durationHours: 1,
        matchedConditionsCount,
        totalConditionsCount
      };
      windows.push(activeWindow);
    }
  }

  return windows.slice(0, 5);
};

export const getPlayerVisibleWeatherEvents = (
  project: CalendarProject,
  weather: WeatherSnapshot,
  currentTime: InternalTime,
  lastTriggeredAtMinutesByEventId?: Record<string, number>
): PlayerVisibleWeatherEvent[] => {
  const activeNow = getActiveWeatherEventsWithDuration(project, weather, currentTime, lastTriggeredAtMinutesByEventId);
  const activeIds = new Set(activeNow.map((event) => event.id));
  return project.weatherEvents.filter((event) => {
    if (event.enabled === false) return false;
    if (event.status === "archived" || event.status === "disabled") return false;
    const visibility = event.visibility ?? "gm";
    if (visibility === "gm") return false;
    if (visibility === "players") return activeIds.has(event.id);
    if (visibility === "revealOnTrigger") return activeIds.has(event.id);
    return false;
  }).map((event) => ({
    id: event.id,
    name: event.name,
    icon: event.icon,
    summary: event.summary || undefined,
    playerDescription: event.playerDescription || undefined,
    link: event.link || undefined
  }));
};

export const createDefaultWeatherEvent = (locale: CalendarProject["locale"]): WeatherEvent => ({
  id: `weather-event-${Date.now()}`,
  name: locale === "fr" ? "Nouvel événement météo" : "New weather event",
  icon: "🌩️",
  summary: "",
  link: "",
  gmDescription: "",
  playerDescription: "",
  visibility: "gm",
  notifyOnTrigger: true,
  status: "active",
  archiveAfterTrigger: false,
  disableAfterTrigger: false,
  kind: "informational",
  triggerChancePercent: 100,
  enabled: true,
  requireAllConditions: true,
  conditions: [{ type: "metric", metric: "temperature", operator: "gte", value: 35 }]
});

const normalizeTriggerChancePercent = (chance: number | undefined): number => {
  if (typeof chance !== "number" || !Number.isFinite(chance)) return 100;
  return Math.max(0, Math.min(100, Math.round(chance)));
};

const didWeatherEventChanceSucceed = (project: CalendarProject, event: WeatherEvent, absoluteMinutes: number): boolean => {
  const chance = normalizeTriggerChancePercent(event.triggerChancePercent);
  if (chance >= 100) return true;
  if (chance <= 0) return false;
  const seed = `${project.weatherSettings.seed ?? project.id}|${event.id}|${absoluteMinutes}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const roll = ((hash >>> 0) % 10000) / 100;
  return roll < chance;
};

const applyWeatherEffectsToOverrides = (project: CalendarProject, triggeredWeatherEvents: WeatherEvent[], triggerTime: InternalTime): WeatherOverride[] => {
  const existing = [...(project.weatherOverrides ?? [])];
  for (const event of triggeredWeatherEvents) {
    if ((event.kind ?? "informational") !== "weatherEffect" || !event.effect) continue;
    const effect = event.effect;
    const hasAnyEffect = Object.values(effect).some((value) => value !== undefined && value !== null);
    if (!hasAnyEffect) continue;
    const startAbsoluteMinutes = toAbsoluteMinutes(triggerTime);
    const durationHours = getWeatherEventDurationHours(event) ?? 1;
    const endAbsoluteMinutes = startAbsoluteMinutes + durationHours * 60;
    for (let dayMinuteCursor = startAbsoluteMinutes; dayMinuteCursor < endAbsoluteMinutes;) {
      const absoluteDay = Math.floor(dayMinuteCursor / (24 * 60));
      const dayStartAbsoluteMinutes = absoluteDay * 24 * 60;
      const startMinuteOfDay = dayMinuteCursor - dayStartAbsoluteMinutes;
      const endOfDayAbsoluteMinutes = dayStartAbsoluteMinutes + 24 * 60;
      const segmentEndAbsoluteMinutes = Math.min(endAbsoluteMinutes, endOfDayAbsoluteMinutes);
      const endMinuteOfDay = segmentEndAbsoluteMinutes - dayStartAbsoluteMinutes;
      const overrideId = `weather-effect-${event.id}-${absoluteDay}-${startMinuteOfDay}-${endMinuteOfDay}`;
      const current = existing.find((item) => item.id === overrideId);
      const payload: Partial<WeatherOverride> = { ...effect };
      if (current) {
        Object.assign(current, payload, { id: current.id, absoluteDay: current.absoluteDay, startMinuteOfDay: current.startMinuteOfDay, endMinuteOfDay: current.endMinuteOfDay, label: current.label ?? event.name, gmNote: current.gmNote ?? event.summary ?? event.gmDescription });
      } else {
        existing.push({ id: overrideId, absoluteDay, startMinuteOfDay, endMinuteOfDay, label: event.name, gmNote: event.summary ?? event.gmDescription, ...payload });
      }
      dayMinuteCursor = segmentEndAbsoluteMinutes;
    }
  }
  return existing;
};

export const duplicateWeatherEvent = (project: CalendarProject, eventId: string): CalendarProject => {
  const sourceEvent = project.weatherEvents.find((event) => event.id === eventId);
  if (!sourceEvent) return project;

  const suffix = project.locale === "fr" ? "(copie)" : "(copy)";
  const duplicatedEvent: WeatherEvent = {
    ...sourceEvent,
    id: `weather-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `${sourceEvent.name} ${suffix}`.trim(),
    status: "active",
    enabled: true,
    lastTriggeredAtMinutes: undefined,
    triggerHistory: []
  };

  return {
    ...project,
    weatherEvents: [...project.weatherEvents, duplicatedEvent]
  };
};

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

export const addWeatherDominantStateCondition = (project: CalendarProject, eventId: string): CalendarProject => ({
  ...project,
  weatherEvents: project.weatherEvents.map((event) =>
    event.id === eventId
      ? {
          ...event,
          conditions: [...(event.conditions ?? []), { type: "dominantState", state: "heavyRain" }]
        }
      : event
  )
});

export const addWeatherWindDirectionCondition = (project: CalendarProject, eventId: string): CalendarProject => ({
  ...project,
  weatherEvents: project.weatherEvents.map((event) =>
    event.id === eventId
      ? {
          ...event,
          conditions: [...(event.conditions ?? []), { type: "windDirection", direction: "N" }]
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

export const addWeatherMoonPhaseCondition = (project: CalendarProject, eventId: string): CalendarProject => ({
  ...project,
  weatherEvents: project.weatherEvents.map((event) =>
    event.id === eventId
      ? {
          ...event,
          conditions: [...(event.conditions ?? []), { type: "moonPhase", moonId: project.moons[0]?.id ?? "", phaseId: "full" }]
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
    const asMetric = (fallback?: { metric: WeatherConditionMetric; operator: "gte" | "lte"; value: number }) => ({
      type: "metric" as const,
      metric: patch.type === "metric" && patch.metric ? patch.metric : ("metric" in patch && patch.metric ? patch.metric : fallback?.metric ?? "temperature"),
      operator: patch.type === "metric" && patch.operator ? patch.operator : ("operator" in patch && patch.operator ? patch.operator : fallback?.operator ?? "gte"),
      value: patch.type === "metric" && typeof patch.value === "number" ? patch.value : ("value" in patch && typeof patch.value === "number" ? patch.value : fallback?.value ?? 35)
    });
    const asState = (fallbackState: WeatherState = "storm") => ({ type: "state" as const, state: patch.type === "state" && patch.state ? patch.state : fallbackState });
    const asSeason = (fallbackSeasonId = "") => ({ type: "season" as const, seasonId: patch.type === "season" && typeof patch.seasonId === "string" ? patch.seasonId : fallbackSeasonId });
    const asDominantState = (fallbackState: WeatherState = "heavyRain") => ({ type: "dominantState" as const, state: patch.type === "dominantState" && patch.state ? patch.state : fallbackState });
    const asWindDirection = (fallbackDirection: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW" = "N") => ({ type: "windDirection" as const, direction: patch.type === "windDirection" && patch.direction ? patch.direction : fallbackDirection });
    const asMoonPhase = (fallbackMoonId = "", fallbackPhaseId: "new" | "waxingCrescent" | "firstQuarter" | "waxingGibbous" | "full" | "waningGibbous" | "lastQuarter" | "waningCrescent" = "full") => ({
      type: "moonPhase" as const,
      moonId: patch.type === "moonPhase" && typeof patch.moonId === "string" ? patch.moonId : fallbackMoonId,
      phaseId: patch.type === "moonPhase" && patch.phaseId ? patch.phaseId : fallbackPhaseId
    });
    const asTimeOfDay = (fallbackStartHour = 22, fallbackEndHour = 6) => ({
      type: "timeOfDay" as const,
      startHour: patch.type === "timeOfDay" && typeof patch.startHour === "number" ? patch.startHour : fallbackStartHour,
      endHour: patch.type === "timeOfDay" && typeof patch.endHour === "number" ? patch.endHour : fallbackEndHour
    });

    if (patch.type === "state") conditions[conditionIndex] = asState(target.type === "state" ? target.state : "storm");
    else if (patch.type === "season") conditions[conditionIndex] = asSeason(target.type === "season" ? target.seasonId : "");
    else if (patch.type === "timeOfDay") conditions[conditionIndex] = asTimeOfDay(target.type === "timeOfDay" ? target.startHour : 22, target.type === "timeOfDay" ? target.endHour : 6);
    else if (patch.type === "dominantState") conditions[conditionIndex] = asDominantState(target.type === "dominantState" ? target.state : "heavyRain");
    else if (patch.type === "windDirection") conditions[conditionIndex] = asWindDirection(target.type === "windDirection" ? target.direction : "N");
    else if (patch.type === "moonPhase") conditions[conditionIndex] = asMoonPhase(target.type === "moonPhase" ? target.moonId : "", target.type === "moonPhase" ? target.phaseId : "full");
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