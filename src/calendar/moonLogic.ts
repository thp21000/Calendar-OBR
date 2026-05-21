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

export const getMoonPhaseForDate = (moon: Moon, absoluteDay: number): MoonPhase => {
  const cycleLength = normalizeCycleLength(moon.cycleLengthDays);
  const offset = moon.cycleOffsetDays ?? 0;
  const position = ((absoluteDay + offset) % cycleLength + cycleLength) % cycleLength;
  const slice = cycleLength / 8;
  const phaseIndex = Math.floor(position / slice) % 8;
  const phase = MOON_PHASES[phaseIndex];
  return { id: phase.id, icon: phase.icon, illumination: phase.illumination };
};

export const getCurrentMoonPhases = (project: CalendarProject): Array<{ moon: Moon; phase: MoonPhase }> =>
  project.moons.map((moon) => ({ moon, phase: getMoonPhaseForDate(moon, project.currentTime.absoluteDay) }));
