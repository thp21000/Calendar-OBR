import type { CalendarProject, Moon, MoonPhase, MoonPhaseId } from "../domain/types";

const DEFAULT_CYCLE_LENGTH = 29.5;

const MOON_PHASES: Array<{ id: MoonPhaseId; icon: string; illumination: number }> = [
  { id: "new", icon: "🌑", illumination: 0 },
  { id: "waxingCrescent", icon: "🌒", illumination: 25 },
  { id: "firstQuarter", icon: "🌓", illumination: 50 },
  { id: "waxingGibbous", icon: "🌔", illumination: 75 },
  { id: "full", icon: "🌕", illumination: 100 },
  { id: "waningGibbous", icon: "🌖", illumination: 75 },
  { id: "lastQuarter", icon: "🌗", illumination: 50 },
  { id: "waningCrescent", icon: "🌘", illumination: 25 }
];

const normalizeCycleLength = (cycleLengthDays: number): number =>
  Number.isFinite(cycleLengthDays) && cycleLengthDays >= 1 ? cycleLengthDays : DEFAULT_CYCLE_LENGTH;

export const normalizeMoon = (moon: Moon): Moon => ({
  ...moon,
  cycleLengthDays: normalizeCycleLength(moon.cycleLengthDays),
  cycleOffsetDays: Number.isFinite(moon.cycleOffsetDays) ? moon.cycleOffsetDays : 0
});

export const createDefaultMoon = (locale: CalendarProject["locale"]): Moon => ({
  id: `moon-${Date.now()}`,
  name: locale === "fr" ? "Nouvelle lune" : "New moon",
  icon: "🌕",
  cycleLengthDays: 29.5,
  cycleOffsetDays: 0
});

export const createDefaultMoonSystem = (locale: CalendarProject["locale"]): Moon[] => [
  {
    id: "moon-main",
    name: locale === "fr" ? "Lune principale" : "Main moon",
    icon: "🌕",
    cycleLengthDays: 29.5,
    cycleOffsetDays: 0
  }
];

export const addMoon = (project: CalendarProject, moon: Moon): CalendarProject => ({
  ...project,
  moons: [...project.moons, normalizeMoon(moon)]
});

export const updateMoon = (project: CalendarProject, moonId: string, patch: Partial<Moon>): CalendarProject => ({
  ...project,
  moons: project.moons.map((moon) => (moon.id === moonId ? normalizeMoon({ ...moon, ...patch }) : moon))
});

export const deleteMoon = (project: CalendarProject, moonId: string): CalendarProject => ({
  ...project,
  moons: project.moons.filter((moon) => moon.id !== moonId)
});

export const getMoonPhaseForDate = (moon: Moon, absoluteDay: number): MoonPhase => {
  const normalizedMoon = normalizeMoon(moon);
  const cycleLength = normalizedMoon.cycleLengthDays;
  const offset = normalizedMoon.cycleOffsetDays ?? 0;
  const position = ((absoluteDay + offset) % cycleLength + cycleLength) % cycleLength;
  const slice = cycleLength / 8;
  const phaseIndex = Math.floor(position / slice) % 8;
  const phase = MOON_PHASES[phaseIndex];
  return { id: phase.id, icon: phase.icon, illumination: phase.illumination };
};

export const getCurrentMoonPhases = (project: CalendarProject): Array<{ moon: Moon; phase: MoonPhase }> =>
  project.moons.map((moon) => ({ moon, phase: getMoonPhaseForDate(moon, project.currentTime.absoluteDay) }));
