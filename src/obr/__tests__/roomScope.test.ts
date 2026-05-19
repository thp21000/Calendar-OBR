import { describe, expect, it, vi } from "vitest";

describe("room scope", () => {
  it("fallback local when OBR unavailable", async () => {
    vi.resetModules();
    vi.doMock("@owlbear-rodeo/sdk", () => ({ default: { isAvailable: false } }));
    const mod = await import("../roomScope");
    const scope = await mod.getStorageScope();
    expect(scope.type).toBe("local");
    expect(scope.storageKey).toBe("calendar-obr.project.local-dev");
  });
});
