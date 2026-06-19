import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { applyMoonEventTriggerActions, getNewlyTriggeredMoonEventsBetween, getPlayerVisibleMoonEvents, getTriggeredMoonEvents, getTriggeredMoonEventsAtTime, isMoonEventTriggered } from "../moonEventsLogic";
import { setActiveAdventureContexts } from "../adventureContext";
import type { MoonEvent } from "../../domain/types";

describe("moonEventsLogic", () => {
  it("full moon can trigger", () => {
    const project = createDefaultCalendarProject();
    const moon = project.moons[0];
    project.moonEvents = [{ id: "m1", name: "Full", summary: "", moonId: moon.id, phaseId: "full", visibility: "gm", enabled: true, notifyOnTrigger: true, status: "active" }];
    expect(isMoonEventTriggered(project, project.moonEvents[0], 16)).toBe(true);
  });
  it("new moon can trigger", () => {
    const project = createDefaultCalendarProject();
    const moon = project.moons[0];
    project.moonEvents = [{ id: "m1", name: "New", summary: "", moonId: moon.id, phaseId: "new", visibility: "gm", enabled: true, notifyOnTrigger: true, status: "active" }];
    expect(isMoonEventTriggered(project, project.moonEvents[0], 0)).toBe(true);
  });
  it("wrong phase false", () => {
    const project = createDefaultCalendarProject();
    const moon = project.moons[0];
    project.moonEvents = [{ id: "m1", name: "Wrong", summary: "", moonId: moon.id, phaseId: "full", visibility: "gm", enabled: true, notifyOnTrigger: true, status: "active" }];
    expect(isMoonEventTriggered(project, project.moonEvents[0], 0)).toBe(false);
  });
  it("missing moon false", () => {
    const project = createDefaultCalendarProject();
    project.moonEvents = [{ id: "m1", name: "Missing", summary: "", moonId: "x", phaseId: "full", visibility: "gm", enabled: true, notifyOnTrigger: true, status: "active" }];
    expect(getTriggeredMoonEvents(project, 0)).toEqual([]);
  });
  it("disabled false", () => {
    const project = createDefaultCalendarProject();
    const moon = project.moons[0];
    project.moonEvents = [{ id: "m1", name: "D", summary: "", moonId: moon.id, phaseId: "new", visibility: "gm", enabled: false, notifyOnTrigger: true, status: "active" }];
    expect(getTriggeredMoonEvents(project, 0)).toEqual([]);
  });
  it("archived false", () => {
    const project = createDefaultCalendarProject();
    const moon = project.moons[0];
    project.moonEvents = [{ id: "m1", name: "A", summary: "", moonId: moon.id, phaseId: "new", visibility: "gm", enabled: true, notifyOnTrigger: true, status: "archived" }];
    expect(getTriggeredMoonEvents(project, 0)).toEqual([]);
  });

  it("filters moon events by biome conditions", () => {
    const project = createDefaultCalendarProject();
    const moon = project.moons[0];
    project.weatherBiome = { currentBiomeId: "coast", previousBiomeId: "temperate", biomeChangedAtMinutes: 0, transitionDurationMinutes: 0 };
    const event: MoonEvent = { id: "tide", name: "Tide", summary: "", moonId: moon.id, phaseId: "new", visibility: "gm", enabled: true, notifyOnTrigger: true, status: "active", conditions: { seasonIds: [], monthIds: [], eventConditions: [{ type: "biome", biomeIds: ["coast", "sea"] }] } };
    expect(isMoonEventTriggered(project, event, 0)).toBe(true);
    expect(isMoonEventTriggered({ ...project, weatherBiome: { ...project.weatherBiome, currentBiomeId: "desert" } }, event, 0)).toBe(false);
  });

  it("filters moon events by simplified adventure context conditions", () => {
    let project = createDefaultCalendarProject();
    const moon = project.moons[0];
    project = setActiveAdventureContexts(project, ["woods", "hunting"]);
    const event: MoonEvent = { id: "forest-light", name: "Forest light", summary: "", moonId: moon.id, phaseId: "new", visibility: "gm", enabled: true, notifyOnTrigger: true, status: "active", conditions: { seasonIds: [], monthIds: [], eventConditions: [{ type: "adventureContext", mode: "all", contextIds: ["woods", "hunting"] }] } };
    expect(isMoonEventTriggered(project, event, 0)).toBe(true);
    expect(isMoonEventTriggered(setActiveAdventureContexts(project, ["woods"]), event, 0)).toBe(false);
  });

  it("filters moon events by time of day including ranges crossing midnight", () => {
    const project = createDefaultCalendarProject();
    const moon = project.moons[0];
    project.moonEvents = [{
      id: "night-moon",
      name: "Night moon",
      summary: "",
      moonId: moon.id,
      phaseId: "new",
      visibility: "players",
      enabled: true,
      notifyOnTrigger: true,
      status: "active",
      conditions: { eventConditions: [{ type: "timeOfDay", startHour: 20, endHour: 5 }] }
    }];
    expect(getTriggeredMoonEventsAtTime(project, { absoluteDay: 0, hour: 22, minute: 0 }).map((event) => event.id)).toEqual(["night-moon"]);
    expect(getTriggeredMoonEventsAtTime(project, { absoluteDay: 0, hour: 4, minute: 0 }).map((event) => event.id)).toEqual(["night-moon"]);
    expect(getTriggeredMoonEventsAtTime(project, { absoluteDay: 0, hour: 12, minute: 0 })).toEqual([]);
  });

  it("newly triggered between days", () => {
    const project = createDefaultCalendarProject();
    const moon = project.moons[0];
    project.moonEvents = [{ id: "m1", name: "N", summary: "", moonId: moon.id, phaseId: "new", visibility: "gm", enabled: true, notifyOnTrigger: true, status: "active" }];
    expect(getNewlyTriggeredMoonEventsBetween(project, { absoluteDay: 28, hour: 0, minute: 0 }, { absoluteDay: 30, hour: 0, minute: 0 }).map((e) => e.id)).toEqual(["m1"]);
  });
  it("active event becomes triggered after apply actions", () => {
    const project = createDefaultCalendarProject();
    const moon = project.moons[0];
    project.moonEvents = [{ id: "m1", name: "N", summary: "", moonId: moon.id, phaseId: "new", visibility: "revealOnTrigger", enabled: true, notifyOnTrigger: true, status: "active" }];
    const updated = applyMoonEventTriggerActions(project, [project.moonEvents[0]]);
    expect(updated.moonEvents?.[0].status).toBe("triggered");
  });
  it("revealOnTrigger visible to players only when triggered", () => {
    const project = createDefaultCalendarProject();
    const moon = project.moons[0];
    project.moonEvents = [{ id: "m1", name: "N", summary: "", moonId: moon.id, phaseId: "new", visibility: "revealOnTrigger", enabled: true, notifyOnTrigger: true, status: "active" }];
    expect(getPlayerVisibleMoonEvents(project, 0)).toEqual([]);
    project.moonEvents[0].status = "triggered";
    expect(getPlayerVisibleMoonEvents(project, 0).map((e) => e.id)).toEqual(["m1"]);
  });
});