import { describe, expect, it } from "vitest";
import type { CalendarProject, Moon } from "../../domain/types";
import { addMoon, createDefaultMoon, createDefaultMoonSystem, deleteMoon, ensureDefaultMoonSystem, getCurrentMoonPhases, getMoonPhaseForDate, normalizeMoon, updateMoon } from "../moonLogic";

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
  
  it("createDefaultMoon crée une lune valide", () => {
    const moon = createDefaultMoon("fr");
    expect(moon.id.startsWith("moon-")).toBe(true);
    expect(moon.name).toBe("Nouvelle lune");
    expect(moon.icon).toBe("🌕");
    expect(moon.cycleLengthDays).toBe(29.5);
    expect(moon.cycleOffsetDays).toBe(0);
  });

  it("addMoon ajoute une lune", () => {
    const project = buildProject([]);
    const updated = addMoon(project, createDefaultMoon("en"));
    expect(updated.moons).toHaveLength(1);
  });

  it("updateMoon modifie seulement la lune ciblée", () => {
    const m1: Moon = { id: "m1", name: "A", cycleLengthDays: 29.5, cycleOffsetDays: 0 };
    const m2: Moon = { id: "m2", name: "B", cycleLengthDays: 30, cycleOffsetDays: 1 };
    const project = buildProject([m1, m2]);
    const updated = updateMoon(project, "m1", { name: "A+" });
    expect(updated.moons.find((m) => m.id === "m1")?.name).toBe("A+");
    expect(updated.moons.find((m) => m.id === "m2")?.name).toBe("B");
  });

  it("deleteMoon supprime seulement la lune ciblée", () => {
    const m1: Moon = { id: "m1", name: "A", cycleLengthDays: 29.5, cycleOffsetDays: 0 };
    const m2: Moon = { id: "m2", name: "B", cycleLengthDays: 30, cycleOffsetDays: 1 };
    const project = buildProject([m1, m2]);
    const updated = deleteMoon(project, "m1");
    expect(updated.moons.map((m) => m.id)).toEqual(["m2"]);
  });

  it("normalizeMoon corrige cycleLengthDays invalide", () => {
    const moon = normalizeMoon({ id: "m", name: "A", cycleLengthDays: 0, cycleOffsetDays: 0 });
    expect(moon.cycleLengthDays).toBe(29.5);
  });

  it("normalizeMoon conserve cycleOffsetDays négatif", () => {
    const moon = normalizeMoon({ id: "m", name: "A", cycleLengthDays: 29.5, cycleOffsetDays: -4 });
    expect(moon.cycleOffsetDays).toBe(-4);
  });

  it("createDefaultMoonSystem(fr) retourne Lune principale", () => {
    const moons = createDefaultMoonSystem("fr");
    expect(moons).toHaveLength(1);
    expect(moons[0]?.name).toBe("Lune principale");
  });

  it("createDefaultMoonSystem(en) retourne Main moon", () => {
    const moons = createDefaultMoonSystem("en");
    expect(moons).toHaveLength(1);
    expect(moons[0]?.name).toBe("Main moon");
  });

  it("lune par défaut: cycleLengthDays 29.5 et cycleOffsetDays 0", () => {
    const [moon] = createDefaultMoonSystem("fr");
    expect(moon?.cycleLengthDays).toBe(29.5);
    expect(moon?.cycleOffsetDays).toBe(0);
  });

  it("lune principale: nouvelle lune au début du cycle", () => {
    const [moon] = createDefaultMoonSystem("fr");
    expect(getMoonPhaseForDate(moon, 0).id).toBe("new");
  });

  it("lune principale: pleine lune au milieu du cycle", () => {
    const [moon] = createDefaultMoonSystem("fr");
    expect(getMoonPhaseForDate(moon, 14.75).id).toBe("full");
  });

  it("ensureDefaultMoonSystem ajoute la lune principale si moons vide et flag absent", () => {
    const project = buildProject([]);
    const ensured = ensureDefaultMoonSystem(project);
    expect(ensured.moons).toHaveLength(1);
    expect(ensured.moons[0]?.id).toBe("moon-main");
  });

  it("ensureDefaultMoonSystem met defaultMoonSystemInitialized à true", () => {
    const ensured = ensureDefaultMoonSystem(buildProject([]));
    expect(ensured.uiSettings.defaultMoonSystemInitialized).toBe(true);
  });

  it("ensureDefaultMoonSystem ne rajoute pas de lune si flag déjà true", () => {
    const project = buildProject([]);
    project.uiSettings.defaultMoonSystemInitialized = true;
    const ensured = ensureDefaultMoonSystem(project);
    expect(ensured.moons).toEqual([]);
  });

  it("ensureDefaultMoonSystem ne modifie pas les lunes existantes", () => {
    const project = buildProject([{ id: "m1", name: "Sel", cycleLengthDays: 29.5, cycleOffsetDays: 0 }]);
    const ensured = ensureDefaultMoonSystem(project);
    expect(ensured.moons).toHaveLength(1);
    expect(ensured.moons[0]?.id).toBe("m1");
  });
});
