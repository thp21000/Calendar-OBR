import { describe, expect, it } from "vitest";
import {
  absoluteDayToCalendarDate,
  addDays,
  addHours,
  addMinutes,
  calendarDateToAbsoluteDay,
  getDaysInYear,
  getMonthById
} from "../dateEngine";
import { importCalendarProject } from "../../importExport/calendarImportExport";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import type { CalendarSystem } from "../../domain/types";

const system: CalendarSystem = {
  eraName: "AR",
  startYear: 1000,
  firstWeekdayOffset: 2,
  months: [
    { id: "m1", name: "Prime", order: 2, days: 30 },
    { id: "m2", name: "Bloom", order: 1, days: 20 }
  ],
  weekdays: [
    { id: "d1", name: "One", order: 1 },
    { id: "d2", name: "Two", order: 2 },
    { id: "d3", name: "Three", order: 3 },
    { id: "d4", name: "Four", order: 4 },
    { id: "d5", name: "Five", order: 5 }
  ]
};

describe("dateEngine", () => {
  it("passes minute to hour", () => {
    expect(addMinutes({ absoluteDay: 0, hour: 10, minute: 50 }, 15)).toEqual({ absoluteDay: 0, hour: 11, minute: 5 });
  });

  it("passes hour to day", () => {
    expect(addHours({ absoluteDay: 4, hour: 23, minute: 10 }, 2)).toEqual({ absoluteDay: 5, hour: 1, minute: 10 });
  });
    it("passes month end to next month", () => {
    const endOfMonth = calendarDateToAbsoluteDay({ year: 1000, monthId: "m2", dayOfMonth: 20, hour: 23, minute: 59 }, system);
    const nextMinute = addMinutes(endOfMonth, 1);
    const display = absoluteDayToCalendarDate(nextMinute, system);
    expect(display.monthId).toBe("m1");
    expect(display.dayOfMonth).toBe(1);
  });

  it("passes year end to next year", () => {
    const yearEnd = calendarDateToAbsoluteDay({ year: 1000, monthId: "m1", dayOfMonth: 30, hour: 23, minute: 59 }, system);
    const next = addMinutes(yearEnd, 1);
    const display = absoluteDayToCalendarDate(next, system);
    expect(display.year).toBe(1001);
    expect(display.monthId).toBe("m2");
    expect(display.dayOfMonth).toBe(1);
  });

  it("supports negative time shift", () => {
    expect(addMinutes({ absoluteDay: 8, hour: 0, minute: 10 }, -15)).toEqual({ absoluteDay: 7, hour: 23, minute: 55 });
  });

  it("handles custom month sizes", () => {
    expect(getDaysInYear(system)).toBe(50);
    expect(getMonthById(system, "m1")?.days).toBe(30);
    expect(getMonthById(system, "m2")?.days).toBe(20);
  });

  it("uses firstWeekdayOffset", () => {
    const display = absoluteDayToCalendarDate({ absoluteDay: 0, hour: 12, minute: 0 }, system);
    expect(display.weekdayId).toBe("d3");
  });

  it("normalizes hour and minute in calendarDateToAbsoluteDay", () => {
    const internal = calendarDateToAbsoluteDay({ year: 1000, monthId: "m2", dayOfMonth: 1, hour: 24, minute: 61 }, system);
    expect(internal.hour).toBe(1);
    expect(internal.minute).toBe(1);
    expect(internal.absoluteDay).toBe(1);
  });

  it("rejects invalid imported json", () => {
    const current = createDefaultCalendarProject();
    const result = importCalendarProject('{"id":"x"}', current);
    expect(result.ok).toBe(false);
    expect(result.project).toEqual(current);
  });

  it("adds days", () => {
    expect(addDays({ absoluteDay: 4, hour: 1, minute: 2 }, 5)).toEqual({ absoluteDay: 9, hour: 1, minute: 2 });

  });
});
