import { describe, expect, it } from "vitest";
import { DEFAULT_EVENT_DISPLAY_SETTINGS } from "../../calendar/eventDisplayLogic";
import { DEFAULT_PLAYER_VIEW_SETTINGS } from "../../calendar/playerViewSettings";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { buildPublicMonthSnapshot, createPublicCalendarTodaySnapshot } from "../publicSnapshot";

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

  it("includes manually published weather events hidden by smart display arbitration", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "month-1", dayOfMonth: 1 }, end: { monthId: "month-2", dayOfMonth: 30 } }];
    project.eventDisplaySettings = { ...DEFAULT_EVENT_DISPLAY_SETTINGS, weatherDisplayLimitEnabled: true, maxVisibleWeatherEvents: 1 };
    project.manualPublications = { weatherEventIds: ["manual-hidden"], lunarEventIds: [] };
    project.weatherEvents = [
      { id: "auto-visible", name: "Auto", visibilityMode: "auto", displayPriority: 100, enabled: true, requireAllConditions: true, conditions: [{ metric: "temperature", operator: "gte", value: -100 }] },
      { id: "manual-hidden", name: "Manual", visibilityMode: "manual", displayPriority: 1, enabled: true, requireAllConditions: true, conditions: [{ metric: "temperature", operator: "gte", value: -100 }] }
    ];

    const snapshot = createPublicCalendarTodaySnapshot(project, 1);

    expect(snapshot.weatherEventsToday.map((event) => event.id)).toEqual(["auto-visible", "manual-hidden"]);
  });
  
it("does not leak weather overrides internals and keeps final weather", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "month-1", dayOfMonth: 1 }, end: { monthId: "month-2", dayOfMonth: 30 } }];
    project.weatherOverrides = [
      {
        id: "ov1",
        absoluteDay: project.currentTime.absoluteDay,
        label: "Secret override label",
        gmNote: "Top secret GM note",
        temperature: 99,
        state: "storm"
      }
    ];

    const snapshot = createPublicCalendarTodaySnapshot(project, 3);
    const raw = JSON.stringify(snapshot);

    expect(snapshot.weather?.temperature).toBe(99);
    expect(snapshot.weather?.state).toBe("storm");
    expect((snapshot as unknown as { weatherOverrides?: unknown }).weatherOverrides).toBeUndefined();
    expect(raw).not.toContain("weatherOverrides");
    expect(raw).not.toContain("Top secret GM note");
    expect(raw).not.toContain("Secret override label");
    expect(raw).not.toContain("Météo forcée MJ");
  });

  it("does not leak gm-only weather event internals", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "month-1", dayOfMonth: 1 }, end: { monthId: "month-2", dayOfMonth: 30 } }];
    project.weatherEvents = [
      ({
        id: "wp2",
        name: "Players event",
        visibility: "players",
        enabled: true,
        requireAllConditions: true,
        playerDescription: "visible",
        conditions: [{ metric: "temperature", operator: "gte", value: -100 }],
        triggerHistory: [{ id: "h1", triggeredAtMinutes: 120 }],
        cooldownHours: 4,
        durationHours: 2
      } as any)
    ];

    const snapshot = createPublicCalendarTodaySnapshot(project, 4);
    const raw = JSON.stringify(snapshot);

    expect(snapshot.weatherEventsToday[0]?.id).toBe("wp2");
    expect(raw).not.toContain("conditions");
    expect(raw).not.toContain("triggerHistory");
    expect(raw).not.toContain("cooldownHours");
    expect(raw).not.toContain("durationHours");
  });
it("builds a public month snapshot without GM-only events or notes", () => {
    const project = createDefaultCalendarProject();
    project.events = [
      {
        id: "public-event",
        name: "Public event",
        summary: "Visible summary",
        playerDescription: "Visible player text",
        gmDescription: "secret event text",
        date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 10, minute: 0 },
        visibility: "players",
        status: "active",
        recurrence: { type: "none" },
        notifyOnTrigger: true,
        deleteAfterTrigger: false,
        archiveAfterTrigger: false
      },
      {
        id: "gm-event",
        name: "GM event",
        summary: "Hidden summary",
        gmDescription: "secret gm event",
        date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 11, minute: 0 },
        visibility: "gm",
        status: "active",
        recurrence: { type: "none" },
        notifyOnTrigger: true,
        deleteAfterTrigger: false,
        archiveAfterTrigger: false
      }
    ];
    project.dayNotes = [
      { id: "player-note", date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 0, minute: 0 }, playerNote: "public note", gmNote: "secret note text", visibility: "players", updatedAt: 1 },
      { id: "gm-note", date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 0, minute: 0 }, gmNote: "secret gm note", visibility: "gm", updatedAt: 1 }
    ];

    const month = buildPublicMonthSnapshot(project, DEFAULT_PLAYER_VIEW_SETTINGS);
    const today = month.days.find((day) => day.isToday);
    const raw = JSON.stringify(month);

    expect(today?.events.map((event) => event.id)).toEqual(["public-event"]);
    expect(today?.dayNotes).toEqual([{ id: "player-note", playerNote: "public note" }]);
    expect(raw).not.toContain("gm-event");
    expect(raw).not.toContain("secret event text");
    expect(raw).not.toContain("secret note text");
    expect(raw).not.toContain("secret gm note");
  });

  it("respects public month visibility settings", () => {
    const project = createDefaultCalendarProject();
    project.events = [{
      id: "public-event",
      name: "Public event",
      summary: "Visible summary",
      date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 10, minute: 0 },
      visibility: "players",
      status: "active",
      recurrence: { type: "none" },
      notifyOnTrigger: true,
      deleteAfterTrigger: false,
      archiveAfterTrigger: false
    }];
    project.dayNotes = [{ id: "player-note", date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 0, minute: 0 }, playerNote: "public note", visibility: "players", updatedAt: 1 }];

    const month = buildPublicMonthSnapshot(project, {
      ...DEFAULT_PLAYER_VIEW_SETTINGS,
      month: {
        ...DEFAULT_PLAYER_VIEW_SETTINGS.month,
        showPublicEvents: false,
        showDayNotes: false,
        showWeatherSummary: false,
        showFiveDayForecast: false
      }
    });
    const today = month.days.find((day) => day.isToday);

    expect(today?.events).toEqual([]);
    expect(today?.dayNotes).toEqual([]);
    expect(today?.weatherSummary).toBeUndefined();
    expect(month.dailyForecast).toEqual([]);
  });
});