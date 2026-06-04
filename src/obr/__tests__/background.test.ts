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

  it("opens an external confirmation modal for an inactive scene profile and clears scene overrides", async () => {
    vi.resetModules();
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => { store.set(key, value); }),
      removeItem: vi.fn((key: string) => { store.delete(key); })
    });

    const metadataKey = "com.gmtools.calendar.sceneWeather";
    const modalOpen = vi.fn(async () => undefined);
    const setMetadata = vi.fn(async () => undefined);
    vi.doMock("@owlbear-rodeo/sdk", () => ({
      default: {
        isAvailable: true,
        onReady: (callback: () => void) => callback(),
        tool: { create: vi.fn(async () => undefined), createAction: vi.fn(async () => undefined) },
        modal: { open: modalOpen },
        player: { getRole: async () => "GM" },
        room: { id: "room-a" },
        scene: {
          isReady: async () => true,
          getMetadata: async () => ({ [metadataKey]: { profileId: "clear-day", isActive: false } }),
          setMetadata,
          onReadyChange: () => () => undefined,
          onMetadataChange: () => () => undefined
        }
      }
    }));

    const { createDefaultCalendarProject } = await import("../../storage/calendarStorage");
    const project = createDefaultCalendarProject();
    project.currentTime = { absoluteDay: 0, hour: 8, minute: 0 };
    project.weatherOverrides = [
      { id: "old-scene", absoluteDay: 0, source: "sceneWeather", sceneId: "old", temperature: 1 },
      { id: "manual", absoluteDay: 0, source: "manual", temperature: 2 }
    ];
    store.set("calendar-obr.project.room-a", JSON.stringify(project));

    await import("../../background");
    for (let i = 0; i < 10 && modalOpen.mock.calls.length === 0; i += 1) {
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const saved = JSON.parse(store.get("calendar-obr.project.room-a") ?? "{}");
    expect(saved.weatherOverrides).toEqual([{ id: "manual", absoluteDay: 0, source: "manual", temperature: 2 }]);
    expect(setMetadata).toHaveBeenCalledWith({ [metadataKey]: { profileId: "clear-day", isActive: false, lastPromptedAtMinutes: 480 } });
    expect(modalOpen).toHaveBeenCalledWith(expect.objectContaining({
      id: "calendar-obr/scene-weather-confirm-modal",
      url: expect.stringContaining("view=scene-weather-confirm")
    }));
  });
  
it("does not reopen the confirmation modal from polling when only calendar time changes", async () => {
    vi.resetModules();
    vi.useFakeTimers();
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => { store.set(key, value); }),
      removeItem: vi.fn((key: string) => { store.delete(key); })
    });

    const metadataKey = "com.gmtools.calendar.sceneWeather";
    let metadataCallback: (() => void) | undefined;
    const modalOpen = vi.fn(async () => undefined);
    vi.doMock("@owlbear-rodeo/sdk", () => ({
      default: {
        isAvailable: true,
        onReady: (callback: () => void) => callback(),
        tool: { create: vi.fn(async () => undefined), createAction: vi.fn(async () => undefined) },
        modal: { open: modalOpen },
        player: { getRole: async () => "GM" },
        room: { id: "room-a" },
        scene: {
          isReady: async () => true,
          getMetadata: async () => ({ [metadataKey]: { profileId: "clear-day", isActive: false } }),
          setMetadata: vi.fn(async () => undefined),
          onReadyChange: () => () => undefined,
          onMetadataChange: (callback: () => void) => { metadataCallback = callback; return () => undefined; }
        }
      }
    }));

    const { createDefaultCalendarProject } = await import("../../storage/calendarStorage");
    const project = createDefaultCalendarProject();
    project.currentTime = { absoluteDay: 0, hour: 8, minute: 0 };
    store.set("calendar-obr.project.room-a", JSON.stringify(project));

    await import("../../background");
    for (let i = 0; i < 10 && modalOpen.mock.calls.length === 0; i += 1) {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(0);
    }
    expect(modalOpen).toHaveBeenCalledTimes(1);

    const saved = JSON.parse(store.get("calendar-obr.project.room-a") ?? "{}");
    saved.currentTime = { absoluteDay: 0, hour: 8, minute: 5 };
    store.set("calendar-obr.project.room-a", JSON.stringify(saved));
    modalOpen.mockClear();

    await vi.advanceTimersByTimeAsync(1500);
    await Promise.resolve();
    metadataCallback?.();
    await Promise.resolve();

    expect(modalOpen).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

});