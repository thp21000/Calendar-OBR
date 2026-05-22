import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { createPublicCalendarTodaySnapshot } from "../publicSnapshot";

describe("publicSnapshot moon events", () => {
  it("includes players moon event", () => {
    const project = createDefaultCalendarProject();
    const moon = project.moons[0];
    project.moonEvents = [{ id: "m1", name: "Public", summary: "S", moonId: moon.id, phaseId: "new", visibility: "players", enabled: true, notifyOnTrigger: true, status: "active" }];
    const snapshot = createPublicCalendarTodaySnapshot(project, 1);
    expect(snapshot.moonEventsToday.map((e) => e.id)).toContain("m1");
  });

  it("excludes gm moon event", () => {
    const project = createDefaultCalendarProject();
    const moon = project.moons[0];
    project.moonEvents = [{ id: "m1", name: "GM", summary: "S", moonId: moon.id, phaseId: "new", visibility: "gm", enabled: true, notifyOnTrigger: true, status: "triggered", gmDescription: "secret" }];
    const snapshot = createPublicCalendarTodaySnapshot(project, 1);
    expect(snapshot.moonEventsToday).toEqual([]);
  });

  it("revealOnTrigger excluded before triggered and included after", () => {
    const project = createDefaultCalendarProject();
    const moon = project.moons[0];
    project.moonEvents = [{ id: "m1", name: "R", summary: "S", moonId: moon.id, phaseId: "new", visibility: "revealOnTrigger", enabled: true, notifyOnTrigger: true, status: "active" }];
    expect(createPublicCalendarTodaySnapshot(project, 1).moonEventsToday).toEqual([]);
    project.moonEvents[0].status = "triggered";
    expect(createPublicCalendarTodaySnapshot(project, 1).moonEventsToday.map((e) => e.id)).toEqual(["m1"]);
  });

  it("never exposes gmDescription", () => {
    const project = createDefaultCalendarProject();
    const moon = project.moons[0];
    project.moonEvents = [{ id: "m1", name: "P", summary: "S", moonId: moon.id, phaseId: "new", visibility: "players", enabled: true, notifyOnTrigger: true, status: "active", gmDescription: "secret gm" }];
    const snapshot = createPublicCalendarTodaySnapshot(project, 1);
    expect(JSON.stringify(snapshot)).not.toContain("secret gm");
  });
});

