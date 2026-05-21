import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import {
  createCalendarPackFromProject,
  exportCalendarPack,
  getBuiltInCalendarPacks,
  getCalendarPackSummary,
  importCalendarPack,
  validateCalendarPack
} from "../calendarPacks";
import { defaultFantasyCalendarPackEn, defaultFantasyCalendarPackFr } from "../defaultFantasyCalendarPack";

describe("calendarPacks", () => {
  it("getBuiltInCalendarPacks('fr') returns at least one pack", () => {
    const packs = getBuiltInCalendarPacks("fr");
    expect(packs.length).toBeGreaterThan(0);
    expect(packs.every((pack) => pack.locale === "fr")).toBe(true);
  });

  it("getBuiltInCalendarPacks('en') returns English packs only when available", () => {
    const packs = getBuiltInCalendarPacks("en");
    expect(packs.length).toBeGreaterThan(0);
    expect(packs.every((pack) => pack.locale === "en")).toBe(true);
    expect(packs.some((pack) => pack.packId === "fantasy-classic-fr")).toBe(false);
  });

  it("default fantasy pack is valid", () => {
    const result = validateCalendarPack(defaultFantasyCalendarPackFr);
    expect(result.ok).toBe(true);
  });

  it("default English fantasy pack is valid", () => {
    const result = validateCalendarPack(defaultFantasyCalendarPackEn);
    expect(result.ok).toBe(true);
  });

  it("validateCalendarPack rejects missing packId", () => {
    const invalid = { ...defaultFantasyCalendarPackFr, packId: "" };
    const result = validateCalendarPack(invalid);
    expect(result.ok).toBe(false);
  });

  it("validateCalendarPack rejects invalid locale", () => {
    const invalid = { ...defaultFantasyCalendarPackFr, locale: "es" };
    const result = validateCalendarPack(invalid);
    expect(result.ok).toBe(false);
  });

  it("validateCalendarPack rejects invalid project", () => {
    const invalid = {
      ...defaultFantasyCalendarPackFr,
      project: { ...defaultFantasyCalendarPackFr.project, id: "" }
    };
    const result = validateCalendarPack(invalid);
    expect(result.ok).toBe(false);
  });

  it("importCalendarPack replaces project when pack is valid", () => {
    const currentProject = createDefaultCalendarProject();
    const result = importCalendarPack(defaultFantasyCalendarPackFr, currentProject);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.id).toBe(defaultFantasyCalendarPackFr.project.id);
  });

  it("importCalendarPack keeps current project when pack is invalid", () => {
    const currentProject = createDefaultCalendarProject();
    const invalid = { ...defaultFantasyCalendarPackFr, packId: "" };
    const result = importCalendarPack(invalid, currentProject);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.project).toEqual(currentProject);
  });

  it("built-in pack contains at least one moon", () => {
    expect(defaultFantasyCalendarPackFr.project.moons.length).toBeGreaterThan(0);
  });

  it("built-in pack contains seasons", () => {
    expect(defaultFantasyCalendarPackFr.project.seasons.length).toBeGreaterThan(0);
  });

  it("built-in pack contains weather profiles", () => {
    expect(defaultFantasyCalendarPackFr.project.seasons.some((season) => season.weatherProfile)).toBe(true);
  });

  it("English pack has 12 months", () => {
    expect(defaultFantasyCalendarPackEn.project.calendarSystem.months).toHaveLength(12);
  });

  it("English pack has 4 seasons", () => {
    expect(defaultFantasyCalendarPackEn.project.seasons).toHaveLength(4);
  });

  it("English pack has one main moon", () => {
    expect(defaultFantasyCalendarPackEn.project.moons).toHaveLength(1);
    expect(defaultFantasyCalendarPackEn.project.moons[0].name).toBe("Main moon");
  });

  it("English pack has weather profiles", () => {
    expect(defaultFantasyCalendarPackEn.project.seasons.every((season) => season.weatherProfile)).toBe(true);
  });

  it("English pack has weather events", () => {
    expect(defaultFantasyCalendarPackEn.project.weatherEvents.length).toBeGreaterThan(0);
  });
  it("getCalendarPackSummary returns expected counts", () => {
    expect(getCalendarPackSummary(defaultFantasyCalendarPackFr)).toEqual({
      months: 12,
      seasons: 4,
      moons: 1,
      weatherEvents: 2
    });
  });

  it("createCalendarPackFromProject creates a valid pack", () => {
    const project = createDefaultCalendarProject();
    const pack = createCalendarPackFromProject(project, { packId: "my-pack", packVersion: "2.1.0", name: "My Pack" });
    const validation = validateCalendarPack(pack);
    expect(validation.ok).toBe(true);
  });

  it("createCalendarPackFromProject uses project locale", () => {
    const project = createDefaultCalendarProject();
    project.locale = "en";
    const pack = createCalendarPackFromProject(project, { packId: "my-pack", packVersion: "1.0.0", name: "My Pack" });
    expect(pack.locale).toBe("en");
  });

  it("createCalendarPackFromProject does not mutate original project", () => {
    const project = createDefaultCalendarProject();
    const original = structuredClone(project);
    const pack = createCalendarPackFromProject(project, { packId: "my-pack", packVersion: "1.0.0", name: "My Pack" });
    pack.project.name = "Changed in pack";
    expect(project).toEqual(original);
  });

  it("createCalendarPackFromProject generates packId when empty", () => {
    const project = createDefaultCalendarProject();
    const pack = createCalendarPackFromProject(project, { packId: "", packVersion: "1.0.0", name: "Calendrier de campagne" });
    expect(pack.packId).toBe("pack-calendrier-de-campagne");
  });

  it("createCalendarPackFromProject defaults packVersion to 1.0.0 when empty", () => {
    const project = createDefaultCalendarProject();
    const pack = createCalendarPackFromProject(project, { packId: "my-pack", packVersion: "", name: "My Pack" });
    expect(pack.packVersion).toBe("1.0.0");
  });

  it("exportCalendarPack returns valid JSON", () => {
    const project = createDefaultCalendarProject();
    const pack = createCalendarPackFromProject(project, { packId: "my-pack", packVersion: "1.0.0", name: "My Pack" });
    const json = exportCalendarPack(pack);
    const parsed = JSON.parse(json) as unknown;
    expect(typeof parsed).toBe("object");
  });

  it("exported pack JSON can be validated", () => {
    const project = createDefaultCalendarProject();
    const pack = createCalendarPackFromProject(project, { packId: "my-pack", packVersion: "1.0.0", name: "My Pack" });
    const json = exportCalendarPack(pack);
    const parsed = JSON.parse(json) as unknown;
    expect(validateCalendarPack(parsed).ok).toBe(true);
  });
});