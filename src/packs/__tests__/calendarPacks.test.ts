import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { getBuiltInCalendarPacks, getCalendarPackSummary, importCalendarPack, validateCalendarPack } from "../calendarPacks";
import { defaultFantasyCalendarPackFr } from "../defaultFantasyCalendarPack";

describe("calendarPacks", () => {
  it("getBuiltInCalendarPacks('fr') returns at least one pack", () => {
    expect(getBuiltInCalendarPacks("fr").length).toBeGreaterThan(0);
  });

  it("default fantasy pack is valid", () => {
    const result = validateCalendarPack(defaultFantasyCalendarPackFr);
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

  it("getCalendarPackSummary returns expected counts", () => {
    expect(getCalendarPackSummary(defaultFantasyCalendarPackFr)).toEqual({
      months: 12,
      seasons: 4,
      moons: 1,
      weatherEvents: 2
    });
  });
});
