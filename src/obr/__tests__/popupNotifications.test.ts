import { beforeEach, describe, expect, it, vi } from "vitest";

const obrMock = vi.hoisted(() => ({
  modalOpen: vi.fn(async () => undefined),
  obr: { isAvailable: false, modal: { open: vi.fn(async () => undefined), close: vi.fn(async () => undefined) } }
}));
obrMock.obr.modal.open = obrMock.modalOpen;

vi.mock("@owlbear-rodeo/sdk", () => ({ default: obrMock.obr }));

import { clearPopupNotificationPayload, estimateNotificationModalHeight, readPopupNotificationPayload, savePopupNotificationPayload, sendPopupNotification } from "../popupNotifications";

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
});
