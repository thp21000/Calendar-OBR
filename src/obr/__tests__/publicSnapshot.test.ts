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

  it("never exposes gm day notes", () => {
    const project = createDefaultCalendarProject();
    project.dayNotes = [
      { id: "d1", date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 0, minute: 0 }, gmNote: "secret", playerNote: "public", visibility: "players", updatedAt: 1 },
      { id: "d2", date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 0, minute: 0 }, gmNote: "gm only", visibility: "gm", updatedAt: 1 }
    ];
    const snapshot = createPublicCalendarTodaySnapshot(project, 1);
    expect(JSON.stringify(snapshot)).not.toContain("gm only");
    expect(snapshot.dayNotesToday.map((n) => n.id)).toEqual(["d1"]);
  });
});

