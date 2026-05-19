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
});
