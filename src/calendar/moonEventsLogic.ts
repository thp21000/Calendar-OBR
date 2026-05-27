import { absoluteDayToCalendarDate } from "./dateEngine";
import { getMoonPhaseForDate } from "./moonLogic";
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
  status: "active"
});

export const addMoonEvent = (project: CalendarProject, event: MoonEvent): CalendarProject => ({ ...project, moonEvents: [...(project.moonEvents ?? []), event] });
export const updateMoonEvent = (project: CalendarProject, eventId: string, patch: Partial<MoonEvent>): CalendarProject => ({ ...project, moonEvents: (project.moonEvents ?? []).map((e) => (e.id === eventId ? { ...e, ...patch } : e)) });
export const deleteMoonEvent = (project: CalendarProject, eventId: string): CalendarProject => ({ ...project, moonEvents: (project.moonEvents ?? []).filter((e) => e.id !== eventId) });

export const isMoonEventTriggered = (project: CalendarProject, moonEvent: MoonEvent, absoluteDay: number): boolean => {
  if (!moonEvent.enabled || moonEvent.status === "disabled" || moonEvent.status === "archived") return false;
  const moon = project.moons.find((m) => m.id === moonEvent.moonId);
  if (!moon) return false;
  return getMoonPhaseForDate(moon, absoluteDay).id === moonEvent.phaseId;
};

export const applyMoonEventTriggerActions = (project: CalendarProject, triggeredMoonEvents: MoonEvent[]): CalendarProject => {
  const ids = new Set(triggeredMoonEvents.map((e) => e.id));
  return {
    ...project,
    moonEvents: (project.moonEvents ?? []).map((event) =>
      ids.has(event.id) && event.status === "active" ? { ...event, status: "triggered" } : event
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

export const getNextMoonEventActivationDays = (
  project: CalendarProject,
  moonEvent: MoonEvent,
  fromAbsoluteDay: number,
  count: number
): number[] => {
  const moon = project.moons.find((item) => item.id === moonEvent.moonId);
  if (!moon) return [];
  const targetCount = Math.max(0, Math.trunc(count));
  if (targetCount <= 0) return [];
  const results: number[] = [];
  const maxSearchDays = Math.ceil(moon.cycleLengthDays * 8 * Math.max(targetCount, 1)) + 32;
  for (let dayOffset = 0; dayOffset <= maxSearchDays && results.length < targetCount; dayOffset += 1) {
    const absoluteDay = fromAbsoluteDay + dayOffset;
    if (getMoonPhaseForDate(moon, absoluteDay).id === moonEvent.phaseId) results.push(absoluteDay);
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
