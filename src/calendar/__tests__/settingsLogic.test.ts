import { describe, expect, it } from "vitest";
import {
  addMonth,
  addWeekday,
  clampDateParts,
  ensureValidCalendarSystem,
  moveMonth,
  moveWeekday,
  normalizeUiSettingsWeekdaySelection,
  removeMonth,
  removeWeekday,
  updateMonth,
  updateWeekday
} from "../settingsLogic";
import type { CalendarSystem, UiSettings } from "../../domain/types";

const system: CalendarSystem = {
  eraName: "AR",
  startYear: 1000,
  firstWeekdayOffset: 0,
  months: [{ id: "m1", name: "M1", order: 1, days: 30 }, { id: "m2", name: "M2", order: 2, days: 20 }],
  weekdays: [{ id: "d1", name: "D1", order: 1 }, { id: "d2", name: "D2", order: 2 }]
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

it("moves month and keeps order coherent", () => {
    const moved = moveMonth(system, "m2", -1);
    expect(moved.months[0].id).toBe("m2");
    expect(moved.months[0].order).toBe(1);
  });

  it("does not allow removing last month", () => {
    const oneMonth: CalendarSystem = { ...system, months: [{ id: "m1", name: "M1", order: 1, days: 30 }] };
    expect(removeMonth(oneMonth, "m1").months).toHaveLength(1);
  });

  it("removing weekday clamps firstWeekdayOffset", () => {
    const s: CalendarSystem = { ...system, firstWeekdayOffset: 1, weekdays: [{ id: "d1", name: "D1", order: 1 }, { id: "d2", name: "D2", order: 2 }] };
    const removed = removeWeekday(s, "d2");
    expect(removed.firstWeekdayOffset).toBe(0);
  });

  it("invalid selected monthGridStartsOnWeekdayId falls back", () => {
    const ui: UiSettings = { activeTab: "month", compactMode: true, monthGridStartsOnWeekdayId: "missing" };
    const normalized = normalizeUiSettingsWeekdaySelection(system, ui);
    expect(normalized.monthGridStartsOnWeekdayId).toBe("d1");
  });

  it("updateMonth enforces minimum days", () => {
    const updated = updateMonth(system, "m1", { days: 0 });
    expect(updated.months.find((m) => m.id === "m1")?.days).toBe(1);
  });

  it("add/remove/update/move weekday functions stay stable", () => {
    const added = addWeekday(system);
    const moved = moveWeekday(added, added.weekdays[2].id, -1);
    const updated = updateWeekday(moved, moved.weekdays[0].id, { name: "Changed" });
    const removed = removeWeekday(updated, updated.weekdays[1].id);
    expect(removed.weekdays.length).toBeGreaterThan(0);
  });

  it("add month works", () => {
    const added = addMonth(system);
    expect(added.months.length).toBe(3);
  });