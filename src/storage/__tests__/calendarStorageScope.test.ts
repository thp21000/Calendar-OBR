import { describe, expect, it, vi } from "vitest";
import { createDefaultCalendarProject, loadCalendarProject, saveCalendarProject } from "../calendarStorage";

describe("calendarStorage scoped keys", () => {
  it("saving in key A does not modify key B", () => {
    const memory = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, v),
      removeItem: (k: string) => memory.delete(k)
    });

    const a = createDefaultCalendarProject();
    a.name = "A";
    const b = createDefaultCalendarProject();
    b.name = "B";

    expect(saveCalendarProject(a, "calendar-obr.project.roomA").ok).toBe(true);
    expect(saveCalendarProject(b, "calendar-obr.project.roomB").ok).toBe(true);

    expect(loadCalendarProject("calendar-obr.project.roomA").name).toBe("A");
    expect(loadCalendarProject("calendar-obr.project.roomB").name).toBe("B");

    vi.unstubAllGlobals();
  });
});
