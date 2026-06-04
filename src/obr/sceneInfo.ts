import OBR from "@owlbear-rodeo/sdk";

export type ObrSceneInfo = {
  id: string;
  name?: string;
};

const CURRENT_SCENE_FALLBACK_ID = "current-obr-scene";

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

/**
 * SDK 3.1 exposes scene readiness and scene metadata, but not the scene name.
 * Return a stable current-scene placeholder id without inventing a GM/player name.
 * Metadata itself remains per active scene, so scene-weather assignment is still
 * stored on the actual OBR scene.
 */
export const getCurrentObrSceneInfo = async (): Promise<ObrSceneInfo | undefined> =>
  onObrReady(async () => {
    const ready = await OBR.scene.isReady();
    if (!ready) return undefined;
    return { id: CURRENT_SCENE_FALLBACK_ID };
  }, undefined);

export const subscribeToObrSceneChange = (callback: () => void): (() => void) => {
  if (!OBR.isAvailable) return () => undefined;
  let cleanupReady: (() => void) | undefined;
  let cleanupMetadata: (() => void) | undefined;
  OBR.onReady(() => {
    cleanupReady = OBR.scene.onReadyChange((ready) => {
      if (ready) callback();
    });
    cleanupMetadata = OBR.scene.onMetadataChange(() => callback());
  });
  return () => {
    cleanupReady?.();
    cleanupMetadata?.();
  };
};
