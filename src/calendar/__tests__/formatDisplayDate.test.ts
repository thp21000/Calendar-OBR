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
    const date = { year: 1000, monthId: "springmoon", monthName: "Mois", monthNumber: 4, dayOfMonth: 12, weekdayName: "Jour", hour: 14, minute: 30 };
    expect(formatDisplayDate(date, "fr", "dayMonthYear", "24h")).toBe("12 Mois 1000, 14:30");
    expect(formatDisplayDate(date, "fr", "dayMonthYearNumeric", "24h")).toBe("12/04/1000, 14:30");
    expect(formatDisplayDate(date, "en", "yearMonthDay", "12h")).toBe("1000-04-12, 2:30 PM");
    expect(formatDisplayDate(date, "en", "monthDayYear", "12h")).toBe("Mois 12, 1000, 2:30 PM");
  });

  it("uses monthNumber instead of parsing numeric month ids", () => {
    const date = { year: 1000, monthId: "pharast", monthName: "Pharast", monthNumber: 3, dayOfMonth: 11, weekdayName: "Lundi", hour: 18, minute: 55 };
    expect(formatDisplayDate(date, "fr", "dayMonthYearNumeric", "24h")).toBe("11/03/1000, 18:55");
    expect(formatDisplayDate(date, "fr", "yearMonthDay", "24h")).toBe("1000-03-11, 18:55");
  });

  it("falls back without crashing when a numeric format has no monthNumber", () => {
    const date = { year: 1000, monthId: "pharast", monthName: "Pharast", dayOfMonth: 11, weekdayName: "Lundi", hour: 18, minute: 55 };
    expect(formatDisplayDate(date, "fr", "dayMonthYearNumeric", "24h")).toBe("11/Pharast/1000, 18:55");
  });
});