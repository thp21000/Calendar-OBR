import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import type { SceneWeatherProfile } from "../../domain/types";
import { applySceneWeatherProfile, cleanupExpiredSceneWeatherOverrides, disableSceneWeatherForScene, isSceneWeatherProfileEmpty } from "../sceneWeather";

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
      startMinuteOfDay: 480,
      endMinuteOfDay: 570,
      transitionDurationMinutes: 10,
      temperature: 3,
      rain: 7,
      windSpeed: 42,
      state: "storm"
    });
    expect(next.weatherOverrides?.[0].transitionFrom?.temperature).toEqual(expect.any(Number));
  });

  it("splits overrides when duration crosses midnight", () => {
    const project = { ...createDefaultCalendarProject(), currentTime: { absoluteDay: 2, hour: 23, minute: 30 } };
    const next = applySceneWeatherProfile(project, profile({ durationMinutes: 120 }), { sceneId: "night" });

    expect(next.weatherOverrides?.map((override) => [override.absoluteDay, override.startMinuteOfDay, override.endMinuteOfDay])).toEqual([
      [2, 1410, 1440],
      [3, 0, 90]
    ]);
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

  it("cleans up expired sceneWeather overrides without touching manual overrides", () => {
    const project = createDefaultCalendarProject();
    project.weatherOverrides = [
      { id: "manual", absoluteDay: 0, source: "manual" },
      { id: "expired", absoluteDay: 0, source: "sceneWeather", endMinuteOfDay: 10 },
      { id: "active", absoluteDay: 0, source: "sceneWeather", endMinuteOfDay: 30 }
    ];

    const next = cleanupExpiredSceneWeatherOverrides(project, 20);

    expect(next.weatherOverrides?.map((override) => override.id)).toEqual(["manual", "active"]);
  });
});
