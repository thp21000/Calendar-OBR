import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import {
  applyBiomeToWeatherSnapshot,
  changeWeatherBiome,
  getWeatherBiomeTransitionProgress,
  resolveEffectiveWeatherProfile
} from "../weather/biomes";
import { getDailyWeatherSummary } from "../weatherDaily";
import { generateWeatherForTime, getForecastWeatherForTime } from "../weatherLogic";
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
  seasons: [{ id: "s1", name: "Season", start: { monthId: "month-1", dayOfMonth: 1 }, end: { monthId: "month-2", dayOfMonth: 30 } }],
  weatherBiome: { currentBiomeId: biomeId }
});

describe("weather biomes", () => {
  it("uses temperate as a neutral fallback for old projects", () => {
    const project = createDefaultCalendarProject();
    delete project.weatherBiome;
    delete project.weatherBiomeProfiles;
    const profile = resolveEffectiveWeatherProfile(project, { absoluteDay: 0, hour: 8 });
    expect(profile.temperature.average).toBe(12);
    expect(applyBiomeToWeatherSnapshot(project, baseWeather, { absoluteDay: 0, hour: 8 })).toEqual(baseWeather);
  });

  it("resolves biome profiles as the weather generation base", () => {
    const project = projectAtBiome("desert");
    const profile = resolveEffectiveWeatherProfile(project, { absoluteDay: 0, hour: 8 });
    expect(profile.temperature.average).toBeGreaterThan(25);
    expect(profile.rain.average).toBeLessThan(1);
    expect(profile.windSpeed.average).toBeGreaterThan(10);
  });

  it("transitions progressively in 5-minute steps", () => {
    const project = changeWeatherBiome(projectAtBiome("temperate"), "jungle", 0);
    expect(getWeatherBiomeTransitionProgress(project, { absoluteDay: 0, hour: 0, minute: 4 })).toBe(0);
    expect(getWeatherBiomeTransitionProgress(project, { absoluteDay: 0, hour: 0, minute: 5 })).toBeCloseTo(5 / 120);
    expect(getWeatherBiomeTransitionProgress(project, { absoluteDay: 0, hour: 2, minute: 0 })).toBe(1);
  });

  it("interpolates the full biome profile during transitions", () => {
    const project = changeWeatherBiome(projectAtBiome("temperate"), "jungle", 0);
    const start = resolveEffectiveWeatherProfile(project, { absoluteDay: 0, hour: 0, minute: 0 });
    const stepped = resolveEffectiveWeatherProfile(project, { absoluteDay: 0, hour: 0, minute: 5 });
    const end = resolveEffectiveWeatherProfile(project, { absoluteDay: 0, hour: 2, minute: 0 });

    expect(start.temperature.average).toBeLessThan(stepped.temperature.average);
    expect(stepped.temperature.average).toBeLessThan(end.temperature.average);
    expect(start.dailyRain.average).toBeLessThan(stepped.dailyRain.average);
    expect(stepped.dailyRain.average).toBeLessThan(end.dailyRain.average);
  });

  it("applies season modifiers after the biome profile", () => {
    const project = projectAtBiome("temperate");
    project.seasons[0] = {
      ...project.seasons[0],
      weatherModifier: {
        temperature: { averageOffset: -5 },
        rain: { averageMultiplier: 2 },
        dailyRain: { averageMultiplier: 3 },
        windSpeed: { averageMultiplier: 1.5 },
        traits: { precipitationChanceOffset: 0.2 },
        stateWeights: { snow: 2 }
      }
    };

    const profile = resolveEffectiveWeatherProfile(project, { absoluteDay: 0, hour: 12 });
    expect(profile.temperature.average).toBe(7);
    expect(profile.rain.average).toBe(2.4);
    expect(profile.dailyRain.average).toBe(9);
    expect(profile.windSpeed.average).toBe(22.5);
    expect(profile.traits.precipitationChance).toBeCloseTo(0.62);
    expect(profile.stateWeights.snow).toBe(2);
  });

  it("uses current project time for same-day biome transition daily summaries", () => {
    const base = changeWeatherBiome(projectAtBiome("temperate"), "hell", 8 * 60);
    const atFourMinutes = { ...base, currentTime: { ...base.currentTime, absoluteDay: 0, hour: 8, minute: 4 } };
    const atFiveMinutes = { ...base, currentTime: { ...base.currentTime, absoluteDay: 0, hour: 8, minute: 5 } };

    const firstSummary = getDailyWeatherSummary(atFourMinutes, 0)!;
    const steppedSummary = getDailyWeatherSummary(atFiveMinutes, 0)!;

    expect(firstSummary.averageTemperature).toBeLessThan(steppedSummary.averageTemperature);
    expect(firstSummary.maxTemperature).toBeLessThan(steppedSummary.maxTemperature);
  });

  it("lets same-day forecasts progress biome transitions through generated weather", () => {
    const project = changeWeatherBiome(projectAtBiome("temperate"), "hell", 8 * 60);
    project.currentTime = { absoluteDay: 0, hour: 8, minute: 0 };

    const currentWeather = generateWeatherForTime(project, 0, 8, 0)!;
    const forecastWeather = getForecastWeatherForTime(project, 0, 9, 1)!;

    expect(forecastWeather.temperature).toBeGreaterThan(currentWeather.temperature);
  });

  it("generates distinct weather from desert, arctic and cave base profiles", () => {
    const desert = generateWeatherForTime(projectAtBiome("desert"), 4, 12)!;
    const arctic = generateWeatherForTime(projectAtBiome("arctic"), 4, 12)!;
    const cave = generateWeatherForTime(projectAtBiome("cave"), 4, 12)!;

    expect(desert.temperature).toBeGreaterThan(arctic.temperature);
    expect(arctic.temperature).toBeLessThanOrEqual(2);
    expect(cave.windSpeed).toBeLessThan(desert.windSpeed);
  });
});