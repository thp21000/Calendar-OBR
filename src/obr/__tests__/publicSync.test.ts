import { beforeEach, describe, expect, it, vi } from "vitest";

const obrMock = vi.hoisted(() => ({
  sendMessage: vi.fn(async () => undefined),
  onReady: vi.fn((callback: () => void) => callback()),
  obr: {
    isAvailable: true,
    broadcast: { sendMessage: vi.fn(async () => undefined), onMessage: vi.fn(() => vi.fn()) },
    room: { getMetadata: vi.fn(async () => ({})), setMetadata: vi.fn(async () => undefined), onMetadataChange: vi.fn(() => vi.fn()) },
    onReady: vi.fn((callback: () => void) => callback())
  }
}));
obrMock.obr.broadcast.sendMessage = obrMock.sendMessage;
obrMock.obr.onReady = obrMock.onReady;

vi.mock("@owlbear-rodeo/sdk", () => ({ default: obrMock.obr }));

import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { readCachedPublicSnapshot, readScopedCachedPublicSnapshot, publishPublicSnapshot, SNAPSHOT_RESPONSE_CHANNEL } from "../publicSync";

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
    obrMock.onReady.mockClear();
    obrMock.obr.isAvailable = true;
  });

  it("proactively broadcasts a full public snapshot", async () => {
    const project = createDefaultCalendarProject();

    await publishPublicSnapshot(project, 7);

    expect(obrMock.sendMessage).toHaveBeenCalledWith(
      SNAPSHOT_RESPONSE_CHANNEL,
      expect.objectContaining({
        type: "today-snapshot",
        snapshot: expect.objectContaining({ revision: 7, calendarName: project.name })
      }),
      { destination: "REMOTE" }
    );
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