import type { DisplayDate, LocaleCode } from "../domain/types";

export const formatDisplayDate = (displayDate: DisplayDate, locale: LocaleCode): string => {
  const dayName = displayDate.weekdayName ?? (locale === "fr" ? "Jour" : "Day");
  const time = `${String(displayDate.hour).padStart(2, "0")}:${String(displayDate.minute).padStart(2, "0")}`;
  return `${dayName} ${displayDate.dayOfMonth} ${displayDate.monthName} ${displayDate.year}, ${time}`;
};
