import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { applyBiomeToWeatherSnapshot, changeWeatherBiome, getWeatherBiomeTransitionProgress } from "../weather/biomes";
import type { CalendarProject, WeatherSnapshot } from "../../domain/types";

const baseWeather: WeatherSnapshot = {
  temperature: 10,
  rain: 10,
  windSpeed: 20,
  windDirection: "N",
  state: "heavyRain",
  dailyMinTemperature: 5,
  dailyMaxTemperature: 15,
  dailyRainTotal: 20,
  dominantState: "heavyRain"
};

const projectAtBiome = (biomeId: NonNullable<CalendarProject["weatherBiome"]>["currentBiomeId"]): CalendarProject => ({
  ...createDefaultCalendarProject(),
  weatherBiome: { currentBiomeId: biomeId }
});

describe("weather biomes", () => {
  it("uses temperate as a neutral fallback for old projects", () => {
    const project = createDefaultCalendarProject();
    delete project.weatherBiome;
    expect(applyBiomeToWeatherSnapshot(project, baseWeather, { absoluteDay: 0, hour: 8 })).toEqual(baseWeather);
  });

  it("applies fixed biome modifiers to generated weather copies", () => {
    const project = projectAtBiome("desert");
    const adjusted = applyBiomeToWeatherSnapshot(project, baseWeather, { absoluteDay: 0, hour: 8 });
    expect(adjusted).not.toBe(baseWeather);
    expect(adjusted.temperature).toBe(18);
    expect(adjusted.rain).toBe(2);
    expect(adjusted.windSpeed).toBe(23);
  });

  it("transitions progressively in 5-minute steps", () => {
    const project = changeWeatherBiome(projectAtBiome("temperate"), "jungle", 0);
    expect(getWeatherBiomeTransitionProgress(project, { absoluteDay: 0, hour: 0, minute: 4 })).toBe(0);
    expect(getWeatherBiomeTransitionProgress(project, { absoluteDay: 0, hour: 0, minute: 5 })).toBeCloseTo(5 / 120);
    expect(getWeatherBiomeTransitionProgress(project, { absoluteDay: 0, hour: 2, minute: 0 })).toBe(1);
  });
});
