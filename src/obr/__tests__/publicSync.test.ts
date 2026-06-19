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
import { publishPublicSnapshot, SNAPSHOT_RESPONSE_CHANNEL } from "../publicSync";

describe("publicSync", () => {
  beforeEach(() => {
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
});
