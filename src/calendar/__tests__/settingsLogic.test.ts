import { describe, expect, it } from "vitest";
import { clampDateParts, ensureValidCalendarSystem } from "../settingsLogic";
import type { CalendarSystem, UiSettings } from "../../domain/types";

const system: CalendarSystem = {
  eraName: "AR",
  startYear: 1000,
  firstWeekdayOffset: 0,
  months: [{ id: "m1", name: "M1", order: 1, days: 30 }, { id: "m2", name: "M2", order: 2, days: 20 }],
  weekdays: [{ id: "d1", name: "D1", order: 1 }]
};

describe("settingsLogic", () => {
  it("clamps too-high day to month max", () => {
    const result = clampDateParts({ year: 1000, monthId: "m2", dayOfMonth: 99, hour: 9, minute: 0 }, system);
    expect(result.dayOfMonth).toBe(20);
  });

  it("prevents zero months", () => {
    const normalized = ensureValidCalendarSystem({ ...system, months: [] });
    expect(normalized.months.length).toBe(1);
  });

  it("prevents month days less than one", () => {
    const normalized = ensureValidCalendarSystem({ ...system, months: [{ id: "m1", name: "X", order: 1, days: 0 }] });
    expect(normalized.months[0].days).toBe(1);
  });

  it("prevents zero weekdays", () => {
    const normalized = ensureValidCalendarSystem({ ...system, weekdays: [] });
    expect(normalized.weekdays.length).toBe(1);
  });

  it("normalizes invalid firstWeekdayOffset", () => {
    const normalized = ensureValidCalendarSystem({ ...system, firstWeekdayOffset: -4 });
    expect(normalized.firstWeekdayOffset).toBe(0);
  });
  it("accepts monthGridStartsOnWeekdayId in uiSettings type", () => {
    const ui: UiSettings = { activeTab: "settings", compactMode: true, monthGridStartsOnWeekdayId: "d1" };
    expect(ui.monthGridStartsOnWeekdayId).toBe("d1");
  });
});
