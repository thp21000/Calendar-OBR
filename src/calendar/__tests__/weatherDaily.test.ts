import { describe, expect, it } from "vitest";
import { getDailyWeatherSummary } from "../weatherDaily";
import { WEATHER_STATES } from "../weatherStates";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";

describe("weatherDaily", () => {
  it("returns undefined when no season matches", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [];
    expect(getDailyWeatherSummary(project, 0)).toBeUndefined();
  });

  it("returns a summary when a season exists", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [
      {
        id: "s1",
        name: "Season",
        start: { monthId: "month-1", dayOfMonth: 1 },
        end: { monthId: "month-2", dayOfMonth: 30 },
        weatherProfile: {
          temperature: { min: 2, average: 10, max: 18 },
          windSpeed: { min: 1, average: 8, max: 20 },
          rain: { min: 0, average: 2, max: 7 }
        }
      }
    ];

    const summary = getDailyWeatherSummary(project, 3);
    expect(summary).toBeDefined();
    expect(summary?.absoluteDay).toBe(3);
  });

  it("is deterministic with same seed", () => {
    const project = createDefaultCalendarProject();
    project.weatherSettings.seed = "stable-seed";
    project.seasons = [
      {
        id: "s1",
        name: "Season",
        start: { monthId: "month-1", dayOfMonth: 1 },
        end: { monthId: "month-2", dayOfMonth: 30 },
        weatherProfile: {
          temperature: { min: -2, average: 6, max: 14 },
          windSpeed: { min: 0, average: 10, max: 24 },
          rain: { min: 0, average: 3, max: 9 }
        }
      }
    ];

    const a = getDailyWeatherSummary(project, 8);
    const b = getDailyWeatherSummary(project, 8);
    expect(a).toEqual(b);
  });

  it("keeps temperatures ordered and inside seasonal bounds", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [
      {
        id: "s1",
        name: "Season",
        start: { monthId: "month-1", dayOfMonth: 1 },
        end: { monthId: "month-2", dayOfMonth: 30 }
      }
    ];
    project.weatherBiomeProfiles = {
      temperate: {
        temperature: { min: 1, average: 9, max: 12 },
        windSpeed: { min: 0, average: 8, max: 18 },
        rain: { min: 0, average: 2, max: 5 },
        dailyRain: { min: 0, average: 4, max: 10 },
        traits: { stability: 0.6, precipitationChance: 0.4, fogChance: 0.2, stormChance: 0.1, dayNightAmplitude: 4, windVariability: 0.4 },
        stateWeights: {}
      }
    };

    const summary = getDailyWeatherSummary(project, 10);
    expect(summary).toBeDefined();
    if (!summary) return;
    expect(summary.minTemperature).toBeLessThanOrEqual(summary.averageTemperature);
    expect(summary.averageTemperature).toBeLessThanOrEqual(summary.maxTemperature);
    expect(summary.minTemperature).toBeGreaterThanOrEqual(1);
    expect(summary.maxTemperature).toBeLessThanOrEqual(12);
  });

  it("never returns negative rain or wind", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [
      {
        id: "s1",
        name: "Season",
        start: { monthId: "month-1", dayOfMonth: 1 },
        end: { monthId: "month-2", dayOfMonth: 30 },
        weatherProfile: {
          temperature: { min: 0, average: 8, max: 16 },
          windSpeed: { min: 0, average: 12, max: 30 },
          rain: { min: 0, average: 3, max: 8 }
        }
      }
    ];

    const summary = getDailyWeatherSummary(project, 5);
    expect(summary).toBeDefined();
    if (!summary) return;
    expect(summary.rainTotal24h).toBeGreaterThanOrEqual(0);
    expect(summary.maxWindSpeed).toBeGreaterThanOrEqual(0);
  });

  it("humid season trends wetter than dry season over deterministic sample", () => {
    const dry = createDefaultCalendarProject();
    dry.weatherSettings.seed = "compare-seed";
    dry.seasons = [
      {
        id: "dry",
        name: "Dry",
        start: { monthId: "month-1", dayOfMonth: 1 },
        end: { monthId: "month-2", dayOfMonth: 30 },
        weatherModifier: {
          rain: { averageMultiplier: 0.1, maxMultiplier: 0.2 },
          dailyRain: { averageMultiplier: 0.1, maxMultiplier: 0.2 },
          traits: { precipitationChanceOffset: -0.3, stormChanceOffset: -0.1 }
        }
      }
    ];

    const wet = createDefaultCalendarProject();
    wet.weatherSettings.seed = "compare-seed";
    wet.seasons = [
      {
        id: "wet",
        name: "Wet",
        start: { monthId: "month-1", dayOfMonth: 1 },
        end: { monthId: "month-2", dayOfMonth: 30 },
        weatherModifier: {
          rain: { averageMultiplier: 2, maxMultiplier: 2 },
          dailyRain: { averageMultiplier: 2, maxMultiplier: 2 },
          traits: { precipitationChanceOffset: 0.3, stormChanceOffset: 0.1 }
        }
      }
    ];

    const days = [2, 7, 13, 19, 26];
    const dryTotal = days.reduce((sum, day) => sum + (getDailyWeatherSummary(dry, day)?.rainTotal24h ?? 0), 0);
    const wetTotal = days.reduce((sum, day) => sum + (getDailyWeatherSummary(wet, day)?.rainTotal24h ?? 0), 0);

    expect(wetTotal).toBeGreaterThan(dryTotal);
  });

  it("windy season trends stronger max wind than calm season", () => {
    const calm = createDefaultCalendarProject();
    calm.weatherSettings.seed = "wind-seed";
    calm.seasons = [
      {
        id: "calm",
        name: "Calm",
        start: { monthId: "month-1", dayOfMonth: 1 },
        end: { monthId: "month-2", dayOfMonth: 30 },
        weatherProfile: {
          temperature: { min: 3, average: 10, max: 18 },
          windSpeed: { min: 0, average: 5, max: 12 },
          rain: { min: 0, average: 2, max: 6 }
        }
      }
    ];

    const windy = createDefaultCalendarProject();
    windy.weatherSettings.seed = "wind-seed";
    windy.seasons = [
      {
        id: "windy",
        name: "Windy",
        start: { monthId: "month-1", dayOfMonth: 1 },
        end: { monthId: "month-2", dayOfMonth: 30 },
        weatherProfile: {
          temperature: { min: 3, average: 10, max: 18 },
          windSpeed: { min: 8, average: 20, max: 40 },
          rain: { min: 0, average: 2, max: 6 }
        }
      }
    ];

    const days = [1, 6, 11, 16, 21];
    const calmTotal = days.reduce((sum, day) => sum + (getDailyWeatherSummary(calm, day)?.maxWindSpeed ?? 0), 0);
    const windyTotal = days.reduce((sum, day) => sum + (getDailyWeatherSummary(windy, day)?.maxWindSpeed ?? 0), 0);

    expect(windyTotal).toBeGreaterThan(calmTotal);
  });

  it("dominantState is a valid weather state", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [
      {
        id: "s1",
        name: "Season",
        start: { monthId: "month-1", dayOfMonth: 1 },
        end: { monthId: "month-2", dayOfMonth: 30 },
        weatherProfile: {
          temperature: { min: -5, average: 2, max: 8 },
          windSpeed: { min: 0, average: 14, max: 35 },
          rain: { min: 0, average: 4, max: 11 }
        }
      }
    ];

    const summary = getDailyWeatherSummary(project, 4);
    expect(summary).toBeDefined();
    if (!summary) return;
    expect(WEATHER_STATES).toContain(
      summary.dominantState
    );
  });

  it("accepts specialized states favored by biome state weights", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [
      {
        id: "s1",
        name: "Season",
        start: { monthId: "month-1", dayOfMonth: 1 },
        end: { monthId: "month-2", dayOfMonth: 30 }
      }
    ];
    project.weatherBiomeProfiles = {
      temperate: {
        temperature: { min: 5, average: 15, max: 25 },
        rain: { min: 0, average: 1, max: 4 },
        dailyRain: { min: 0, average: 2, max: 8 },
        windSpeed: { min: 0, average: 8, max: 25 },
        traits: { stability: 0.7, precipitationChance: 0.25, fogChance: 0.1, stormChance: 0.05, dayNightAmplitude: 8, windVariability: 0.25 },
        stateWeights: Object.fromEntries(WEATHER_STATES.map((state) => [state, state === "volcanicAsh" ? 5 : 0])) as any
      }
    };

    const summary = getDailyWeatherSummary(project, 4);
    expect(summary).toBeDefined();
    expect(summary?.dominantState).toBe("volcanicAsh");
  });

  it("la tendance influence température/pluie/vent et reste déterministe", () => {
    const project = createDefaultCalendarProject();
    project.weatherSettings.seed = "trend-daily";
    project.seasons = [{
      id: "s1",
      name: "Season",
      start: { monthId: "month-1", dayOfMonth: 1 },
      end: { monthId: "month-2", dayOfMonth: 30 },
      weatherProfile: {
        temperature: { min: 0, average: 12, max: 22 },
        windSpeed: { min: 0, average: 12, max: 30 },
        rain: { min: 0, average: 3, max: 9 },
        stability: 0.5,
        precipitationChance: 0.5,
        stormChance: 0.5,
        windVariability: 0.5
      }
    }];

    const a = getDailyWeatherSummary(project, 10)!;
    const b = getDailyWeatherSummary(project, 10)!;
    const c = getDailyWeatherSummary(project, 25)!;
    expect(a).toEqual(b);
    expect(a.trendKind).toBeDefined();
    expect(a.averageTemperature !== c.averageTemperature || a.rainTotal24h !== c.rainTotal24h || a.maxWindSpeed !== c.maxWindSpeed).toBe(true);
  });

  it("override force dailyRainTotal et dominantState", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [{ id:"s1", name:"S", start:{monthId:"month-1",dayOfMonth:1}, end:{monthId:"month-2",dayOfMonth:30} } as any];
    project.weatherOverrides = [{ id:"o1", absoluteDay: 4, dailyRainTotal: 12, dominantState: "storm" }];
    const s = getDailyWeatherSummary(project, 4)!;
    expect(s.rainTotal24h).toBe(12);
    expect(s.dominantState).toBe("storm");
  });

  it("applique les overrides horaires actifs maintenant au résumé du jour courant", () => {
    const project = createDefaultCalendarProject();
    project.currentTime = { absoluteDay: 4, hour: 1, minute: 30 };
    project.seasons = [{ id:"s1", name:"S", start:{monthId:"month-1",dayOfMonth:1}, end:{monthId:"month-2",dayOfMonth:30} } as any];
    project.weatherOverrides = [{
      id:"scene-weather-now",
      absoluteDay: 4,
      startMinuteOfDay: 60,
      endMinuteOfDay: 120,
      source: "sceneWeather",
      dailyRainTotal: 33,
      dailyMinTemperature: 4,
      dailyMaxTemperature: 9,
      dominantState: "heavyRain",
      trendKind: "wet"
    } as any];

    const summary = getDailyWeatherSummary(project, 4)!;

    expect(summary.rainTotal24h).toBeGreaterThanOrEqual(28.1);
    expect(summary.rainTotal24h).toBeLessThanOrEqual(38);
    expect(summary.minTemperature).toBeGreaterThanOrEqual(3);
    expect(summary.minTemperature).toBeLessThanOrEqual(5);
    expect(summary.maxTemperature).toBeGreaterThanOrEqual(8);
    expect(summary.maxTemperature).toBeLessThanOrEqual(10);
    expect(summary.dominantState).toBe("heavyRain");
    expect(summary.trendKind).toBe("wet");
  });

});
