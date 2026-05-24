import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { createPublicCalendarTodaySnapshot } from "../publicSnapshot";

describe("publicSnapshot moon events", () => {
  it("includes players moon event", () => {
    const project = createDefaultCalendarProject();
    const moon = project.moons[0];
    project.moonEvents = [{ id: "m1", name: "Public", summary: "S", playerDescription: "moon player text", moonId: moon.id, phaseId: "new", visibility: "players", enabled: true, notifyOnTrigger: true, status: "active" }];
    const snapshot = createPublicCalendarTodaySnapshot(project, 1);
    expect(snapshot.moonEventsToday.map((e) => e.id)).toContain("m1");
    expect(snapshot.moonEventsToday[0]?.playerDescription).toBe("moon player text");
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
       { id: "d1", date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 0, minute: 0 }, gmNote: "secret player-note gm", playerNote: "public", visibility: "players", updatedAt: 1 },
      { id: "d2", date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 0, minute: 0 }, gmNote: "gm only", visibility: "gm", updatedAt: 1 }
    ];
    const snapshot = createPublicCalendarTodaySnapshot(project, 1);
    expect(JSON.stringify(snapshot)).toContain("public");
    expect(snapshot.dayNotesToday[0]?.playerNote).toBe("public");
    expect(JSON.stringify(snapshot)).not.toContain("gm only");
    expect(JSON.stringify(snapshot)).not.toContain("secret player-note gm");
    expect(snapshot.dayNotesToday.map((n) => n.id)).toEqual(["d1"]);
  });
  
  it("keeps playerDescription and never exposes event gmDescription", () => {
    const project = createDefaultCalendarProject();
    project.events = [{
      id: "e1",
      name: "Public event",
      summary: "Summary",
      date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 10, minute: 0 },
      visibility: "players",
      status: "active",
      recurrence: { type: "none" },
      notifyOnTrigger: true,
      deleteAfterTrigger: false,
      archiveAfterTrigger: false,
      playerDescription: "player text",
      gmDescription: "secret gm text"
    }];
    const snapshot = createPublicCalendarTodaySnapshot(project, 1);
    expect(snapshot.eventsToday[0]?.playerDescription).toBe("player text");
    expect(JSON.stringify(snapshot)).not.toContain("secret gm text");
  });
  
  it("weatherEventsToday contains only player-visible weather events", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "month-1", dayOfMonth: 1 }, end: { monthId: "month-2", dayOfMonth: 30 } }];
    project.weatherEvents = [
      { id: "wg", name: "GM", visibility: "gm", enabled: true, requireAllConditions: true, conditions: [{ metric: "temperature", operator: "gte", value: -100 }] },
      { id: "wp", name: "Players", visibility: "players", enabled: true, requireAllConditions: true, playerDescription: "public desc", gmDescription: "secret", conditions: [{ metric: "temperature", operator: "gte", value: -100 }] }
    ];
    const snapshot = createPublicCalendarTodaySnapshot(project, 1);
    expect(snapshot.weatherEventsToday.map((e) => e.id)).toEqual(["wp"]);
    expect(snapshot.weatherEventsToday[0]?.playerDescription).toBe("public desc");
    const serialized = JSON.stringify(snapshot);
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("conditions");
  });
});