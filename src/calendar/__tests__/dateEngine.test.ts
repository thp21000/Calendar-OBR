import { describe, expect, it } from "vitest";
import { shiftMinutes, toDisplayDate, toInternalTime } from "../dateEngine";
import type { CalendarSystem } from "../../domain/types";

const system: CalendarSystem = {
  eraName: "AR",
  startYear: 1000,
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

describe("dateEngine", () => {
  it("converts absolute day to display date", () => {
    const display = toDisplayDate({ absoluteDay: 35, hour: 14, minute: 30 }, system);

    expect(display.year).toBe(1000);
    expect(display.monthId).toBe("m2");
    expect(display.dayOfMonth).toBe(6);
    expect(display.weekdayId).toBe("d1");
  });

  it("converts display date to internal date", () => {
    const internal = toInternalTime(1001, "m2", 10, 3, 15, system);
    expect(internal.absoluteDay).toBe(89);
    expect(internal.hour).toBe(3);
    expect(internal.minute).toBe(15);
  });

  it("shifts time across day boundaries", () => {
    const shifted = shiftMinutes({ absoluteDay: 8, hour: 0, minute: 10 }, -15);
    expect(shifted.absoluteDay).toBe(7);
    expect(shifted.hour).toBe(23);
    expect(shifted.minute).toBe(55);
  });
});
