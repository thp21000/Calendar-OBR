import { describe, expect, it, vi } from "vitest";

describe("OBR scene weather background", () => {
  it("registers a GM-only OBR tool/action instead of a context menu", async () => {
    vi.resetModules();
    const createTool = vi.fn(async () => undefined);
    const createAction = vi.fn(async () => undefined);
    const createContextMenu = vi.fn(async () => undefined);
    vi.doMock("@owlbear-rodeo/sdk", () => ({
      default: {
        isAvailable: true,
        onReady: (callback: () => void) => callback(),
        tool: { create: createTool, createAction },
        contextMenu: { create: createContextMenu },
        modal: { open: vi.fn(async () => undefined) },
        player: { getRole: async () => "GM" },
        room: { id: "room-a" },
        scene: {
          isReady: async () => false,
          onReadyChange: () => () => undefined,
          onMetadataChange: () => () => undefined
        }
      }
    }));

    await import("../../background");
    await Promise.resolve();
    await Promise.resolve();

    expect(createContextMenu).not.toHaveBeenCalled();
    expect(createTool).toHaveBeenCalledWith(expect.objectContaining({
      id: "calendar-obr/scene-weather-tool",
      icons: [expect.objectContaining({ filter: { roles: ["GM"] } })]
    }));
    expect(createAction).toHaveBeenCalledWith(expect.objectContaining({
      id: "calendar-obr/scene-weather-action",
      icons: [expect.objectContaining({ filter: { activeTools: ["calendar-obr/scene-weather-tool"], roles: ["GM"] } })]
    }));
  });
});
