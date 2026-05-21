import { describe, expect, it, vi } from "vitest";

describe("player role", () => {
  it("fallback gm when OBR unavailable", async () => {
    vi.resetModules();
    vi.doMock("@owlbear-rodeo/sdk", () => ({ default: { isAvailable: false } }));
    const mod = await import("../playerRole");
    await expect(mod.getViewerRole()).resolves.toBe("gm");
  });

  it("returns player for PLAYER role", async () => {
    vi.resetModules();
    vi.doMock("@owlbear-rodeo/sdk", () => ({
      default: { isAvailable: true, onReady: (cb: () => void) => cb(), player: { getRole: async () => "PLAYER" } }
    }));
    const mod = await import("../playerRole");
    await expect(mod.getViewerRole()).resolves.toBe("player");
  });

  it("returns player for unknown role", async () => {
    vi.resetModules();
    vi.doMock("@owlbear-rodeo/sdk", () => ({
      default: { isAvailable: true, onReady: (cb: () => void) => cb(), player: { getRole: async () => "CAST" } }
    }));
    const mod = await import("../playerRole");
    await expect(mod.getViewerRole()).resolves.toBe("player");
  });
});
