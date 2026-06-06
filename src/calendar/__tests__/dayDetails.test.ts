import { describe, expect, it } from "vitest";
import type { CalendarProject } from "../../domain/types";
import { getDailyWeatherForecastEntries, getDayDetails } from "../dayDetails";

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

describe("getDailyWeatherForecastEntries", () => {
  it("builds a 5-day daily forecast from the current project day", () => {
    const project = makeProject();
    project.currentTime = { absoluteDay: 4, hour: 18, minute: 30 };
    const forecast = getDailyWeatherForecastEntries(project, 5);

    expect(forecast).toHaveLength(5);
    expect(forecast.map((entry) => entry.offsetDays)).toEqual([0, 1, 2, 3, 4]);
    expect(forecast.map((entry) => entry.absoluteDay)).toEqual([4, 5, 6, 7, 8]);
    expect(forecast[0]?.dailyWeather?.averageTemperature).toBeDefined();
    expect(forecast[0]?.dailyWeather?.averageWindSpeed).toBeDefined();
    expect(forecast[0]?.dailyWeather?.rainTotal24h).toBeDefined();
  });

  it("keeps the daily forecast independent from a selected month day", () => {
    const project = makeProject();
    project.currentTime = { absoluteDay: 4, hour: 18, minute: 30 };
    const beforeSelection = getDailyWeatherForecastEntries(project, 5);

    getDayDetails(project, { year: 1000, monthId: "m1", dayOfMonth: 20, hour: 0, minute: 0 });
    const afterSelection = getDailyWeatherForecastEntries(project, 5);

    expect(afterSelection.map((entry) => entry.absoluteDay)).toEqual(beforeSelection.map((entry) => entry.absoluteDay));
    expect(afterSelection.map((entry) => entry.dailyWeather?.dominantState)).toEqual(beforeSelection.map((entry) => entry.dailyWeather?.dominantState));
  });
});