import { describe, expect, it, vi } from "vitest";

describe("sceneInfo", () => {
  it("returns undefined outside OBR", async () => {
    vi.resetModules();
    vi.doMock("@owlbear-rodeo/sdk", () => ({ default: { isAvailable: false } }));
    const mod = await import("../sceneInfo");
    await expect(mod.getCurrentObrSceneInfo()).resolves.toBeUndefined();
  });

  it("does not invent a GM/MJ scene name", async () => {
    vi.resetModules();
    vi.doMock("@owlbear-rodeo/sdk", () => ({
      default: {
        isAvailable: true,
        onReady: (cb: () => void) => cb(),
        scene: { isReady: async () => true }
      }
    }));
    const mod = await import("../sceneInfo");
    const info = await mod.getCurrentObrSceneInfo();
    expect(info?.id).toBe("current-obr-scene");
    expect(info?.name).toBeUndefined();
  });
});
