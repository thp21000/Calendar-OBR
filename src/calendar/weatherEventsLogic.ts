import { generateWeatherForTime } from "./weatherLogic";
import { absoluteDayToCalendarDate, addHours } from "./dateEngine";
import { getMoonPhaseForDate } from "./moonLogic";
import { getSeasonForDate } from "./seasonsLogic";
import { getWeatherBiomeState } from "./weather/biomes";
import { getAdventureContextConditionDetails, isAdventureContextConditionMet } from "./adventureContext";
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

  if (condition.type === "adventureContext") {
    if (!context?.project) return false;
    return isAdventureContextConditionMet(context.project, condition);
  }

  if (condition.type === "biome") {
    const biomeIds = condition.biomeIds ?? [];
    if (biomeIds.length === 0) return true;
    if (!context?.project) return false;
    return biomeIds.includes(getWeatherBiomeState(context.project).currentBiomeId);
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

export const getCurrentlyMatchingWeatherEvents = (
  project: CalendarProject,
  weather: WeatherSnapshot,
  currentTime: InternalTime
): WeatherEvent[] =>
  project.weatherEvents.filter((event) => {
    const status = event.status ?? "active";
    if (event.enabled === false || status === "archived" || status === "disabled") return false;
    return isWeatherEventTriggered(weather, event, { project, time: currentTime });
  });

export const getActiveWeatherEventsWithDuration = (
  project: CalendarProject,
  weather: WeatherSnapshot,
  currentTime: InternalTime,
  lastTriggeredAtMinutesByEventId?: Record<string, number>
): WeatherEvent[] => {
  void lastTriggeredAtMinutesByEventId;
  return project.weatherEvents.filter((event) => {
    if (event.enabled === false || event.status === "archived" || event.status === "disabled") return false;
    
   return isWeatherEventTriggered(weather, event, { project, time: currentTime });
  });
};

export const getNewlyTriggeredWeatherEventsBetween = (
  project: CalendarProject,
  fromTime: InternalTime,
  toTime: InternalTime,
  lastTriggeredAtMinutesByEventId?: Record<string, number>
): WeatherEvent[] => {
  void lastTriggeredAtMinutesByEventId;
  return updateWeatherEventLifecycles(project, fromTime, toTime).newlyTriggered;
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
    weatherEvents: project.weatherEvents.map((event) => {
      if (!ids.has(event.id)) return event;
      const nextStatus: NonNullable<WeatherEvent["status"]> = event.disableAfterTrigger ? "disabled" : event.archiveAfterTrigger ? "archived" : "triggered";
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
      return {
        ...event,
        lastTriggeredAtMinutes: at,
        activeStartedAtMinutes: nextStatus === "triggered" ? at : undefined,
        status: nextStatus,
        triggerHistory: nextHistory
      };
    })
  };
};

export const toAbsoluteMinutes = (time: InternalTime): number => time.absoluteDay * 24 * 60 + time.hour * 60 + time.minute;

export const isWithinCooldownWindow = (endedAtMinutes: number, currentMinutes: number, cooldownHours?: number): boolean => {
  if (typeof cooldownHours !== "number") return false;
  const safeHours = Math.max(0, cooldownHours);
  return currentMinutes - endedAtMinutes < safeHours * 60;
};

export const generateWeatherForEventConditions = (project: CalendarProject, time: InternalTime): WeatherSnapshot | undefined =>
  generateWeatherForTime(
    {
      ...project,
      weatherOverrides: (project.weatherOverrides ?? []).filter((override) => override.source !== "weatherEvent")
    },
    time.absoluteDay,
    time.hour,
    time.minute
  );

const isWeatherEventBlockedByCooldown = (event: WeatherEvent, currentMinutes: number): boolean =>
  typeof event.lastEndedAtMinutes === "number" && isWithinCooldownWindow(event.lastEndedAtMinutes, currentMinutes, event.cooldownHours);

const buildTriggerHistoryEntry = (
  event: WeatherEvent,
  at: number,
  weather?: WeatherSnapshot
): WeatherEventTriggerHistoryEntry => ({
  id: `weather-trigger-${event.id}-${at}`,
  triggeredAtMinutes: at,
  weatherState: weather?.state,
  dominantState: weather?.dominantState,
  trendKind: weather?.trendKind,
  temperature: weather?.temperature,
  rain: weather?.rain,
  windSpeed: weather?.windSpeed
});

const eventOverrideKey = (eventId: string) => `weather-effect-${eventId}-`;

const isOverrideForWeatherEvent = (override: WeatherOverride, eventId: string): boolean =>
  (override.source === "weatherEvent" && override.sourceId === eventId) || override.id.startsWith(eventOverrideKey(eventId));

const buildWeatherEventOverrideSegments = (
  event: WeatherEvent,
  startAbsoluteMinutes: number,
  endAbsoluteMinutes: number
): WeatherOverride[] => {
  if ((event.kind ?? "informational") !== "weatherEffect" || !event.effect) return [];
  if (endAbsoluteMinutes <= startAbsoluteMinutes) return [];
  const hasAnyEffect = Object.values(event.effect).some((value) => value !== undefined && value !== null);
  if (!hasAnyEffect) return [];

  const overrides: WeatherOverride[] = [];
  for (let cursor = startAbsoluteMinutes; cursor < endAbsoluteMinutes;) {
    const absoluteDay = Math.floor(cursor / (24 * 60));
    const dayStart = absoluteDay * 24 * 60;
    const startMinuteOfDay = cursor - dayStart;
    const segmentEnd = Math.min(endAbsoluteMinutes, dayStart + 24 * 60);
    const endMinuteOfDay = segmentEnd - dayStart;
    overrides.push({
      id: `${eventOverrideKey(event.id)}${absoluteDay}-${startMinuteOfDay}-${endMinuteOfDay}`,
      absoluteDay,
      startMinuteOfDay,
      endMinuteOfDay,
      label: event.name,
      gmNote: event.summary ?? event.gmDescription,
      source: "weatherEvent",
      sourceId: event.id,
      ...event.effect
    });
    cursor = segmentEnd;
  }
  return overrides;
};

const replaceWeatherEventOverrides = (
  overrides: WeatherOverride[] | undefined,
  event: WeatherEvent,
  startAbsoluteMinutes: number,
  endAbsoluteMinutes: number
): WeatherOverride[] => [
  ...(overrides ?? []).filter((override) => !isOverrideForWeatherEvent(override, event.id)),
  ...buildWeatherEventOverrideSegments(event, startAbsoluteMinutes, endAbsoluteMinutes)
];

const endWeatherEventOverrides = (overrides: WeatherOverride[] | undefined, event: WeatherEvent, endedAtMinutes: number): WeatherOverride[] =>
  (overrides ?? []).flatMap((override) => {
    if (!isOverrideForWeatherEvent(override, event.id)) return [override];
    const startMinute = override.startMinuteOfDay ?? 0;
    const endMinute = override.endMinuteOfDay ?? 24 * 60;
    const absoluteStart = override.absoluteDay * 24 * 60 + startMinute;
    const absoluteEnd = override.absoluteDay * 24 * 60 + endMinute;
    if (absoluteStart >= endedAtMinutes) return [];
    if (absoluteEnd <= endedAtMinutes) return [override];
    return [{ ...override, endMinuteOfDay: endedAtMinutes - override.absoluteDay * 24 * 60 }];
  });

const maintainActiveWeatherEffectOverrides = (
  project: CalendarProject,
  activeEvents: WeatherEvent[],
  currentMinutes: number
): WeatherOverride[] => {
  let overrides = project.weatherOverrides ?? [];
  for (const event of activeEvents) {
    if ((event.kind ?? "informational") !== "weatherEffect") continue;
    const start = event.activeStartedAtMinutes ?? event.lastTriggeredAtMinutes ?? currentMinutes;
    overrides = replaceWeatherEventOverrides(overrides, event, start, currentMinutes + 60);
  }
  return overrides;
};

export const updateWeatherEventLifecycles = (
  project: CalendarProject,
  previousTime: InternalTime,
  nextTime: InternalTime
): { project: CalendarProject; newlyTriggered: WeatherEvent[]; ended: WeatherEvent[] } => {
  void previousTime;
  const nextWeather = generateWeatherForEventConditions(project, nextTime);
  if (!nextWeather) return { project: { ...project, currentTime: nextTime }, newlyTriggered: [], ended: [] };

  const nextMinutes = toAbsoluteMinutes(nextTime);
  const newlyTriggered: WeatherEvent[] = [];
  const ended: WeatherEvent[] = [];
  let weatherOverrides = project.weatherOverrides ?? [];

  const weatherEvents = project.weatherEvents.map((event) => {
    const status = event.status ?? "active";
    if (event.enabled === false || status === "archived" || status === "disabled") return event;

    const wasActive = status === "triggered";
    const conditionsAreMet = isWeatherEventTriggered(nextWeather, event, { project, time: nextTime });

    if (wasActive) {
      if (conditionsAreMet) {
        return {
          ...event,
          activeStartedAtMinutes: event.activeStartedAtMinutes ?? event.lastTriggeredAtMinutes ?? nextMinutes
        };
      }
      const finished = {
        ...event,
        status: "active" as const,
        activeStartedAtMinutes: undefined,
        lastEndedAtMinutes: nextMinutes
      };
      weatherOverrides = endWeatherEventOverrides(weatherOverrides, event, nextMinutes);
      ended.push(finished);
      return finished;
    }

    if (!conditionsAreMet) return event;
    if (isWeatherEventBlockedByCooldown(event, nextMinutes)) return event;
    if (!didWeatherEventChanceSucceed(project, event, nextMinutes)) return event;

    const nextStatus: NonNullable<WeatherEvent["status"]> = event.disableAfterTrigger ? "disabled" : event.archiveAfterTrigger ? "archived" : "triggered";
    const triggered = {
      ...event,
      status: nextStatus,
      activeStartedAtMinutes: nextStatus === "triggered" ? nextMinutes : undefined,
      lastTriggeredAtMinutes: nextMinutes,
      triggerHistory: [...(event.triggerHistory ?? []), buildTriggerHistoryEntry(event, nextMinutes, nextWeather)].slice(-10)
    };
    newlyTriggered.push(triggered);
    return triggered;
  });

  const activeEvents = weatherEvents.filter((event) => {
    if (event.enabled === false || event.status !== "triggered") return false;
    return isWeatherEventTriggered(nextWeather, event, { project: { ...project, weatherEvents }, time: nextTime });
  });

  const nextProject = {
    ...project,
    currentTime: nextTime,
    weatherEvents,
    weatherOverrides: maintainActiveWeatherEffectOverrides({ ...project, weatherOverrides }, activeEvents, nextMinutes)
  };

  return { project: nextProject, newlyTriggered, ended };
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
    met: isWeatherConditionMet(weather, condition, { project, time }),
    adventureContext: condition.type === "adventureContext" ? getAdventureContextConditionDetails(project, condition) : undefined
  }));
  const blockedReasons = conditionDiagnostics
    .filter((diagnostic) => !diagnostic.met && diagnostic.condition.type === "biome" && (diagnostic.condition.biomeIds?.length ?? 0) > 0)
    .map(() => "biomeMismatch" as const);
  const requireAll = event.requireAllConditions ?? true;
  const conditionsMet = conditionDiagnostics.length > 0
    ? requireAll
      ? conditionDiagnostics.every((diagnostic) => diagnostic.met)
      : conditionDiagnostics.some((diagnostic) => diagnostic.met)
    : false;
  const nowMinutes = toAbsoluteMinutes(time);
  const lastTriggeredAtMinutes = event.lastTriggeredAtMinutes;
  const activeStartedAtMinutes = event.activeStartedAtMinutes;
  const lastEndedAtMinutes = event.lastEndedAtMinutes;
  const blockedByCooldown = typeof lastEndedAtMinutes === "number"
    ? isWithinCooldownWindow(lastEndedAtMinutes, nowMinutes, event.cooldownHours)
    : false;
  const alreadyActive = status === "triggered" && conditionsMet;

  return {
    conditions: conditionDiagnostics,
    conditionsMet,
    enabled,
    blockedByStatus,
    blockedByCooldown,
    alreadyActive,
    status,
    triggerChancePercent: normalizeTriggerChancePercent(event.triggerChancePercent),
    lastTriggeredAtMinutes,
    activeStartedAtMinutes,
    lastEndedAtMinutes,
    cooldownHours: event.cooldownHours,
    blockedReasons,
    isCurrentlyTriggerable: enabled && !blockedByStatus && !blockedByCooldown && !alreadyActive && conditionsMet
  };
};

export type WeatherEventUpcomingTriggerWindow = {
  startTime: InternalTime;
  endTime: InternalTime;
  windowHours: number;
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
    const weather = generateWeatherForEventConditions(project, scannedTime);
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
      activeWindow.windowHours += 1;
      activeWindow.matchedConditionsCount = Math.max(activeWindow.matchedConditionsCount, matchedConditionsCount);
      activeWindow.totalConditionsCount = Math.max(activeWindow.totalConditionsCount, totalConditionsCount);
    } else {
      activeWindow = {
        startTime: scannedTime,
        endTime,
        windowHours: 1,
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
  void lastTriggeredAtMinutesByEventId;
  const activeNow = getCurrentlyMatchingWeatherEvents(project, weather, currentTime);
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
    activeStartedAtMinutes: undefined,
    lastEndedAtMinutes: undefined,
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

export const addWeatherBiomeCondition = (project: CalendarProject, eventId: string): CalendarProject => ({
  ...project,
  weatherEvents: project.weatherEvents.map((event) =>
    event.id === eventId
      ? {
          ...event,
          conditions: [...(event.conditions ?? []), { type: "biome", biomeIds: [getWeatherBiomeState(project).currentBiomeId] }]
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
    const asBiome = (fallbackBiomeIds = [getWeatherBiomeState(project).currentBiomeId]) => ({
      type: "biome" as const,
      biomeIds: patch.type === "biome" && Array.isArray(patch.biomeIds) ? patch.biomeIds : fallbackBiomeIds
    });

    if (patch.type === "state") conditions[conditionIndex] = asState(target.type === "state" ? target.state : "storm");
    else if (patch.type === "season") conditions[conditionIndex] = asSeason(target.type === "season" ? target.seasonId : "");
    else if (patch.type === "timeOfDay") conditions[conditionIndex] = asTimeOfDay(target.type === "timeOfDay" ? target.startHour : 22, target.type === "timeOfDay" ? target.endHour : 6);
    else if (patch.type === "dominantState") conditions[conditionIndex] = asDominantState(target.type === "dominantState" ? target.state : "heavyRain");
    else if (patch.type === "windDirection") conditions[conditionIndex] = asWindDirection(target.type === "windDirection" ? target.direction : "N");
    else if (patch.type === "moonPhase") conditions[conditionIndex] = asMoonPhase(target.type === "moonPhase" ? target.moonId : "", target.type === "moonPhase" ? target.phaseId : "full");
    else if (patch.type === "biome") conditions[conditionIndex] = asBiome(target.type === "biome" ? target.biomeIds ?? [] : [getWeatherBiomeState(project).currentBiomeId]);
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