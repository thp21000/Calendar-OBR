import { describe, expect, it } from "vitest";
import type { CalendarSystem, InternalTime } from "../../domain/types";
import {
  getCurrentMonthDays,
  getCurrentMonthFirstWeekdayIndex,
  getCurrentMonthWeekdayNames
} from "../monthView";

const baseSystem: CalendarSystem = {
  eraName: "AR",
  startYear: 1000,
  firstWeekdayOffset: 2,
  months: [
    { id: "m1", name: "Prime", order: 1, days: 30 },
    { id: "m2", name: "Bloom", order: 2, days: 20 }
  ],
  weekdays: [
    { id: "d1", name: "One", order: 1 },
    { id: "d2", name: "Two", order: 2 },
    { id: "d3", name: "Three", order: 3 },
    { id: "d4", name: "Four", order: 4 },
    { id: "d5", name: "Five", order: 5 }
  ]
};

describe("monthView logic", () => {
  it("returns 30 days for a 30-day month", () => {
    const current: InternalTime = { absoluteDay: 5, hour: 10, minute: 0 };
    expect(getCurrentMonthDays(current, baseSystem)).toHaveLength(30);
  });

  it("returns 20 days for a 20-day month", () => {
    const current: InternalTime = { absoluteDay: 35, hour: 10, minute: 0 };
    expect(getCurrentMonthDays(current, baseSystem)).toHaveLength(20);
  });

  it("detects current day", () => {
    const current: InternalTime = { absoluteDay: 35, hour: 10, minute: 0 };
    const days = getCurrentMonthDays(current, baseSystem);
    const found = days.find((d) => d.isCurrentDay);
    expect(found?.dayOfMonth).toBe(6);
  });

  it("respects firstWeekdayOffset for first day of month", () => {
    const current: InternalTime = { absoluteDay: 35, hour: 10, minute: 0 };
    expect(getCurrentMonthFirstWeekdayIndex(current, baseSystem)).toBe(2);
  });
});
