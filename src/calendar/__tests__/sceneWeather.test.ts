import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import type { SceneWeatherProfile } from "../../domain/types";
import { applySceneWeatherProfile, cleanupExpiredSceneWeatherOverrides, disableSceneWeatherForScene, hasActiveSceneWeatherOverride, isSceneWeatherProfileEmpty } from "../sceneWeather";

const profile = (patch: Partial<SceneWeatherProfile> = {}): SceneWeatherProfile => ({
  id: "storm-scene",
  name: "Storm scene",
  enabled: true,
  durationMinutes: 90,
  transitionMinutes: 10,
  override: { temperature: 3, rain: 7, windSpeed: 42, state: "storm" },
  ...patch
});

describe("sceneWeather", () => {
  it("does not apply an empty profile", () => {
    const project = createDefaultCalendarProject();
    const empty = profile({ override: {}, forceBiomeId: undefined });

    expect(isSceneWeatherProfileEmpty(empty)).toBe(true);
    expect(applySceneWeatherProfile(project, empty)).toBe(project);
  });

  it("creates sceneWeather overrides with scene metadata and transition data", () => {
    const project = createDefaultCalendarProject();
    const next = applySceneWeatherProfile(project, profile(), { sceneId: "scene-a", sceneName: "Cave", currentWeather: { temperature: 12, rain: 0, windSpeed: 5, windDirection: "N" } });

    expect(next.weatherOverrides).toHaveLength(1);
    expect(next.weatherOverrides?.[0]).toMatchObject({
      source: "sceneWeather",
      sourceId: "storm-scene",
      sceneId: "scene-a",
      sceneName: "Cave",
      transitionDurationMinutes: 10,
      temperature: 3,
      rain: 7,
      windSpeed: 42,
      state: "storm"
    });
    expect(next.weatherOverrides?.[0].startMinuteOfDay).toBeUndefined();
    expect(next.weatherOverrides?.[0].endMinuteOfDay).toBeUndefined();
    expect(next.weatherOverrides?.[0].transitionFrom?.temperature).toEqual(expect.any(Number));
  });

  it("keeps sceneWeather overrides persistent instead of expiring by duration", () => {
    const project = { ...createDefaultCalendarProject(), currentTime: { absoluteDay: 2, hour: 23, minute: 30 } };
    const next = applySceneWeatherProfile(project, profile({ durationMinutes: 120 }), { sceneId: "night" });

    expect(next.weatherOverrides).toHaveLength(1);
    expect(next.weatherOverrides?.[0]).toMatchObject({ absoluteDay: 2, source: "sceneWeather", sceneId: "night" });
    expect(next.weatherOverrides?.[0].endMinuteOfDay).toBeUndefined();
    expect(hasActiveSceneWeatherOverride(next, "storm-scene", 5 * 1440, "night")).toBe(true);
  });

  it("changes biome when a preset profile forces one", () => {
    const project = createDefaultCalendarProject();
    const desertProfile = {
      id: "dry-heatwave",
      name: "Canicule sèche",
      enabled: true,
      forceBiomeId: "desert" as const,
      override: { state: "clear" as const, temperature: 38 }
    };

    const next = applySceneWeatherProfile(project, desertProfile, { sceneId: "scene-a" });

    expect(next.weatherBiome?.currentBiomeId).toBe("desert");
    expect(next.weatherOverrides?.[0].source).toBe("sceneWeather");
  });

  it("disables only sceneWeather overrides for the requested scene", () => {
    const project = createDefaultCalendarProject();
    project.weatherOverrides = [
      { id: "manual", absoluteDay: 0, temperature: 12, source: "manual" },
      { id: "scene-a", absoluteDay: 0, source: "sceneWeather", sceneId: "a", temperature: 1 },
      { id: "scene-b", absoluteDay: 0, source: "sceneWeather", sceneId: "b", temperature: 2 }
    ];

    const next = disableSceneWeatherForScene(project, "a");

    expect(next.weatherOverrides?.map((override) => override.id)).toEqual(["manual", "scene-b"]);
  });

  it("detects active sceneWeather overrides for the current scene", () => {
    const project = createDefaultCalendarProject();
    project.weatherOverrides = [
      { id: "manual", absoluteDay: 0, source: "manual" },
      { id: "scene-a", absoluteDay: 0, source: "sceneWeather", sourceId: "storm-scene", sceneId: "a", startMinuteOfDay: 60, endMinuteOfDay: 120 }
    ];

    expect(hasActiveSceneWeatherOverride(project, "storm-scene", 90, "a")).toBe(true);
    expect(hasActiveSceneWeatherOverride(project, "storm-scene", 90, "b")).toBe(false);
    expect(hasActiveSceneWeatherOverride(project, "storm-scene", 130, "a")).toBe(false);
  });
  
  it("cleans up expired sceneWeather overrides without touching manual overrides", () => {
    const project = createDefaultCalendarProject();
    project.weatherOverrides = [
      { id: "manual", absoluteDay: 0, source: "manual" },
      { id: "expired", absoluteDay: 0, source: "sceneWeather", endMinuteOfDay: 10 },
      { id: "active", absoluteDay: 0, source: "sceneWeather", endMinuteOfDay: 30 },
      { id: "persistent", absoluteDay: 0, source: "sceneWeather" }
    ];

    const next = cleanupExpiredSceneWeatherOverrides(project, 20);

    expect(next.weatherOverrides?.map((override) => override.id)).toEqual(["manual", "active", "persistent"]);
  });
});