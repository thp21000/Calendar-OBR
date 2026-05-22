import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { getNewlyTriggeredMoonEventsBetween, getTriggeredMoonEvents, isMoonEventTriggered } from "../moonEventsLogic";

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
  it("newly triggered between days", () => {
    const project = createDefaultCalendarProject();
    const moon = project.moons[0];
    project.moonEvents = [{ id: "m1", name: "N", summary: "", moonId: moon.id, phaseId: "new", visibility: "gm", enabled: true, notifyOnTrigger: true, status: "active" }];
    expect(getNewlyTriggeredMoonEventsBetween(project, { absoluteDay: 28, hour: 0, minute: 0 }, { absoluteDay: 30, hour: 0, minute: 0 }).map((e) => e.id)).toEqual(["m1"]);
  });
});

