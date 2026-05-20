import { describe, expect, it } from "vitest";
import type { CalendarProject, Season } from "../../domain/types";
import { getCurrentSeason, getSeasonForDate, seasonContainsDate, sortSeasonsByStartDate } from "../seasonsLogic";

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
});

