import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { addDayNote, deleteDayNote, getDayNotesForDay, getPlayerVisibleDayNotesForDay, updateDayNote } from "../dayNotesLogic";

describe("dayNotesLogic", () => {
  it("gets notes for specific day only", () => {
    const p = createDefaultCalendarProject();
    p.dayNotes = [
      { id: "n1", date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 0, minute: 0 }, playerNote: "A", visibility: "players", updatedAt: 1 },
      { id: "n2", date: { year: 1000, monthId: "month-1", dayOfMonth: 2, hour: 0, minute: 0 }, playerNote: "B", visibility: "players", updatedAt: 1 }
    ];
    expect(getDayNotesForDay(p, { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 9, minute: 0 }).map((n) => n.id)).toEqual(["n1"]);
  });
  it("player sees only players visibility", () => {
    const p = createDefaultCalendarProject();
    p.dayNotes = [
      { id: "n1", date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 0, minute: 0 }, playerNote: "A", gmNote: "X", visibility: "players", updatedAt: 1 },
      { id: "n2", date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 0, minute: 0 }, gmNote: "X", visibility: "gm", updatedAt: 1 }
    ];
    expect(getPlayerVisibleDayNotesForDay(p, { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 0, minute: 0 }).map((n) => n.id)).toEqual(["n1"]);
  });
  it("update and delete note", () => {
    let p = createDefaultCalendarProject();
    p = addDayNote(p, { id: "n1", date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 0, minute: 0 }, visibility: "gm", updatedAt: 1, gmNote: "a" });
    p = updateDayNote(p, "n1", { gmNote: "b" });
    expect(p.dayNotes?.[0].gmNote).toBe("b");
    p = deleteDayNote(p, "n1");
    expect(p.dayNotes).toEqual([]);
  });
});

