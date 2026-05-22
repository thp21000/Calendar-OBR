import { getMoonPhaseForDate } from "./moonLogic";
import type { CalendarProject, InternalTime, MoonEvent } from "../domain/types";

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
  if (!moonEvent.enabled || moonEvent.status === "disabled") return false;
  const moon = project.moons.find((m) => m.id === moonEvent.moonId);
  if (!moon) return false;
  return getMoonPhaseForDate(moon, absoluteDay).id === moonEvent.phaseId;
};

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
