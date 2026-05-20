import { describe, expect, it } from "vitest";
import type { CalendarProject, Season } from "../../domain/types";
import { createDefaultSeason, deleteSeason, getCurrentSeason, getSeasonForDate, getSeasonsStartingOnDate, seasonContainsDate, sortSeasonsByStartDate, updateSeason } from "../seasonsLogic";

const buildProject = (): CalendarProject => ({
  schemaVersion: 1,
  appVersion: "0.1.0",
  id: "p1",
  name: "Test",
  locale: "fr",
  units: { temperature: "celsius", windSpeed: "kmh", rain: "mm" },
  currentTime: { absoluteDay: 0, hour: 10, minute: 0 },
  calendarSystem: {
    eraName: "CE",
    startYear: 1000,
    firstWeekdayOffset: 0,
    weekdays: [{ id: "w1", name: "W1", order: 1 }],
    months: [
      { id: "m1", name: "M1", order: 1, days: 30 },
      { id: "m2", name: "M2", order: 2, days: 30 },
      { id: "m3", name: "M3", order: 3, days: 30 },
      { id: "m4", name: "M4", order: 4, days: 30 }
    ]
  },
  events: [],
  seasons: [],
  moons: [],
  weatherSettings: {},
  weatherEvents: [],
  uiSettings: { activeTab: "today", compactMode: false }
});

describe("seasonsLogic", () => {
  it("retourne undefined si aucune saison", () => {
    const project = buildProject();
    expect(getCurrentSeason(project)).toBeUndefined();
  });

  it("détecte une saison normale", () => {
    const project = buildProject();
    const season: Season = { id: "s1", name: "Printemps", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } };
    project.seasons = [season];
    const found = getSeasonForDate(project, { year: 1000, monthId: "m2", dayOfMonth: 10, hour: 0, minute: 0 });
    expect(found?.id).toBe("s1");
  });

  it("ne détecte pas une saison normale hors plage", () => {
    const project = buildProject();
    const season: Season = { id: "s1", name: "Printemps", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } };
    project.seasons = [season];
    const found = getSeasonForDate(project, { year: 1000, monthId: "m3", dayOfMonth: 1, hour: 0, minute: 0 });
    expect(found).toBeUndefined();
  });

  it("détecte une saison traversant la fin d'année après son début", () => {
    const project = buildProject();
    const season: Season = { id: "s1", name: "Hiver", start: { monthId: "m4", dayOfMonth: 1 }, end: { monthId: "m1", dayOfMonth: 30 } };
    expect(seasonContainsDate(project, season, { year: 1000, monthId: "m4", dayOfMonth: 10, hour: 0, minute: 0 })).toBe(true);
  });

  it("détecte une saison traversant la fin d'année avant sa fin", () => {
    const project = buildProject();
    const season: Season = { id: "s1", name: "Hiver", start: { monthId: "m4", dayOfMonth: 1 }, end: { monthId: "m1", dayOfMonth: 30 } };
    expect(seasonContainsDate(project, season, { year: 1001, monthId: "m1", dayOfMonth: 10, hour: 0, minute: 0 })).toBe(true);
  });

  it("ne détecte pas une saison traversant la fin d'année hors plage", () => {
    const project = buildProject();
    const season: Season = { id: "s1", name: "Hiver", start: { monthId: "m4", dayOfMonth: 1 }, end: { monthId: "m1", dayOfMonth: 30 } };
    expect(seasonContainsDate(project, season, { year: 1000, monthId: "m2", dayOfMonth: 10, hour: 0, minute: 0 })).toBe(false);
  });

  it("trie les saisons par date de début", () => {
    const project = buildProject();
    const seasons: Season[] = [
      { id: "s2", name: "Eté", start: { monthId: "m3", dayOfMonth: 1 }, end: { monthId: "m3", dayOfMonth: 30 } },
      { id: "s1", name: "Printemps", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }
    ];
    expect(sortSeasonsByStartDate(project, seasons).map((s) => s.id)).toEqual(["s1", "s2"]);
  });

  it("getSeasonsStartingOnDate retourne les saisons commençant ce jour", () => {
    const project = buildProject();
    project.seasons = [
      { id: "s1", name: "Printemps", start: { monthId: "m1", dayOfMonth: 10 }, end: { monthId: "m2", dayOfMonth: 10 } },
      { id: "s2", name: "Eté", start: { monthId: "m2", dayOfMonth: 1 }, end: { monthId: "m3", dayOfMonth: 1 } }
    ];
    const result = getSeasonsStartingOnDate(project, { year: 1000, monthId: "m1", dayOfMonth: 10, hour: 0, minute: 0 });
    expect(result.map((s) => s.id)).toEqual(["s1"]);
  });

  it("createDefaultSeason utilise le premier mois", () => {
    const project = buildProject();
    const created = createDefaultSeason(project);
    expect(created.start.monthId).toBe("m1");
    expect(created.start.dayOfMonth).toBe(1);
    expect(created.end.monthId).toBe("m1");
    expect(created.end.dayOfMonth).toBe(30);
  });

  it("updateSeason modifie seulement la saison ciblée", () => {
    const project = buildProject();
    project.seasons = [
      { id: "s1", name: "A", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m1", dayOfMonth: 30 } },
      { id: "s2", name: "B", start: { monthId: "m2", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }
    ];
    const updated = updateSeason(project, "s2", { name: "B2" });
    expect(updated.seasons.find((s) => s.id === "s1")?.name).toBe("A");
    expect(updated.seasons.find((s) => s.id === "s2")?.name).toBe("B2");
  });

  it("deleteSeason supprime seulement la saison ciblée", () => {
    const project = buildProject();
    project.seasons = [
      { id: "s1", name: "A", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m1", dayOfMonth: 30 } },
      { id: "s2", name: "B", start: { monthId: "m2", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }
    ];
    const updated = deleteSeason(project, "s1");
    expect(updated.seasons.map((s) => s.id)).toEqual(["s2"]);
  });

  it("updateSeason borne les jours selon le mois", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "A", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 1 } }];
    const updated = updateSeason(project, "s1", { start: { monthId: "m1", dayOfMonth: 99 }, end: { monthId: "m2", dayOfMonth: 0 } });
    expect(updated.seasons[0].start.dayOfMonth).toBe(30);
    expect(updated.seasons[0].end.dayOfMonth).toBe(1);
  });
});