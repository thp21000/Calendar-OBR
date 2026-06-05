import { describe, expect, it } from "vitest";
import { getDailyWeatherSummary } from "../weatherDaily";
import { getWeatherTrendForDay } from "../weatherTrend";
import { DEFAULT_WEATHER_STATE_CONFIGS, DEFAULT_WEATHER_TREND_CONFIGS, WEATHER_TRENDS, chooseDominantWeatherState, getConfiguredWeatherStateIcon, getConfiguredWeatherTrendIcon, getWeatherAdvancedSettings, getWeatherStateLabel, getWeatherTrendLabel, normalizeWeatherAdvancedSettings, resolveGeneratedWeatherState } from "../weatherAdvancedSettings";
import { WEATHER_STATES } from "../weatherStates";
import { generateWeatherForTime } from "../weatherLogic";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";

describe("weatherAdvancedSettings", () => {
  it("provides defaults for every predefined weather state and trend", () => {
    for (const state of WEATHER_STATES) {
      expect(DEFAULT_WEATHER_STATE_CONFIGS[state]).toBeDefined();
      expect(DEFAULT_WEATHER_STATE_CONFIGS[state].enabled).toBe(true);
    }
    for (const trend of WEATHER_TRENDS) {
      expect(DEFAULT_WEATHER_TREND_CONFIGS[trend]).toBeDefined();
      expect(DEFAULT_WEATHER_TREND_CONFIGS[trend].enabled).toBe(true);
    }
  });

  it("merges partial config with defaults and ignores invalid numeric overrides", () => {
    const settings = normalizeWeatherAdvancedSettings({
      stateConfigs: {
        blizzard: { enabled: false, icon: "B", label: { fr: "Brouille" }, priority: Number.NaN, thresholds: { minWindSpeed: 30 } }
      },
      trendConfigs: {
        wet: { rainMultiplier: 2, windMultiplier: Number.NaN }
      }
    });

    expect(settings.stateConfigs.blizzard.enabled).toBe(false);
    expect(settings.stateConfigs.blizzard.icon).toBe("B");
    expect(settings.stateConfigs.blizzard.label?.fr).toBe("Brouille");
    expect(settings.stateConfigs.blizzard.priority).toBe(DEFAULT_WEATHER_STATE_CONFIGS.blizzard.priority);
    expect(settings.stateConfigs.blizzard.thresholds?.minWindSpeed).toBe(30);
    expect(settings.stateConfigs.clear.enabled).toBe(true);
    expect(settings.trendConfigs.wet.rainMultiplier).toBe(2);
    expect(settings.trendConfigs.wet.windMultiplier).toBe(DEFAULT_WEATHER_TREND_CONFIGS.wet.windMultiplier);
  });

  it("reads configured state and trend labels/icons", () => {
    const project = createDefaultCalendarProject();
    project.weatherAdvancedSettings = {
      stateConfigs: { storm: { icon: "S", label: { fr: "Orage maison", en: "Home storm" } } },
      trendConfigs: { wet: { icon: "W", label: { fr: "très humide", en: "very wet" } } }
    };

    expect(getConfiguredWeatherStateIcon(project, "storm")).toBe("S");
    expect(getWeatherStateLabel(project, "storm", "fr")).toBe("Orage maison");
    expect(getConfiguredWeatherTrendIcon(project, "wet")).toBe("W");
    expect(getWeatherTrendLabel(project, "wet", "en")).toBe("very wet");
  });

  it("falls back when generated automatic state is disabled", () => {
    const project = createDefaultCalendarProject();
    project.weatherAdvancedSettings = { stateConfigs: { blizzard: { enabled: false } } };
    expect(resolveGeneratedWeatherState(project, "blizzard")).toBe("snow");
  });

  it("skips disabled dominance rules for automatic generation", () => {
    const project = createDefaultCalendarProject();
    project.weatherAdvancedSettings = { dominanceConfigs: { monsoon: { enabled: false } } };
    const state = chooseDominantWeatherState(project, {
      minTemperature: 22,
      maxTemperature: 30,
      rainTotal24h: 80,
      maxWindSpeed: 20,
      stormChance: 0.4,
      fogChance: 0.1,
      precipitationChance: 0.9,
      rainAverage: 6
    });
    expect(state).not.toBe("monsoon");
  });

  it("does not let hardcoded daily dominance fallback select a disabled dominance rule", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "month-1", dayOfMonth: 1 }, end: { monthId: "month-2", dayOfMonth: 30 } }];
    project.weatherBiomeProfiles = {
      temperate: {
        temperature: { min: 22, average: 26, max: 32 },
        rain: { min: 20, average: 20, max: 20 },
        dailyRain: { min: 80, average: 80, max: 80 },
        windSpeed: { min: 5, average: 12, max: 20 },
        traits: { stability: 0.6, precipitationChance: 1, fogChance: 0.1, stormChance: 0.4, dayNightAmplitude: 4, windVariability: 0.2 },
        stateWeights: {}
      }
    };
    project.weatherAdvancedSettings = { dominanceConfigs: { monsoon: { enabled: false } } };

    const summary = getDailyWeatherSummary(project, 3);

    expect(summary?.dominantState).not.toBe("monsoon");
    expect(summary?.dominantState).toBe("heavyRain");
  });

  it("keeps forced override state when only its dominance rule is disabled", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "month-1", dayOfMonth: 1 }, end: { monthId: "month-2", dayOfMonth: 30 } }];
    project.weatherAdvancedSettings = { dominanceConfigs: { monsoon: { enabled: false } } };
    project.weatherOverrides = [{ id: "force-monsoon", absoluteDay: 3, state: "monsoon" }];

    expect(generateWeatherForTime(project, 3, 12)?.state).toBe("monsoon");
  });

  it("keeps forced override state even if disabled", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "month-1", dayOfMonth: 1 }, end: { monthId: "month-2", dayOfMonth: 30 } }];
    project.weatherAdvancedSettings = { stateConfigs: { blizzard: { enabled: false } } };
    project.weatherOverrides = [{ id: "force-blizzard", absoluteDay: 3, state: "blizzard" }];
    expect(generateWeatherForTime(project, 3, 12)?.state).toBe("blizzard");
  });

  it("uses configured trend modifiers", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "month-1", dayOfMonth: 1 }, end: { monthId: "month-2", dayOfMonth: 30 } }];
    project.weatherAdvancedSettings = { trendConfigs: Object.fromEntries(WEATHER_TRENDS.map((trend) => [trend, { enabled: trend === "stable", temperatureOffset: trend === "stable" ? 7 : undefined, rainMultiplier: trend === "stable" ? 3 : undefined, windMultiplier: trend === "stable" ? 2 : undefined }])) };
    const trend = getWeatherTrendForDay(project, 1);
    expect(trend.kind).toBe("stable");
    expect(trend.temperatureOffset).toBe(7);
    expect(trend.rainMultiplier).toBe(3);
    expect(trend.windMultiplier).toBe(2);
  });

  it("works when project has no advanced settings", () => {
    const project = createDefaultCalendarProject();
    expect(project.weatherAdvancedSettings).toBeUndefined();
    expect(getWeatherAdvancedSettings(project).stateConfigs.clear.enabled).toBe(true);
  });
});
