import type { EventDisplayHistory, EventDisplayHistoryEntry, EventDisplaySettings, EventDisplaySeverity, MoonEvent, WeatherEvent } from "../domain/types";

type DisplayableEvent = (WeatherEvent | MoonEvent) & { id: string; phaseId?: string };

export type EventDisplayHiddenReason = "family" | "limit" | "priority";

export type VisibleEventSelection<TEvent> = {
  visibleEvents: TEvent[];
  hiddenEvents: TEvent[];
  hiddenReasons: Record<string, EventDisplayHiddenReason>;
  updatedHistory: EventDisplayHistory;
};

export const DEFAULT_EVENT_DISPLAY_SETTINGS: EventDisplaySettings = {
  weatherFamilyArbitrationEnabled: false,
  weatherDisplayLimitEnabled: false,
  maxVisibleWeatherEvents: 2,
  weatherAntiRepeatEnabled: false,
  weatherAntiRepeatWindowHours: 48,
  lunarPhaseArbitrationEnabled: false,
  lunarDisplayLimitEnabled: false,
  maxVisibleLunarEventsPerPhase: 1,
  lunarAntiRepeatEnabled: false,
  lunarAntiRepeatWindowHours: 48
};

export const DEFAULT_EVENT_DISPLAY_HISTORY: EventDisplayHistory = {
  weatherEvents: {},
  weatherFamilies: {},
  lunarEvents: {},
  lunarFamilies: {}
};

const severityBonus: Record<EventDisplaySeverity, number> = {
  ambient: 0,
  minor: 10,
  standard: 25,
  major: 50,
  critical: 100
};

const clampInteger = (value: unknown, fallback: number, min: number, max: number): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.min(max, Math.trunc(value)))
    : fallback;

const isSeverity = (value: unknown): value is EventDisplaySeverity =>
  value === "ambient" || value === "minor" || value === "standard" || value === "major" || value === "critical";

export const normalizeEventDisplaySettings = (input: unknown): EventDisplaySettings => {
  const source = typeof input === "object" && input !== null && !Array.isArray(input) ? input as Partial<EventDisplaySettings> : {};
  return {
    weatherFamilyArbitrationEnabled: typeof source.weatherFamilyArbitrationEnabled === "boolean" ? source.weatherFamilyArbitrationEnabled : DEFAULT_EVENT_DISPLAY_SETTINGS.weatherFamilyArbitrationEnabled,
    weatherDisplayLimitEnabled: typeof source.weatherDisplayLimitEnabled === "boolean" ? source.weatherDisplayLimitEnabled : DEFAULT_EVENT_DISPLAY_SETTINGS.weatherDisplayLimitEnabled,
    maxVisibleWeatherEvents: clampInteger(source.maxVisibleWeatherEvents, DEFAULT_EVENT_DISPLAY_SETTINGS.maxVisibleWeatherEvents, 1, 20),
    weatherAntiRepeatEnabled: typeof source.weatherAntiRepeatEnabled === "boolean" ? source.weatherAntiRepeatEnabled : DEFAULT_EVENT_DISPLAY_SETTINGS.weatherAntiRepeatEnabled,
    weatherAntiRepeatWindowHours: clampInteger(source.weatherAntiRepeatWindowHours, DEFAULT_EVENT_DISPLAY_SETTINGS.weatherAntiRepeatWindowHours, 1, 24 * 30),
    lunarPhaseArbitrationEnabled: typeof source.lunarPhaseArbitrationEnabled === "boolean" ? source.lunarPhaseArbitrationEnabled : DEFAULT_EVENT_DISPLAY_SETTINGS.lunarPhaseArbitrationEnabled,
    lunarDisplayLimitEnabled: typeof source.lunarDisplayLimitEnabled === "boolean" ? source.lunarDisplayLimitEnabled : DEFAULT_EVENT_DISPLAY_SETTINGS.lunarDisplayLimitEnabled,
    maxVisibleLunarEventsPerPhase: clampInteger(source.maxVisibleLunarEventsPerPhase, DEFAULT_EVENT_DISPLAY_SETTINGS.maxVisibleLunarEventsPerPhase, 1, 20),
    lunarAntiRepeatEnabled: typeof source.lunarAntiRepeatEnabled === "boolean" ? source.lunarAntiRepeatEnabled : DEFAULT_EVENT_DISPLAY_SETTINGS.lunarAntiRepeatEnabled,
    lunarAntiRepeatWindowHours: clampInteger(source.lunarAntiRepeatWindowHours, DEFAULT_EVENT_DISPLAY_SETTINGS.lunarAntiRepeatWindowHours, 1, 24 * 30)
  };
};

const sanitizeHistoryRecord = (value: unknown): Record<string, EventDisplayHistoryEntry> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return [];
    const record = entry as Record<string, unknown>;
    if (typeof record.lastDisplayedAtMinutes !== "number" || !Number.isFinite(record.lastDisplayedAtMinutes)) return [];
    return [[key, {
      lastDisplayedAtMinutes: Math.trunc(record.lastDisplayedAtMinutes),
      ...(typeof record.lastDisplayedDay === "number" && Number.isFinite(record.lastDisplayedDay) ? { lastDisplayedDay: Math.trunc(record.lastDisplayedDay) } : {})
    }]];
  }));
};

export const normalizeEventDisplayHistory = (input: unknown): EventDisplayHistory => {
  const source = typeof input === "object" && input !== null && !Array.isArray(input) ? input as Record<string, unknown> : {};
  return {
    weatherEvents: sanitizeHistoryRecord(source.weatherEvents),
    weatherFamilies: sanitizeHistoryRecord(source.weatherFamilies),
    lunarEvents: sanitizeHistoryRecord(source.lunarEvents),
    lunarFamilies: sanitizeHistoryRecord(source.lunarFamilies)
  };
};

export const getEventDisplayFamilyId = (event: DisplayableEvent): string => event.displayFamilyId?.trim() || event.id;
export const getEventDisplayPriority = (event: DisplayableEvent): number => clampInteger(event.displayPriority, 50, 0, 100);
export const getEventDisplaySeverity = (event: DisplayableEvent): EventDisplaySeverity => isSeverity(event.displaySeverity) ? event.displaySeverity : "standard";
export const getEventDisplayWeight = (event: DisplayableEvent): number => typeof event.displayWeight === "number" && Number.isFinite(event.displayWeight) ? event.displayWeight : 0;

export const sanitizeEventDisplayRules = <T extends Record<string, unknown>>(event: T): T => {
  const next: Record<string, unknown> = { ...event };
  if (typeof next.displayFamilyId !== "string" || !next.displayFamilyId.trim()) delete next.displayFamilyId;
  else next.displayFamilyId = next.displayFamilyId.trim();
  if (typeof next.displayPriority !== "number" || !Number.isFinite(next.displayPriority)) delete next.displayPriority;
  else next.displayPriority = clampInteger(next.displayPriority, 50, 0, 100);
  if (!isSeverity(next.displaySeverity)) delete next.displaySeverity;
  if (typeof next.displayWeight !== "number" || !Number.isFinite(next.displayWeight)) delete next.displayWeight;
  if (typeof next.ignoreDisplayLimit !== "boolean") delete next.ignoreDisplayLimit;
  return next as T;
};

const stableRandomBonus = (seed: string, eventId: string, familyId: string, absoluteMinutes: number): number => {
  const hour = Math.floor(absoluteMinutes / 60);
  const text = `${seed}|${eventId}|${familyId}|${hour}`;
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10001) / 1000;
};

const recentPenalty = (
  event: DisplayableEvent,
  familyId: string,
  eventHistory: Record<string, EventDisplayHistoryEntry>,
  familyHistory: Record<string, EventDisplayHistoryEntry>,
  absoluteMinutes: number,
  windowHours: number,
  enabled: boolean
): number => {
  if (!enabled) return 0;
  const windowMinutes = Math.max(0, windowHours) * 60;
  const eventRecent = eventHistory[event.id] && absoluteMinutes - eventHistory[event.id].lastDisplayedAtMinutes <= windowMinutes;
  const familyRecent = familyHistory[familyId] && absoluteMinutes - familyHistory[familyId].lastDisplayedAtMinutes <= windowMinutes;
  return (eventRecent ? 35 : 0) + (familyRecent ? 25 : 0);
};

const scoreEvent = (
  event: DisplayableEvent,
  familyId: string,
  eventHistory: Record<string, EventDisplayHistoryEntry>,
  familyHistory: Record<string, EventDisplayHistoryEntry>,
  absoluteMinutes: number,
  seed: string,
  antiRepeatEnabled: boolean,
  antiRepeatWindowHours: number
): number =>
  getEventDisplayPriority(event)
  + severityBonus[getEventDisplaySeverity(event)]
  + getEventDisplayWeight(event)
  + stableRandomBonus(seed, event.id, familyId, absoluteMinutes)
  - recentPenalty(event, familyId, eventHistory, familyHistory, absoluteMinutes, antiRepeatWindowHours, antiRepeatEnabled);

const selectGenericEvents = <TEvent extends DisplayableEvent>({
  activeEvents,
  settings,
  history,
  absoluteMinutes,
  seed,
  familyArbitrationEnabled,
  displayLimitEnabled,
  maxVisibleEvents,
  antiRepeatEnabled,
  antiRepeatWindowHours,
  eventHistoryKey,
  familyHistoryKey,
  groupKey
}: {
  activeEvents: TEvent[];
  settings: EventDisplaySettings;
  history: EventDisplayHistory;
  absoluteMinutes: number;
  seed: string;
  familyArbitrationEnabled: boolean;
  displayLimitEnabled: boolean;
  maxVisibleEvents: number;
  antiRepeatEnabled: boolean;
  antiRepeatWindowHours: number;
  eventHistoryKey: "weatherEvents" | "lunarEvents";
  familyHistoryKey: "weatherFamilies" | "lunarFamilies";
  groupKey?: (event: TEvent) => string;
}): VisibleEventSelection<TEvent> => {
  void settings;
  const eventHistory = history[eventHistoryKey];
  const familyHistory = history[familyHistoryKey];
  const scored = activeEvents.map((event, index) => {
    const familyId = getEventDisplayFamilyId(event);
    return {
      event,
      index,
      familyId,
      group: groupKey?.(event) ?? "default",
      score: scoreEvent(event, familyId, eventHistory, familyHistory, absoluteMinutes, seed, antiRepeatEnabled, antiRepeatWindowHours)
    };
  }).sort((a, b) => b.score - a.score || a.index - b.index);

  const hiddenReasons: Record<string, EventDisplayHiddenReason> = {};
  let candidates = scored;
  if (familyArbitrationEnabled) {
    const seen = new Set<string>();
    candidates = [];
    for (const item of scored) {
      const key = `${item.group}:${item.familyId}`;
      if (seen.has(key)) {
        hiddenReasons[item.event.id] = "family";
        continue;
      }
      seen.add(key);
      candidates.push(item);
    }
  }

  const ignored = candidates.filter((item) => item.event.ignoreDisplayLimit);
  const limitedCandidates = candidates.filter((item) => !item.event.ignoreDisplayLimit);
  const visible = [...ignored];
  if (displayLimitEnabled) {
    const byGroup = new Map<string, typeof limitedCandidates>();
    for (const item of limitedCandidates) byGroup.set(item.group, [...(byGroup.get(item.group) ?? []), item]);
    for (const [group, items] of byGroup.entries()) {
      const kept = items.slice(0, maxVisibleEvents);
      const hidden = items.slice(maxVisibleEvents);
      visible.push(...kept);
      for (const item of hidden) hiddenReasons[item.event.id] = familyArbitrationEnabled ? "priority" : "limit";
      byGroup.set(group, kept);
    }
  } else {
    visible.push(...limitedCandidates);
  }

  const visibleIds = new Set(visible.map((item) => item.event.id));
  const visibleEvents = activeEvents.filter((event) => visibleIds.has(event.id));
  const hiddenEvents = activeEvents.filter((event) => !visibleIds.has(event.id));
  const nowEntry = { lastDisplayedAtMinutes: absoluteMinutes, lastDisplayedDay: Math.floor(absoluteMinutes / 1440) };
  const updatedHistory: EventDisplayHistory = {
    ...history,
    [eventHistoryKey]: { ...eventHistory },
    [familyHistoryKey]: { ...familyHistory }
  };
  for (const event of visibleEvents) {
    const familyId = getEventDisplayFamilyId(event);
    updatedHistory[eventHistoryKey][event.id] = nowEntry;
    updatedHistory[familyHistoryKey][familyId] = nowEntry;
  }
  return { visibleEvents, hiddenEvents, hiddenReasons, updatedHistory };
};

export const selectVisibleWeatherEvents = (params: {
  activeEvents: WeatherEvent[];
  settings: EventDisplaySettings;
  history: EventDisplayHistory;
  absoluteMinutes: number;
  seed: string;
}): VisibleEventSelection<WeatherEvent> =>
  selectGenericEvents({
    ...params,
    familyArbitrationEnabled: params.settings.weatherFamilyArbitrationEnabled,
    displayLimitEnabled: params.settings.weatherDisplayLimitEnabled,
    maxVisibleEvents: params.settings.maxVisibleWeatherEvents,
    antiRepeatEnabled: params.settings.weatherAntiRepeatEnabled,
    antiRepeatWindowHours: params.settings.weatherAntiRepeatWindowHours,
    eventHistoryKey: "weatherEvents",
    familyHistoryKey: "weatherFamilies"
  });

export const selectVisibleLunarEvents = (params: {
  activeEvents: MoonEvent[];
  settings: EventDisplaySettings;
  history: EventDisplayHistory;
  absoluteMinutes: number;
  seed: string;
}): VisibleEventSelection<MoonEvent> =>
  selectGenericEvents({
    ...params,
    familyArbitrationEnabled: params.settings.lunarPhaseArbitrationEnabled,
    displayLimitEnabled: params.settings.lunarDisplayLimitEnabled,
    maxVisibleEvents: params.settings.maxVisibleLunarEventsPerPhase,
    antiRepeatEnabled: params.settings.lunarAntiRepeatEnabled,
    antiRepeatWindowHours: params.settings.lunarAntiRepeatWindowHours,
    eventHistoryKey: "lunarEvents",
    familyHistoryKey: "lunarFamilies",
    groupKey: (event) => event.phaseId
  });
