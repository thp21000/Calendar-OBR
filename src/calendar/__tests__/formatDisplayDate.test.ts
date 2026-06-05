import { describe, expect, it } from "vitest";
import { formatDisplayDate } from "../formatDisplayDate";

describe("formatDisplayDate", () => {
  it("formats expected compact line", () => {
    const result = formatDisplayDate(
      { year: 4710, monthId: "m", monthName: "Pharast", dayOfMonth: 11, weekdayName: "Lundi", hour: 18, minute: 55 },
      "fr"
    );
    expect(result).toBe("Lundi 11 Pharast 4710, 18:55");
  });
  it("supports configured date and time formats", () => {
    const date = { year: 1000, monthId: "month-4", monthName: "Mois", dayOfMonth: 12, weekdayName: "Jour", hour: 14, minute: 30 };
    expect(formatDisplayDate(date, "fr", "dayMonthYear", "24h")).toBe("12 Mois 1000, 14:30");
    expect(formatDisplayDate(date, "fr", "dayMonthYearNumeric", "24h")).toBe("12/04/1000, 14:30");
    expect(formatDisplayDate(date, "en", "yearMonthDay", "12h")).toBe("1000-04-12, 2:30 PM");
    expect(formatDisplayDate(date, "en", "monthDayYear", "12h")).toBe("Mois 12, 1000, 2:30 PM");
  });
});
