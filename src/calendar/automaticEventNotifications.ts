import { normalizeEventDisplayHistory, normalizeEventDisplaySettings, selectVisibleLunarEvents, selectVisibleWeatherEvents } from "./eventDisplayLogic";
import { filterPlayerPublishableLunarEvents, filterPlayerPublishableWeatherEvents } from "./eventPublicationLogic";
import { getPlayerVisibleEventsForCurrentDay } from "./eventsLogic";
import { getTriggeredMoonEventsAtTime } from "./moonEventsLogic";
import { getCurrentWeather } from "./weatherLogic";
import { getCurrentlyMatchingWeatherEvents, toAbsoluteMinutes } from "./weatherEventsLogic";
import type { AutomaticNotificationState, CalendarEvent, CalendarProject, DatedEventNotificationState, InternalTime, MoonEvent, WeatherEvent } from "../domain/types";

export type AutomaticEventNotificationEffect =
  | { channel: "gm" | "players"; type: "weather"; event: WeatherEvent }
  | { channel: "gm" | "players"; type: "moon"; event: MoonEvent }
  | { channel: "players"; type: "event"; event: CalendarEvent };

export type AutomaticEventNotificationResult = {
  project: CalendarProject;
  effects: AutomaticEventNotificationEffect[];
};

export type AutomaticEventNotificationSettings = {
  notifyAutomaticWeatherEvents: boolean;
  notifyAutomaticLunarEvents: boolean;
  notifyAutomaticEventsToGm: boolean;
  notifyAutomaticEventsToPlayers: boolean;
  notifyDatedEventsToPlayers: boolean;
};

const normalizeAutomaticNotificationState = (input: unknown): AutomaticNotificationState => {
  const source = typeof input === "object" && input !== null && !Array.isArray(input) ? input as Partial<AutomaticNotificationState> : {};
  return {
    weatherEventActivations: sanitizeActivationRecord(source.weatherEventActivations),
    lunarEventActivations: sanitizeActivationRecord(source.lunarEventActivations)
  };
};

const sanitizeDatedEventRecord = (value: unknown): Record<string, true> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter((entry): entry is [string, true] => entry[1] === true));
};

const normalizeDatedEventNotificationState = (input: unknown): DatedEventNotificationState => {
  const source = typeof input === "object" && input !== null && !Array.isArray(input) ? input as Partial<DatedEventNotificationState> : {};
  return { notifiedEventDateKeys: sanitizeDatedEventRecord(source.notifiedEventDateKeys) };
};

export const normalizeAutomaticEventNotificationSettings = (project: CalendarProject): AutomaticEventNotificationSettings => {
  const source = project.notificationSettings;
  return {
    notifyAutomaticWeatherEvents: source?.notifyAutomaticWeatherEvents ?? true,
    notifyAutomaticLunarEvents: source?.notifyAutomaticLunarEvents ?? true,
    notifyAutomaticEventsToGm: source?.notifyAutomaticEventsToGm ?? true,
    notifyAutomaticEventsToPlayers: source?.notifyAutomaticEventsToPlayers ?? true,
    notifyDatedEventsToPlayers: source?.notifyDatedEventsToPlayers ?? true
  };
};

const sanitizeActivationRecord = (value: unknown): Record<string, string> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0));
};

const isAutoPublicMode = (event: { visibilityMode?: string; visibility?: string; status?: string }): boolean => {
  if (event.visibilityMode !== undefined) return event.visibilityMode === "auto";
  if (event.visibility === "players") return true;
  if (event.visibility === "revealOnTrigger") return event.status === "triggered";
  return false;
};

const getActiveWeatherEvents = (project: CalendarProject, time: InternalTime): WeatherEvent[] => {
  const weather = getCurrentWeather({ ...project, currentTime: time });
  return weather ? getCurrentlyMatchingWeatherEvents(project, weather, time) : [];
};

const getActiveLunarEvents = (project: CalendarProject, time: InternalTime): MoonEvent[] =>
  getTriggeredMoonEventsAtTime(project, time);

const getWeatherActivationId = (event: WeatherEvent, time: InternalTime): string => {
  const at = event.activeStartedAtMinutes ?? event.lastTriggeredAtMinutes ?? toAbsoluteMinutes(time);
  return `${event.id}:${at}`;
};

const getLunarActivationId = (event: MoonEvent, time: InternalTime): string =>
  `${event.id}:${time.absoluteDay}:${time.hour}:${time.minute}`;

const getPlayerVisibleWeatherEventIds = (project: CalendarProject, activeEvents: WeatherEvent[], absoluteMinutes: number): Set<string> => {
  const playerView = project.uiSettings.playerView;
  if (playerView?.today.showWeatherEvents === false) return new Set();
  const settings = normalizeEventDisplaySettings(project.eventDisplaySettings);
  const history = normalizeEventDisplayHistory(project.eventDisplayHistory);
  const selection = selectVisibleWeatherEvents({ activeEvents, settings, history, absoluteMinutes, seed: project.weatherSettings.seed ?? project.id });
  return new Set(filterPlayerPublishableWeatherEvents(project, selection.visibleEvents, true).filter(isAutoPublicMode).map((event) => event.id));
};

const getPlayerVisibleLunarEventIds = (project: CalendarProject, activeEvents: MoonEvent[], absoluteMinutes: number): Set<string> => {
  const playerView = project.uiSettings.playerView;
  if (playerView?.today.showMoonEvents === false) return new Set();
  const settings = normalizeEventDisplaySettings(project.eventDisplaySettings);
  const history = normalizeEventDisplayHistory(project.eventDisplayHistory);
  const selection = selectVisibleLunarEvents({ activeEvents, settings, history, absoluteMinutes, seed: project.weatherSettings.seed ?? project.id });
  return new Set(filterPlayerPublishableLunarEvents(project, selection.visibleEvents, true).filter(isAutoPublicMode).map((event) => event.id));
};

const cleanStateForExistingEvents = (state: AutomaticNotificationState, project: CalendarProject): AutomaticNotificationState => {
  const weatherIds = new Set(project.weatherEvents.map((event) => event.id));
  const lunarIds = new Set((project.moonEvents ?? []).map((event) => event.id));
  return {
    weatherEventActivations: Object.fromEntries(Object.entries(state.weatherEventActivations).filter(([id]) => weatherIds.has(id))),
    lunarEventActivations: Object.fromEntries(Object.entries(state.lunarEventActivations).filter(([id]) => lunarIds.has(id)))
  };
};

const cleanDatedStateForExistingEvents = (state: DatedEventNotificationState, project: CalendarProject): DatedEventNotificationState => {
  const eventIds = new Set(project.events.map((event) => event.id));
  return {
    notifiedEventDateKeys: Object.fromEntries(Object.entries(state.notifiedEventDateKeys).filter(([key]) => eventIds.has(key.split(":")[0])))
  };
};

const getPlayerVisibleDatedEventsForToday = (project: CalendarProject): CalendarEvent[] => {
  if (project.uiSettings.playerView?.today.showEvents === false) return [];
  return getPlayerVisibleEventsForCurrentDay(project);
};

export const processAutomaticEventNotifications = (
  previousProject: CalendarProject,
  nextProject: CalendarProject
): AutomaticEventNotificationResult => {
  const settings = normalizeAutomaticEventNotificationSettings(nextProject);
  const previousTime = previousProject.currentTime;
  const nextTime = nextProject.currentTime;
  const absoluteMinutes = toAbsoluteMinutes(nextTime);
  const previousWeatherActiveIds = new Set(getActiveWeatherEvents(previousProject, previousTime).map((event) => event.id));
  const previousLunarActiveIds = new Set(getActiveLunarEvents(previousProject, previousTime).map((event) => event.id));
  const activeWeatherEvents = getActiveWeatherEvents(nextProject, nextTime);
  const activeLunarEvents = getActiveLunarEvents(nextProject, nextTime);
  const playerWeatherIds = getPlayerVisibleWeatherEventIds(nextProject, activeWeatherEvents, absoluteMinutes);
  const playerLunarIds = getPlayerVisibleLunarEventIds(nextProject, activeLunarEvents, absoluteMinutes);
  const state = cleanStateForExistingEvents(normalizeAutomaticNotificationState(nextProject.automaticNotificationState), nextProject);
  const datedState = cleanDatedStateForExistingEvents(normalizeDatedEventNotificationState(nextProject.datedEventNotificationState), nextProject);
  const nextState: AutomaticNotificationState = {
    weatherEventActivations: { ...state.weatherEventActivations },
    lunarEventActivations: { ...state.lunarEventActivations }
  };
  const nextDatedState: DatedEventNotificationState = {
    notifiedEventDateKeys: { ...datedState.notifiedEventDateKeys }
  };
  const effects: AutomaticEventNotificationEffect[] = [];

  if (settings.notifyAutomaticWeatherEvents) {
    for (const event of activeWeatherEvents) {
      if (event.notifyOnTrigger === false || previousWeatherActiveIds.has(event.id)) continue;
      const activationId = getWeatherActivationId(event, nextTime);
      if (nextState.weatherEventActivations[event.id] === activationId) continue;
      nextState.weatherEventActivations[event.id] = activationId;
      if (settings.notifyAutomaticEventsToGm) effects.push({ channel: "gm", type: "weather", event });
      if (settings.notifyAutomaticEventsToPlayers && playerWeatherIds.has(event.id)) effects.push({ channel: "players", type: "weather", event });
    }
  }

  if (settings.notifyAutomaticLunarEvents) {
    for (const event of activeLunarEvents) {
      if (event.notifyOnTrigger === false || previousLunarActiveIds.has(event.id)) continue;
      const activationId = getLunarActivationId(event, nextTime);
      if (nextState.lunarEventActivations[event.id] === activationId) continue;
      nextState.lunarEventActivations[event.id] = activationId;
      if (settings.notifyAutomaticEventsToGm) effects.push({ channel: "gm", type: "moon", event });
      if (settings.notifyAutomaticEventsToPlayers && playerLunarIds.has(event.id)) effects.push({ channel: "players", type: "moon", event });
    }
  }

  if (settings.notifyDatedEventsToPlayers && previousTime.absoluteDay !== nextTime.absoluteDay) {
    for (const event of getPlayerVisibleDatedEventsForToday(nextProject)) {
      const key = `${event.id}:${nextTime.absoluteDay}`;
      if (nextDatedState.notifiedEventDateKeys[key]) continue;
      nextDatedState.notifiedEventDateKeys[key] = true;
      effects.push({ channel: "players", type: "event", event });
    }
  }

  return {
    project: { ...nextProject, automaticNotificationState: nextState, datedEventNotificationState: nextDatedState },
    effects
  };
};