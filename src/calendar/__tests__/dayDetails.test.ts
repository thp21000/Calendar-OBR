import { describe, expect, it } from "vitest";
import type { CalendarProject } from "../../domain/types";
import { getDayDetails } from "../dayDetails";

const makeProject = (): CalendarProject => ({
  schemaVersion: 1,
  appVersion: "0.1.0",
  id: "p",
  name: "Test",
  locale: "fr",
  units: { temperature: "celsius", windSpeed: "kmh", rain: "mm" },
  currentTime: { absoluteDay: 1, hour: 10, minute: 0 },
  calendarSystem: {
    eraName: "AR",
    startYear: 1000,
    months: [{ id: "m1", name: "M1", order: 1, days: 30 }],
    weekdays: [{ id: "w1", name: "W1", order: 1 }]
  },
  events: [
    { id: "gm", name: "GM", date: { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 10, minute: 0 }, recurrence: { type: "none" }, summary: "", visibility: "gm", notifyOnTrigger: true, deleteAfterTrigger: false, archiveAfterTrigger: false, status: "active", gmDescription: "secret" },
    { id: "players", name: "Players", date: { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 9, minute: 0 }, recurrence: { type: "none" }, summary: "", visibility: "players", notifyOnTrigger: true, deleteAfterTrigger: false, archiveAfterTrigger: false, status: "active" },
    { id: "reveal-active", name: "RevealA", date: { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 12, minute: 0 }, recurrence: { type: "none" }, summary: "", visibility: "revealOnTrigger", notifyOnTrigger: true, deleteAfterTrigger: false, archiveAfterTrigger: false, status: "active" },
    { id: "reveal-triggered", name: "RevealT", date: { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 13, minute: 0 }, recurrence: { type: "none" }, summary: "", visibility: "revealOnTrigger", notifyOnTrigger: true, deleteAfterTrigger: false, archiveAfterTrigger: false, status: "triggered" },
    { id: "other-day", name: "Other", date: { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 9, minute: 0 }, recurrence: { type: "none" }, summary: "", visibility: "players", notifyOnTrigger: true, deleteAfterTrigger: false, archiveAfterTrigger: false, status: "active" }
  ],
  seasons: [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m1", dayOfMonth: 30 } }],
  moons: [{ id: "moon1", name: "Moon", cycleLengthDays: 29.5, cycleOffsetDays: 0 }],
  weatherSettings: {},
  weatherEvents: [],
  uiSettings: { activeTab: "today", compactMode: true }
});

describe("getDayDetails", () => {
  it("includes only events for selected day", () => {
    const details = getDayDetails(makeProject(), { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 0, minute: 0 });
    expect(details.events.map((e) => e.id)).toEqual(["players", "gm", "reveal-active", "reveal-triggered"]);
    expect(details.events.find((e) => e.id === "other-day")).toBeUndefined();
  });

  it("includes gm events in gm details and filters player-visible list", () => {
    const details = getDayDetails(makeProject(), { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 0, minute: 0 });
    expect(details.events.some((e) => e.id === "gm")).toBe(true);
    expect(details.playerVisibleEvents.map((e) => e.id)).toEqual(["players", "reveal-triggered"]);
  });

  it("keeps revealOnTrigger visible only when triggered in player-visible events", () => {
    const details = getDayDetails(makeProject(), { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 0, minute: 0 });
    expect(details.playerVisibleEvents.some((e) => e.id === "reveal-active")).toBe(false);
    expect(details.playerVisibleEvents.some((e) => e.id === "reveal-triggered")).toBe(true);
  });
});
