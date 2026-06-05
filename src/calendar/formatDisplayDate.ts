import type { DateFormatPreference, DisplayDate, LocaleCode, TimeFormatPreference } from "../domain/types";

const pad2 = (value: number): string => String(value).padStart(2, "0");

const formatTime = (hour: number, minute: number, format: TimeFormatPreference = "24h"): string => {
  if (format === "12h") {
    const suffix = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${pad2(minute)} ${suffix}`;
  }
  return `${pad2(hour)}:${pad2(minute)}`;
};

const formatDateOnly = (displayDate: DisplayDate, locale: LocaleCode, format: DateFormatPreference = "weekdayDayMonthYear"): string => {
  const dayName = displayDate.weekdayName ?? (locale === "fr" ? "Jour" : "Day");
  const monthName = displayDate.monthName;
  const monthNumber = Number(displayDate.monthId.match(/\d+/)?.[0] ?? 0);
  const numericMonth = monthNumber > 0 ? pad2(monthNumber) : monthName;
  if (format === "dayMonthYear") return `${displayDate.dayOfMonth} ${monthName} ${displayDate.year}`;
  if (format === "dayMonthYearNumeric") return `${pad2(displayDate.dayOfMonth)}/${numericMonth}/${displayDate.year}`;
  if (format === "yearMonthDay") return `${displayDate.year}-${numericMonth}-${pad2(displayDate.dayOfMonth)}`;
  if (format === "monthDayYear") return `${monthName} ${displayDate.dayOfMonth}, ${displayDate.year}`;
  return `${dayName} ${displayDate.dayOfMonth} ${monthName} ${displayDate.year}`;
};

export const formatDisplayDate = (
  displayDate: DisplayDate,
  locale: LocaleCode,
  dateFormat?: DateFormatPreference,
  timeFormat?: TimeFormatPreference
): string => `${formatDateOnly(displayDate, locale, dateFormat)}, ${formatTime(displayDate.hour, displayDate.minute, timeFormat)}`;