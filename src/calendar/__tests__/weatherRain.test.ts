import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { getHourlyRainForDay } from "../weatherRain";
import type { DailyWeatherSummary } from "../weatherDaily";

const buildSummary = (state: DailyWeatherSummary["dominantState"], rainTotal24h: number): DailyWeatherSummary => ({
  absoluteDay: 12,
  minTemperature: 5,
  maxTemperature: 14,
  averageTemperature: 9,
  rainTotal24h,
  maxWindSpeed: 18,
  dominantWindDirection: "N",
  dominantState: state
});

describe("weatherRain", () => {
  it("returns 24 hourly values", () => {
    const project = createDefaultCalendarProject();
    const hours = getHourlyRainForDay(project, 12, buildSummary("lightRain", 8));
    expect(hours).toHaveLength(24);
  });

  it("returns all zeros when daily total is 0", () => {
    const project = createDefaultCalendarProject();
    const hours = getHourlyRainForDay(project, 12, buildSummary("clear", 0));
    expect(hours.every((value) => value === 0)).toBe(true);
  });

  it("never returns negative values", () => {
    const project = createDefaultCalendarProject();
    const hours = getHourlyRainForDay(project, 12, buildSummary("heavyRain", 11));
    expect(hours.every((value) => value >= 0)).toBe(true);
  });

  it("sum is close to daily total", () => {
    const project = createDefaultCalendarProject();
    const summary = buildSummary("lightRain", 7.3);
    const hours = getHourlyRainForDay(project, 12, summary);
    const sum = hours.reduce((acc, value) => acc + value, 0);
    expect(Math.abs(sum - summary.rainTotal24h)).toBeLessThanOrEqual(0.5);
  });

  it("is deterministic for same project/day/summary", () => {
    const project = createDefaultCalendarProject();
    project.weatherSettings.seed = "stable-rain";
    const summary = buildSummary("storm", 9.8);
    expect(getHourlyRainForDay(project, 42, summary)).toEqual(getHourlyRainForDay(project, 42, summary));
  });

  it("lightRain produces at least one rainy hour when total > 0", () => {
    const project = createDefaultCalendarProject();
    const hours = getHourlyRainForDay(project, 12, buildSummary("lightRain", 2));
    expect(hours.some((value) => value > 0)).toBe(true);
  });

  it("storm/tempest can produce stronger peak than comparable light rain", () => {
    const project = createDefaultCalendarProject();
    const light = getHourlyRainForDay(project, 12, buildSummary("lightRain", 8));
    const tempest = getHourlyRainForDay(project, 12, buildSummary("tempest", 8));
    expect(Math.max(...tempest)).toBeGreaterThan(Math.max(...light));
  });

  it("different days can produce different episode distributions", () => {
    const project = createDefaultCalendarProject();
    project.weatherSettings.seed = "day-diff";
    const summary = buildSummary("heavyRain", 10);
    const dayA = getHourlyRainForDay(project, 100, summary);
    const dayB = getHourlyRainForDay(project, 101, summary);
    expect(dayA).not.toEqual(dayB);
  });
});
