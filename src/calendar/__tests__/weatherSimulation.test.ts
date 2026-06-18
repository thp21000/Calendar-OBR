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
});
