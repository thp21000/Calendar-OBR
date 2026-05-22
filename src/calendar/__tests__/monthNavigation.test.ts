import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { absoluteDayToCalendarDate } from "../dateEngine";
import { getAdjacentMonthLabels, getMonthViewTimeForDate, getNextMonthViewTime, getPreviousMonthViewTime } from "../monthNavigation";

describe("monthNavigation", () => {
  it("next/previous in same year", () => {
    const p = createDefaultCalendarProject();
    const months = [...p.calendarSystem.months].sort((a, b) => a.order - b.order);
    const centerIndex = months.length >= 3 ? 1 : 0;
    const viewed = getMonthViewTimeForDate(p, { year: 1000, monthId: months[centerIndex].id, dayOfMonth: 12, hour: 8, minute: 10 });
    const prev = absoluteDayToCalendarDate(getPreviousMonthViewTime(p, viewed), p.calendarSystem);
    const next = absoluteDayToCalendarDate(getNextMonthViewTime(p, viewed), p.calendarSystem);
    expect(prev.monthId).toBe(months[(centerIndex - 1 + months.length) % months.length].id);
    expect(next.monthId).toBe(months[(centerIndex + 1) % months.length].id);
  });

  it("year rollover prev/next", () => {
    const p = createDefaultCalendarProject();
    const months = [...p.calendarSystem.months].sort((a, b) => a.order - b.order);
    const first = getMonthViewTimeForDate(p, { year: 1000, monthId: months[0].id, dayOfMonth: 1, hour: 0, minute: 0 });
    const lastPrev = absoluteDayToCalendarDate(getPreviousMonthViewTime(p, first), p.calendarSystem);
    expect(lastPrev.year).toBe(999);
    expect(lastPrev.monthId).toBe(months[months.length - 1].id);

    const last = getMonthViewTimeForDate(p, { year: 1000, monthId: months[months.length - 1].id, dayOfMonth: 1, hour: 0, minute: 0 });
    const firstNext = absoluteDayToCalendarDate(getNextMonthViewTime(p, last), p.calendarSystem);
    expect(firstNext.year).toBe(1001);
    expect(firstNext.monthId).toBe(months[0].id);
  });

  it("handles custom month order and labels", () => {
    const p = createDefaultCalendarProject();
    p.calendarSystem.months = [
      { id: "mA", name: "A", shortName: "A", order: 2, days: 30 },
      { id: "mB", name: "B", shortName: "B", order: 1, days: 30 },
      { id: "mC", name: "C", shortName: "C", order: 3, days: 30 }
    ];
    const viewed = getMonthViewTimeForDate(p, { year: 1000, monthId: "mA", dayOfMonth: 20, hour: 10, minute: 10 });
    const labels = getAdjacentMonthLabels(p, viewed);
    expect(labels.previous).toContain("B");
    expect(labels.current).toContain("A");
    expect(labels.next).toContain("C");
  });
});
