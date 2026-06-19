import type { CalendarProject, ManualPublications, MoonEvent, WeatherEvent } from "../domain/types";

export const DEFAULT_MANUAL_PUBLICATIONS: ManualPublications = {
  weatherEventIds: [],
  lunarEventIds: []
};

const uniqueStrings = (values: unknown): string[] => Array.isArray(values)
  ? Array.from(new Set(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0)))
  : [];

export const normalizeManualPublications = (value: unknown): ManualPublications => {
  const source = typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    weatherEventIds: uniqueStrings(source.weatherEventIds),
    lunarEventIds: uniqueStrings(source.lunarEventIds)
  };
};

export const cleanManualPublications = (project: CalendarProject): CalendarProject => {
  const current = normalizeManualPublications(project.manualPublications);
  const publishableWeatherIds = new Set(project.weatherEvents
    .filter((event) => event.enabled !== false && event.status !== "archived" && event.status !== "disabled")
    .map((event) => event.id));
  const publishableLunarIds = new Set((project.moonEvents ?? [])
    .filter((event) => event.enabled !== false && event.status !== "archived" && event.status !== "disabled")
    .map((event) => event.id));
  const next: ManualPublications = {
    weatherEventIds: current.weatherEventIds.filter((id) => publishableWeatherIds.has(id)),
    lunarEventIds: current.lunarEventIds.filter((id) => publishableLunarIds.has(id))
  };
  return { ...project, manualPublications: next };
};

export const cleanManualPublicationsForActiveEvents = (
  project: CalendarProject,
  activeWeatherEventIds: Iterable<string>,
  activeLunarEventIds: Iterable<string>
): CalendarProject => {
  const current = normalizeManualPublications(project.manualPublications);
  const weatherIds = new Set(activeWeatherEventIds);
  const lunarIds = new Set(activeLunarEventIds);
  return {
    ...project,
    manualPublications: {
      weatherEventIds: current.weatherEventIds.filter((id) => weatherIds.has(id)),
      lunarEventIds: current.lunarEventIds.filter((id) => lunarIds.has(id))
    }
  };
};

export const isWeatherEventManuallyPublished = (project: CalendarProject, eventId: string): boolean =>
  normalizeManualPublications(project.manualPublications).weatherEventIds.includes(eventId);

export const isLunarEventManuallyPublished = (project: CalendarProject, eventId: string): boolean =>
  normalizeManualPublications(project.manualPublications).lunarEventIds.includes(eventId);

export const setWeatherEventManualPublication = (project: CalendarProject, eventId: string, published: boolean): CalendarProject => {
  const current = normalizeManualPublications(project.manualPublications);
  const ids = new Set(current.weatherEventIds);
  if (published) ids.add(eventId);
  else ids.delete(eventId);
  return { ...project, manualPublications: { ...current, weatherEventIds: Array.from(ids) } };
};

export const setLunarEventManualPublication = (project: CalendarProject, eventId: string, published: boolean): CalendarProject => {
  const current = normalizeManualPublications(project.manualPublications);
  const ids = new Set(current.lunarEventIds);
  if (published) ids.add(eventId);
  else ids.delete(eventId);
  return { ...project, manualPublications: { ...current, lunarEventIds: Array.from(ids) } };
};

export const isPlayerLunarEventDisplayTime = (hour: number): boolean => {
  const safeHour = Math.max(0, Math.min(23, Math.trunc(hour)));
  return safeHour >= 19 || safeHour <= 6;
};

export const filterPlayerPublishableWeatherEvents = (
  project: CalendarProject,
  events: WeatherEvent[],
  globalDisplayAllowed: boolean
): WeatherEvent[] => {
  if (!globalDisplayAllowed) return [];
  const publications = normalizeManualPublications(project.manualPublications);
  return events.filter((event) => {
    if (event.visibilityMode === undefined) {
      const legacyVisibility = event.visibility ?? "gm";
      return legacyVisibility === "players" || legacyVisibility === "revealOnTrigger";
    }
    const mode = event.visibilityMode;
    if (mode === "gmOnly") return false;
    if (mode === "manual") return publications.weatherEventIds.includes(event.id);
    return mode === "auto";
  });
};

export const getPlayerWeatherEventDisplayCandidates = (
  project: CalendarProject,
  visibleEvents: WeatherEvent[],
  hiddenEvents: WeatherEvent[]
): WeatherEvent[] => {
  const publications = normalizeManualPublications(project.manualPublications);
  const visibleIds = new Set(visibleEvents.map((event) => event.id));
  const publishedHiddenEvents = hiddenEvents.filter((event) =>
    event.visibilityMode === "manual"
    && publications.weatherEventIds.includes(event.id)
    && !visibleIds.has(event.id)
  );
  return [...visibleEvents, ...publishedHiddenEvents];
};

export const filterPlayerPublishableLunarEvents = (
  project: CalendarProject,
  events: MoonEvent[],
  globalDisplayAllowed: boolean,
  options: { enforceDisplayTime?: boolean } = {}
): MoonEvent[] => {
  if (!globalDisplayAllowed) return [];
  if (options.enforceDisplayTime !== false && !isPlayerLunarEventDisplayTime(project.currentTime.hour)) return [];
  const publications = normalizeManualPublications(project.manualPublications);
  return events.filter((event) => {
    if (event.visibilityMode === undefined) {
      if (event.visibility === "players") return true;
      if (event.visibility === "revealOnTrigger") return event.status === "triggered";
      return false;
    }
    const mode = event.visibilityMode;
    if (mode === "gmOnly") return false;
    if (mode === "manual") return publications.lunarEventIds.includes(event.id);
    return mode === "auto";
  });
};

export const getPlayerLunarEventDisplayCandidates = (
  project: CalendarProject,
  visibleEvents: MoonEvent[],
  hiddenEvents: MoonEvent[]
): MoonEvent[] => {
  const publications = normalizeManualPublications(project.manualPublications);
  const visibleIds = new Set(visibleEvents.map((event) => event.id));
  const publishedHiddenEvents = hiddenEvents.filter((event) =>
    event.visibilityMode === "manual"
    && publications.lunarEventIds.includes(event.id)
    && !visibleIds.has(event.id)
  );
  return [...visibleEvents, ...publishedHiddenEvents];
};