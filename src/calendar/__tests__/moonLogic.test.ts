import { describe, expect, it } from "vitest";
import type { CalendarProject, Moon } from "../../domain/types";
import { getCurrentMoonPhases, getMoonPhaseForDate } from "../moonLogic";

const buildProject = (moons: Moon[]): CalendarProject => ({
  schemaVersion: 1,
  appVersion: "0.1.0",
  id: "moon-project",
  name: "Moon project",
  locale: "fr",
  units: { temperature: "celsius", windSpeed: "kmh", rain: "mm" },
  currentTime: { absoluteDay: 0, hour: 12, minute: 0 },
  calendarSystem: {
    eraName: "CE",
    startYear: 1000,
    firstWeekdayOffset: 0,
    weekdays: [{ id: "w1", name: "W1", order: 1 }],
    months: [{ id: "m1", name: "M1", order: 1, days: 30 }]
  },
  events: [],
  seasons: [],
  moons,
  weatherSettings: {},
  weatherEvents: [],
  uiSettings: { activeTab: "today", compactMode: false }
});

describe("moonLogic", () => {
  it("retourne nouvelle lune au début du cycle", () => {
    const moon: Moon = { id: "m", name: "Sel", cycleLengthDays: 32 };
    expect(getMoonPhaseForDate(moon, 0).id).toBe("new");
  });

  it("retourne pleine lune au milieu du cycle", () => {
    const moon: Moon = { id: "m", name: "Sel", cycleLengthDays: 32 };
    expect(getMoonPhaseForDate(moon, 16).id).toBe("full");
  });

  it("gère cycleOffsetDays", () => {
    const moon: Moon = { id: "m", name: "Sel", cycleLengthDays: 32, cycleOffsetDays: 8 };
    expect(getMoonPhaseForDate(moon, 0).id).toBe("firstQuarter");
  });

  it("gère un cycle invalide avec valeur par défaut", () => {
    const moon: Moon = { id: "m", name: "Sel", cycleLengthDays: 0 };
    expect(getMoonPhaseForDate(moon, 0).id).toBe("new");
  });

  it("getCurrentMoonPhases retourne une entrée par lune", () => {
    const moons: Moon[] = [
      { id: "m1", name: "A", cycleLengthDays: 32 },
      { id: "m2", name: "B", cycleLengthDays: 24 }
    ];
    expect(getCurrentMoonPhases(buildProject(moons))).toHaveLength(2);
  });

  it("getCurrentMoonPhases retourne vide si aucune lune", () => {
    expect(getCurrentMoonPhases(buildProject([]))).toEqual([]);
  });
});
