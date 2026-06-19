import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { runWeatherSimulation, weatherSimulationToCsv } from "../weatherSimulation";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

describe("weatherSimulation", () => {
  it("simulates hourly rows without mutating the source project", () => {
    const project = createDefaultCalendarProject();
    project.weatherSettings.seed = "simulation-test";
    const before = clone(project);
    const result = runWeatherSimulation(project, { startAbsoluteDay: project.currentTime.absoluteDay, durationDays: 2, biomeId: "coast", activeContextIds: ["on-water"], seed: "test-seed" });
    expect(result.rows).toHaveLength(48);
    expect(result.summary.totalHours).toBe(48);
    expect(result.options.biomeId).toBe("coast");
    expect(result.options.activeContextIds).toEqual(["on-water"]);
    expect(project).toEqual(before);
  });

  it("exports rows and summary as csv", () => {
    const project = createDefaultCalendarProject();
    const result = runWeatherSimulation(project, { startAbsoluteDay: 0, durationDays: 1 });
    const csv = weatherSimulationToCsv(result);
    expect(csv).toContain("absoluteDay,year,monthName");
    expect(csv).toContain("summary");
  });

  it("counts event presence by day in addition to hourly occurrences", () => {
    const project = createDefaultCalendarProject();
    project.weatherEvents = [{
      id: "always-windy",
      name: "Vent constant",
      enabled: true,
      status: "active",
      requireAllConditions: true,
      conditions: [{ metric: "temperature", operator: "gte", value: -100 }],
      visibilityMode: "auto"
    }];
    const result = runWeatherSimulation(project, { startAbsoluteDay: 0, durationDays: 1, seed: "daily-counts" });
    expect(result.summary.weatherEventOccurrences["Vent constant"]).toBe(24);
    expect(result.summary.weatherEventDays["Vent constant"]).toBe(1);
    expect(result.summary.visibleWeatherEventDays["Vent constant"]).toBe(1);
  });
  
  it("exposes heat pressure in simulation rows and summary", () => {
    const project = createDefaultCalendarProject();
    project.weatherSettings.seed = "heat-pressure";
    const result = runWeatherSimulation(project, { startAbsoluteDay: project.currentTime.absoluteDay, durationDays: 3, biomeId: "desert", seed: "heat-pressure" });
    expect(result.rows.some((row) => typeof row.heatPressure === "number")).toBe(true);
    expect(typeof result.summary.averageHeatPressure).toBe("number");
    expect(typeof result.summary.maxHeatPressure).toBe("number");
    expect(weatherSimulationToCsv(result)).toContain("heatPressure");
  });
});
