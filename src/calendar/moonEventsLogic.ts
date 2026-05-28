import { absoluteDayToCalendarDate } from "./dateEngine";
import { getMoonPhaseForDate } from "./moonLogic";
import { getSeasonForDate } from "./seasonsLogic";
import type { CalendarDate, CalendarProject, InternalTime, MoonEvent } from "../domain/types";

export const createDefaultMoonEvent = (project: CalendarProject): MoonEvent => ({
  id: `moon-event-${Date.now()}`,
  name: project.locale === "fr" ? "Nouvel événement lunaire" : "New moon event",
  icon: "🌕",
  summary: "",
  moonId: project.moons[0]?.id ?? "",
  phaseId: "full",
  visibility: "gm",
  enabled: true,
  notifyOnTrigger: true,
  status: "active",
  conditions: { seasonIds: [], monthIds: [] },
  repeatMode: "everyOccurrence",
  lastTriggeredAbsoluteDay: undefined
});

export const addMoonEvent = (project: CalendarProject, event: MoonEvent): CalendarProject => ({ ...project, moonEvents: [...(project.moonEvents ?? []), event] });
export const updateMoonEvent = (project: CalendarProject, eventId: string, patch: Partial<MoonEvent>): CalendarProject => ({ ...project, moonEvents: (project.moonEvents ?? []).map((e) => (e.id === eventId ? { ...e, ...patch } : e)) });
export const deleteMoonEvent = (project: CalendarProject, eventId: string): CalendarProject => ({ ...project, moonEvents: (project.moonEvents ?? []).filter((e) => e.id !== eventId) });

export const isMoonEventTriggered = (project: CalendarProject, moonEvent: MoonEvent, absoluteDay: number): boolean => {
  if (!moonEvent.enabled || moonEvent.status === "disabled" || moonEvent.status === "archived") return false;
  const moon = project.moons.find((m) => m.id === moonEvent.moonId);
  if (!moon) return false;
  if (getMoonPhaseForDate(moon, absoluteDay).id !== moonEvent.phaseId) return false;
  if (!matchesMoonEventExtraConditions(project, moonEvent, absoluteDay)) return false;
  if (!matchesMoonEventRepeatMode(project, moonEvent, absoluteDay)) return false;
  return true;
};

export const applyMoonEventTriggerActions = (project: CalendarProject, triggeredMoonEvents: MoonEvent[], triggeredAbsoluteDay?: number): CalendarProject => {
  const ids = new Set(triggeredMoonEvents.map((e) => e.id));
  const absoluteDay = triggeredAbsoluteDay ?? project.currentTime.absoluteDay;
  return {
    ...project,
    moonEvents: (project.moonEvents ?? []).map((event) =>
      ids.has(event.id)
        ? {
            ...event,
            status: event.status === "active" ? "triggered" : event.status,
            lastTriggeredAbsoluteDay: absoluteDay
          }
        : event
    )
  };
};

export const getPlayerVisibleMoonEvents = (project: CalendarProject, absoluteDay: number): MoonEvent[] =>
  (project.moonEvents ?? []).filter((event) => {
    if (!isMoonEventTriggered(project, event, absoluteDay)) return false;
    if (event.visibility === "players") return true;
    if (event.visibility === "revealOnTrigger") return event.status === "triggered";
    return false;
  });

export const getTriggeredMoonEvents = (project: CalendarProject, absoluteDay: number): MoonEvent[] =>
  (project.moonEvents ?? []).filter((event) => isMoonEventTriggered(project, event, absoluteDay));

export const getNewlyTriggeredMoonEventsBetween = (project: CalendarProject, fromTime: InternalTime, toTime: InternalTime): MoonEvent[] => {
  if (toTime.absoluteDay <= fromTime.absoluteDay) return [];
  const newly = new Set<string>();
  for (let day = fromTime.absoluteDay + 1; day <= toTime.absoluteDay; day += 1) {
    for (const event of project.moonEvents ?? []) {
      if (newly.has(event.id)) continue;
      if (!isMoonEventTriggered(project, event, day - 1) && isMoonEventTriggered(project, event, day)) newly.add(event.id);
    }
  }
  return (project.moonEvents ?? []).filter((event) => newly.has(event.id));
};

export const getMoonEventsStartingOnDay = (
  project: CalendarProject,
  absoluteDay: number
): MoonEvent[] =>
  (project.moonEvents ?? []).filter((event) =>
    isMoonEventTriggered(project, event, absoluteDay) &&
    !isMoonEventTriggered(project, event, absoluteDay - 1)
  );

  export type MoonEventActivationSpan = {
  startAbsoluteDay: number;
  endAbsoluteDay: number;
  durationDays: number;
};

export const getMoonEventActivationSpan = (
  project: CalendarProject,
  moonEvent: MoonEvent,
  absoluteDay: number
): MoonEventActivationSpan | null => {
  if (!isMoonEventTriggered(project, moonEvent, absoluteDay)) return null;
  const maxSearchDays = 128;

  let startAbsoluteDay = absoluteDay;
  for (let i = 0; i < maxSearchDays; i += 1) {
    if (!isMoonEventTriggered(project, moonEvent, startAbsoluteDay - 1)) break;
    startAbsoluteDay -= 1;
  }

  let endAbsoluteDay = absoluteDay;
  for (let i = 0; i < maxSearchDays; i += 1) {
    if (!isMoonEventTriggered(project, moonEvent, endAbsoluteDay + 1)) break;
    endAbsoluteDay += 1;
  }

  return {
    startAbsoluteDay,
    endAbsoluteDay,
    durationDays: endAbsoluteDay - startAbsoluteDay + 1
  };
};

export const getMoonEventActivationDurationDays = (
  project: CalendarProject,
  moonEvent: MoonEvent,
  absoluteDay: number
): number => {
  const span = getMoonEventActivationSpan(project, moonEvent, absoluteDay);
  return span?.durationDays ?? 1;
};

export const getNextMoonEventActivationDays = (
  project: CalendarProject,
  moonEvent: MoonEvent,
  fromAbsoluteDay: number,
  count: number
): number[] => {
  const moon = project.moons.find((item) => item.id === moonEvent.moonId);
  if (!moon) return [];
  const repeatMode = moonEvent.repeatMode ?? "everyOccurrence";
  if (repeatMode === "once" && moonEvent.lastTriggeredAbsoluteDay !== undefined) {
    return moonEvent.lastTriggeredAbsoluteDay >= fromAbsoluteDay ? [moonEvent.lastTriggeredAbsoluteDay] : [];
  }
  const targetCount = Math.max(0, Math.trunc(count));
  if (targetCount <= 0) return [];
  const results: number[] = [];
  const maxSearchDays = Math.ceil(moon.cycleLengthDays * 16 * Math.max(targetCount, 1)) + 370;
  for (let dayOffset = 0; dayOffset <= maxSearchDays && results.length < targetCount; dayOffset += 1) {
    const absoluteDay = fromAbsoluteDay + dayOffset;
    const matchesToday = moonEventMatchesActivationRules(project, moonEvent, absoluteDay);
    if (!matchesToday) continue;
    const isFirstDayTested = dayOffset === 0;
    if (!isFirstDayTested) {
      const matchesPreviousDay = moonEventMatchesActivationRules(project, moonEvent, absoluteDay - 1);
      if (matchesPreviousDay) continue;
    }
    results.push(absoluteDay);
  }
  return results;
};

export const getNextMoonEventActivationDate = (
  project: CalendarProject,
  moonEvent: MoonEvent
): CalendarDate | null => {
  const [nextDay] = getNextMoonEventActivationDays(project, moonEvent, project.currentTime.absoluteDay, 1);
  if (nextDay === undefined) return null;
  return absoluteDayToCalendarDate({ absoluteDay: nextDay, hour: 0, minute: 0 }, project.calendarSystem);
};


const moonEventMatchesActivationRules = (project: CalendarProject, moonEvent: MoonEvent, absoluteDay: number): boolean => {
  const moon = project.moons.find((item) => item.id === moonEvent.moonId);
  if (!moon) return false;
  if (getMoonPhaseForDate(moon, absoluteDay).id !== moonEvent.phaseId) return false;
  if (!matchesMoonEventExtraConditions(project, moonEvent, absoluteDay)) return false;
  if (!matchesMoonEventRepeatMode(project, moonEvent, absoluteDay)) return false;
  return true;
};

const matchesMoonEventExtraConditions = (project: CalendarProject, moonEvent: MoonEvent, absoluteDay: number): boolean => {
  const conditions = moonEvent.conditions ?? { seasonIds: [], monthIds: [] };
  const monthIds = conditions.monthIds ?? [];
  const seasonIds = conditions.seasonIds ?? [];
  const date = absoluteDayToCalendarDate({ absoluteDay, hour: 0, minute: 0 }, project.calendarSystem);
  if (monthIds.length > 0 && !monthIds.includes(date.monthId)) return false;
  if (seasonIds.length > 0) {
    const season = getSeasonForDate(project, date);
    if (!season || !seasonIds.includes(season.id)) return false;
  }
  return true;
};

const getMoonEventOccurrenceIndex = (project: CalendarProject, moonEvent: MoonEvent, absoluteDay: number): number | null => {
  const moon = project.moons.find((item) => item.id === moonEvent.moonId);
  if (!moon) return null;
  const cycleLength = moon.cycleLengthDays || 1;
  const cycleOffset = moon.cycleOffsetDays ?? 0;
  return Math.floor((absoluteDay + cycleOffset) / cycleLength);
};

const matchesMoonEventRepeatMode = (project: CalendarProject, moonEvent: MoonEvent, absoluteDay: number): boolean => {
  const repeatMode = moonEvent.repeatMode ?? "everyOccurrence";
  if (repeatMode === "everyOccurrence") return true;
  if (repeatMode === "once") {
    if (moonEvent.lastTriggeredAbsoluteDay === undefined) return true;
    return moonEvent.lastTriggeredAbsoluteDay === absoluteDay;
  }
  const occurrenceIndex = getMoonEventOccurrenceIndex(project, moonEvent, absoluteDay);
  if (occurrenceIndex === null) return false;
  return occurrenceIndex % 2 === 0;
};