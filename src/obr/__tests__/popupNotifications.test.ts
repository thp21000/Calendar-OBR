import { beforeEach, describe, expect, it, vi } from "vitest";

const obrMock = vi.hoisted(() => ({
  modalOpen: vi.fn(async () => undefined),
  sendMessage: vi.fn(async () => undefined),
  onMessage: vi.fn(() => vi.fn()),
  onReady: vi.fn((callback: () => void) => callback()),
  setMetadata: vi.fn(async () => undefined),
  getMetadata: vi.fn(async () => ({})),
  onMetadataChange: vi.fn(() => vi.fn()),
  obr: {
    isAvailable: false,
    modal: { open: vi.fn(async () => undefined), close: vi.fn(async () => undefined) },
    broadcast: { sendMessage: vi.fn(async () => undefined), onMessage: vi.fn(() => vi.fn()) },
    room: { setMetadata: vi.fn(async () => undefined), getMetadata: vi.fn(async () => ({})), onMetadataChange: vi.fn(() => vi.fn()) },
    onReady: vi.fn((callback: () => void) => callback())
  }
}));
obrMock.obr.modal.open = obrMock.modalOpen;
obrMock.obr.broadcast.sendMessage = obrMock.sendMessage;
obrMock.obr.broadcast.onMessage = obrMock.onMessage;
obrMock.obr.room.setMetadata = obrMock.setMetadata;
obrMock.obr.room.getMetadata = obrMock.getMetadata;
obrMock.obr.room.onMetadataChange = obrMock.onMetadataChange;
obrMock.obr.onReady = obrMock.onReady;

vi.mock("@owlbear-rodeo/sdk", () => ({ default: obrMock.obr }));

import { clearPopupNotificationPayload, estimateNotificationModalHeight, POPUP_NOTIFICATION_CHANNEL, PUBLIC_PLAYER_NOTIFICATION_KEY, readPopupNotificationPayload, savePopupNotificationPayload, sendPopupNotification, sendPopupNotificationToPlayers, setupPopupNotificationListener } from "../popupNotifications";

const createLocalStorageMock = () => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { store.set(key, value); }),
    removeItem: vi.fn((key: string) => { store.delete(key); }),
    clear: vi.fn(() => { store.clear(); })
  };
};

describe("popupNotifications", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    localStorage.clear();
    obrMock.modalOpen.mockClear();
    obrMock.sendMessage.mockClear();
    obrMock.onMessage.mockClear();
    obrMock.setMetadata.mockClear();
    obrMock.getMetadata.mockClear();
    obrMock.onMetadataChange.mockClear();
    obrMock.onReady.mockClear();
    obrMock.obr.isAvailable = false;
    vi.stubGlobal("location", new URL("https://example.test/index.html"));
  });

  it("stores, reads and clears popup notification payloads", () => {
    const payload = { type: "event" as const, audience: "gm" as const, title: "Title", body: "Body", date: "Today" };
    const id = savePopupNotificationPayload(payload);

    expect(readPopupNotificationPayload(id)).toEqual(payload);
    clearPopupNotificationPayload(id);
    expect(readPopupNotificationPayload(id)).toBeUndefined();
  });

  it("estimates compact and long modal heights", () => {
    expect(estimateNotificationModalHeight({ type: "event", audience: "gm", title: "Hi", body: "Short", date: "Today" })).toBe(260);
    expect(estimateNotificationModalHeight({
      type: "event",
      audience: "gm",
      title: "Long",
      body: "x".repeat(650),
      date: "Today"
    })).toBe(520);
  });

  it("opens an OBR notification modal when OBR is available", async () => {
    obrMock.obr.isAvailable = true;
    await sendPopupNotification({ type: "weather", audience: "players", title: "Storm", body: "Heavy rain", date: "Today" });

    expect(obrMock.modalOpen).toHaveBeenCalledWith(expect.objectContaining({
      id: expect.stringContaining("calendar-obr-notification-modal-notification-"),
      url: expect.stringContaining("view=notification"),
      width: 460,
      height: 260
    }));
  });

  it("broadcasts player notifications without opening a local GM modal", async () => {
    obrMock.obr.isAvailable = true;
    const payload = { type: "weather" as const, audience: "players" as const, title: "Storm", body: "Heavy rain", date: "Today" };

    await sendPopupNotificationToPlayers(payload);

    expect(obrMock.setMetadata).toHaveBeenCalledWith({
      [PUBLIC_PLAYER_NOTIFICATION_KEY]: expect.objectContaining({ type: "popup-notification", payload, id: expect.any(String), createdAt: expect.any(Number) })
    });
    expect(obrMock.sendMessage).toHaveBeenCalledWith(
      POPUP_NOTIFICATION_CHANNEL,
      expect.objectContaining({ type: "popup-notification", payload, id: expect.any(String), createdAt: expect.any(Number) }),
      { destination: "REMOTE" }
    );
    expect(obrMock.modalOpen).not.toHaveBeenCalled();
  });

  it("opens remote player notifications only on player clients", () => {
    obrMock.obr.isAvailable = true;
    const payload = { type: "moon" as const, audience: "players" as const, title: "Moon", body: "Narrative", date: "Tonight" };

    setupPopupNotificationListener("player");
    const onMessageCalls = obrMock.onMessage.mock.calls as unknown as Array<[string, (event: { data: unknown }) => void]>;
    const handler = onMessageCalls[0]?.[1];
    const message = { type: "popup-notification" as const, id: "remote-1", createdAt: 123, payload };
    handler?.({ data: message });
    handler?.({ data: message });

    expect(obrMock.onMessage).toHaveBeenCalledWith(POPUP_NOTIFICATION_CHANNEL, expect.any(Function));
    expect(obrMock.modalOpen).toHaveBeenCalledTimes(1);

    obrMock.modalOpen.mockClear();
    setupPopupNotificationListener("gm");
    expect(obrMock.onMessage).toHaveBeenCalledTimes(1);
    expect(obrMock.onMetadataChange).toHaveBeenCalledTimes(1);
    expect(obrMock.modalOpen).not.toHaveBeenCalled();
  });

  it("ignores malformed remote popup notification messages", () => {
    obrMock.obr.isAvailable = true;

    setupPopupNotificationListener("player");
    const onMessageCalls = obrMock.onMessage.mock.calls as unknown as Array<[string, (event: { data: unknown }) => void]>;
    const handler = onMessageCalls[0]?.[1];
    handler?.({ data: { type: "popup-notification", payload: { audience: "players", title: "Missing fields" } } });

    expect(obrMock.modalOpen).not.toHaveBeenCalled();
  });

  it("opens latest persisted player notifications from room metadata", async () => {
    obrMock.obr.isAvailable = true;
    const payload = { type: "weather" as const, audience: "players" as const, title: "Rain", body: "Narrative rain", date: "Today" };
    obrMock.getMetadata.mockResolvedValueOnce({ [PUBLIC_PLAYER_NOTIFICATION_KEY]: { type: "popup-notification", id: "persisted-1", createdAt: 456, payload } });

    setupPopupNotificationListener("player");
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(obrMock.modalOpen).toHaveBeenCalled();
  });
});