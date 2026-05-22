import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { searchCalendarProject } from "../globalSearch";

describe("searchCalendarProject", () => {
  it("recherche dans nom et résumé d'un événement + casse", () => {
    const p = createDefaultCalendarProject();
    p.events = [{
      id: "e1", name: "Grande Bataille", summary: "Assaut final", date: { year: 1000, monthId: p.calendarSystem.months[0].id, dayOfMonth: 2, hour: 10, minute: 0 }, recurrence: { type: "none" }, visibility: "gm", notifyOnTrigger: true, deleteAfterTrigger: false, archiveAfterTrigger: false, status: "active"
    }];
    expect(searchCalendarProject(p, "bataille").some((r) => r.sourceId === "e1")).toBe(true);
    expect(searchCalendarProject(p, "ASSAUT").some((r) => r.sourceId === "e1")).toBe(true);
  });

  it("recherche dans note MJ et note publique", () => {
    const p = createDefaultCalendarProject();
    p.dayNotes = [{ id: "d1", date: { year: 1000, monthId: p.calendarSystem.months[0].id, dayOfMonth: 1, hour: 0, minute: 0 }, gmNote: "secret temple", playerNote: "rumeur publique", visibility: "gm", updatedAt: 1 }];
    expect(searchCalendarProject(p, "temple").some((r) => r.type === "dayNote")).toBe(true);
    expect(searchCalendarProject(p, "publique").some((r) => r.type === "dayNote")).toBe(true);
  });

  it("recherche dans événement lunaire et nom de lune", () => {
    const p = createDefaultCalendarProject();
    p.moons = [{ id: "m1", name: "Séléné", cycleLengthDays: 29.5, cycleOffsetDays: 0 }];
    p.moonEvents = [{ id: "me1", name: "Rite", summary: "chant", moonId: "m1", phaseId: "full", visibility: "gm", enabled: true, notifyOnTrigger: true, status: "active" }];
    expect(searchCalendarProject(p, "rite").some((r) => r.type === "moonEvent")).toBe(true);
    expect(searchCalendarProject(p, "selene").some((r) => r.type === "moonEvent")).toBe(true);
  });

  it("requête vide retourne [] et limite à 25", () => {
    const p = createDefaultCalendarProject();
    p.events = Array.from({ length: 40 }, (_, i) => ({ id: `e${i}`, name: `Alpha ${i}`, summary: "", date: { year: 1000, monthId: p.calendarSystem.months[0].id, dayOfMonth: 1, hour: 0, minute: 0 }, recurrence: { type: "none" as const }, visibility: "gm" as const, notifyOnTrigger: true, deleteAfterTrigger: false, archiveAfterTrigger: false, status: "active" as const }));
    expect(searchCalendarProject(p, "")).toEqual([]);
    expect(searchCalendarProject(p, "alpha").length).toBe(25);
  });
});
