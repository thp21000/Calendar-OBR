import { beforeEach, describe, expect, it, vi } from "vitest";

const obrMock = vi.hoisted(() => ({
  sendMessage: vi.fn(async () => undefined),
  setMetadata: vi.fn(async () => undefined),
  getMetadata: vi.fn(async () => ({})),
  onMetadataChange: vi.fn(() => vi.fn()),
  onReady: vi.fn((callback: () => void) => callback()),
  obr: {
    isAvailable: true,
    broadcast: { sendMessage: vi.fn(async () => undefined), onMessage: vi.fn(() => vi.fn()) },
    room: { getMetadata: vi.fn(async () => ({})), setMetadata: vi.fn(async () => undefined), onMetadataChange: vi.fn(() => vi.fn()) },
    onReady: vi.fn((callback: () => void) => callback())
  }
}));
obrMock.obr.broadcast.sendMessage = obrMock.sendMessage;
obrMock.obr.room.setMetadata = obrMock.setMetadata;
obrMock.obr.room.getMetadata = obrMock.getMetadata;
obrMock.obr.room.onMetadataChange = obrMock.onMetadataChange;
obrMock.obr.onReady = obrMock.onReady;

vi.mock("@owlbear-rodeo/sdk", () => ({ default: obrMock.obr }));

import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { PUBLIC_SNAPSHOT_KEY, readCachedPublicSnapshot, readLatestPublicSnapshot, readScopedCachedPublicSnapshot, publishPublicSnapshot, SNAPSHOT_RESPONSE_CHANNEL, subscribeLatestPublicSnapshot } from "../publicSync";

const createLocalStorageMock = () => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { store.set(key, value); }),
    removeItem: vi.fn((key: string) => { store.delete(key); }),
    clear: vi.fn(() => { store.clear(); })
  };
};

describe("publicSync", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    localStorage.clear();
    obrMock.sendMessage.mockClear();
    obrMock.setMetadata.mockClear();
    obrMock.getMetadata.mockClear();
    obrMock.onMetadataChange.mockClear();
    obrMock.onReady.mockClear();
    obrMock.obr.isAvailable = true;
  });

  it("proactively broadcasts a full public snapshot", async () => {
    const project = createDefaultCalendarProject();

    await publishPublicSnapshot(project, 7);

    expect(obrMock.setMetadata).toHaveBeenCalledWith({
      [PUBLIC_SNAPSHOT_KEY]: expect.objectContaining({ revision: 7, calendarName: project.name })
    });
    expect(obrMock.sendMessage).toHaveBeenCalledWith(
      SNAPSHOT_RESPONSE_CHANNEL,
      expect.objectContaining({
        type: "today-snapshot",
        snapshot: expect.objectContaining({ revision: 7, calendarName: project.name })
      }),
      { destination: "REMOTE" }
    );
  });

  it("reads and subscribes to latest persisted public snapshots", async () => {
    const project = createDefaultCalendarProject();
    await publishPublicSnapshot(project, 9);
    const setMetadataCalls = obrMock.setMetadata.mock.calls as unknown as Array<[Record<string, unknown>]>;
    const snapshot = setMetadataCalls[0]?.[0][PUBLIC_SNAPSHOT_KEY];
    obrMock.getMetadata.mockResolvedValueOnce({ [PUBLIC_SNAPSHOT_KEY]: snapshot });

    await expect(readLatestPublicSnapshot()).resolves.toEqual(snapshot);

    const callback = vi.fn();
    subscribeLatestPublicSnapshot(callback);
    const metadataCalls = obrMock.onMetadataChange.mock.calls as unknown as Array<[(metadata: Record<string, unknown>) => void]>;
    const metadataHandler = metadataCalls[0]?.[0];
    metadataHandler({ [PUBLIC_SNAPSHOT_KEY]: snapshot });
    expect(callback).toHaveBeenCalledWith(snapshot);
  });

  it("drops invalid cached public snapshots", () => {
    localStorage.setItem("calendar-obr.publicSnapshot.cache", JSON.stringify({ schemaVersion: 1, revision: 1 }));
    localStorage.setItem("calendar-obr.publicSnapshot.cache.room-1", "not json");

    expect(readCachedPublicSnapshot()).toBeNull();
    expect(readScopedCachedPublicSnapshot("room-1")).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith("calendar-obr.publicSnapshot.cache");
    expect(localStorage.removeItem).toHaveBeenCalledWith("calendar-obr.publicSnapshot.cache.room-1");
  });
});