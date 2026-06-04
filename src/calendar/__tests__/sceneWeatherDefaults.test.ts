import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import type { WeatherState } from "../../domain/types";
import { WEATHER_STATES } from "../weatherStates";
import { DEFAULT_SCENE_WEATHER_PROFILES, addMissingDefaultSceneWeatherProfiles, ensureDefaultSceneWeatherProfiles } from "../sceneWeatherDefaults";

const allowedStates = new Set<WeatherState>(WEATHER_STATES);

describe("sceneWeatherDefaults", () => {
  it("defines the requested preset scene weather profiles using shared weather states", () => {
    expect(DEFAULT_SCENE_WEATHER_PROFILES).toHaveLength(26);
    expect(DEFAULT_SCENE_WEATHER_PROFILES.map((profile) => profile.id)).toEqual([
      "clear-day", "cloudy-day", "overcast-day", "morning-fog", "damp-mist", "cold-drizzle", "steady-rain", "heavy-rain", "nearby-storm", "violent-tempest", "strong-wind", "dry-gusts", "dry-heatwave", "dry-cold", "light-snow", "heavy-snow", "snowstorm", "tropical-rain", "simple-monsoon", "rough-sea", "sea-fog", "volcanic-ash", "hellish-heat", "supernatural-calm", "damp-cave", "high-altitude"
    ]);
    for (const profile of DEFAULT_SCENE_WEATHER_PROFILES) {
      expect(profile.enabled).toBe(true);
      expect(profile.override.state ? allowedStates.has(profile.override.state) : true).toBe(true);
      expect(profile.override.dominantState ? allowedStates.has(profile.override.dominantState) : true).toBe(true);
    }
  });

  it("initializes defaults when sceneWeatherProfiles is absent or empty", () => {
    const project = createDefaultCalendarProject();
    const withoutProfiles = { ...project, sceneWeatherProfiles: undefined };
    const emptyProfiles = { ...project, sceneWeatherProfiles: [] };

    expect(ensureDefaultSceneWeatherProfiles(withoutProfiles).sceneWeatherProfiles).toHaveLength(26);
    expect(ensureDefaultSceneWeatherProfiles(emptyProfiles).sceneWeatherProfiles).toHaveLength(26);
  });

  it("does not overwrite custom profiles when at least one profile exists", () => {
    const project = createDefaultCalendarProject();
    const customized = { id: "clear-day", name: "Ma journée claire custom", enabled: false, override: { temperature: 99 } } as const;
    const next = ensureDefaultSceneWeatherProfiles({ ...project, sceneWeatherProfiles: [customized] });

    expect(next.sceneWeatherProfiles).toEqual([customized]);
  });

  it("adds only missing defaults without overwriting customized profiles", () => {
    const project = createDefaultCalendarProject();
    const customized = { ...DEFAULT_SCENE_WEATHER_PROFILES[0], name: "Custom clear", override: { ...DEFAULT_SCENE_WEATHER_PROFILES[0].override, temperature: 99 } };
    const next = addMissingDefaultSceneWeatherProfiles({ ...project, sceneWeatherProfiles: [customized] });

    expect(next.sceneWeatherProfiles).toHaveLength(26);
    expect(next.sceneWeatherProfiles?.find((profile) => profile.id === "clear-day")?.name).toBe("Custom clear");
    expect(next.sceneWeatherProfiles?.find((profile) => profile.id === "clear-day")?.override.temperature).toBe(99);
    expect(next.sceneWeatherProfiles?.some((profile) => profile.id === "snowstorm")).toBe(true);
  });

  it("lets a deleted preset be re-added by id", () => {
    const project = createDefaultCalendarProject();
    const withoutSnowstorm = (project.sceneWeatherProfiles ?? []).filter((profile) => profile.id !== "snowstorm");
    const next = addMissingDefaultSceneWeatherProfiles({ ...project, sceneWeatherProfiles: withoutSnowstorm });

    expect(next.sceneWeatherProfiles?.some((profile) => profile.id === "snowstorm")).toBe(true);
  });
});
