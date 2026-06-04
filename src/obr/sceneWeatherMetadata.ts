import OBR from "@owlbear-rodeo/sdk";
import type { SceneWeatherSceneState } from "../domain/types";

export const SCENE_WEATHER_METADATA_KEY = "com.gmtools.calendar.sceneWeather";

const onObrReady = async <T>(callback: () => Promise<T> | T, fallback: T): Promise<T> => {
  if (!OBR.isAvailable) return fallback;
  return new Promise((resolve) => {
    OBR.onReady(async () => {
      try {
        resolve(await callback());
      } catch {
        resolve(fallback);
      }
    });
  });
};

const isSceneWeatherState = (value: unknown): value is SceneWeatherSceneState => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const state = value as Record<string, unknown>;
  return (state.profileId === undefined || typeof state.profileId === "string")
    && (state.profileName === undefined || typeof state.profileName === "string")
    && (state.profileIcon === undefined || typeof state.profileIcon === "string")
    && (state.isActive === undefined || typeof state.isActive === "boolean")
    && (state.lastAppliedAtMinutes === undefined || typeof state.lastAppliedAtMinutes === "number")
    && (state.lastPromptedAtMinutes === undefined || typeof state.lastPromptedAtMinutes === "number");
};

export const getSceneWeatherState = async (): Promise<SceneWeatherSceneState | undefined> =>
  onObrReady(async () => {
    const ready = await OBR.scene.isReady();
    if (!ready) return undefined;
    const metadata = await OBR.scene.getMetadata();
    const value = metadata[SCENE_WEATHER_METADATA_KEY];
    return isSceneWeatherState(value) ? value : undefined;
  }, undefined);

export const setSceneWeatherState = async (nextState: SceneWeatherSceneState): Promise<void> => {
  await onObrReady(async () => {
    const ready = await OBR.scene.isReady();
    if (!ready) return;
    await OBR.scene.setMetadata({ [SCENE_WEATHER_METADATA_KEY]: nextState });
  }, undefined);
};

export const clearSceneWeatherState = async (): Promise<void> => {
  await onObrReady(async () => {
    const ready = await OBR.scene.isReady();
    if (!ready) return;
    await OBR.scene.setMetadata({ [SCENE_WEATHER_METADATA_KEY]: undefined });
  }, undefined);
};