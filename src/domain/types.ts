export type LocaleCode = "fr" | "en";

export type CalendarMonth = {
  id: string;
  name: string;
  shortName?: string;
  order: number;
  days: number;
};

export type CalendarWeekday = {
  id: string;
  name: string;
  shortName?: string;
  order: number;
};

export type CalendarSystem = {
  eraName: string;
  startYear: number;
  months: CalendarMonth[];
  weekdays: CalendarWeekday[];
};

export type InternalTime = {
  absoluteDay: number;
  hour: number;
  minute: number;
};

export type DisplayDate = {
  year: number;
  monthId: string;
  monthName: string;
  dayOfMonth: number;
  weekdayId?: string;
  weekdayName?: string;
  hour: number;
  minute: number;
};

export type TimePreset = {
  id:
    | "minus2h"
    | "minus1h"
    | "minus15m"
    | "minus5m"
    | "plus5m"
    | "plus15m"
    | "plus1h"
    | "plus2h"
    | "rest8h";
  deltaMinutes: number;
};

export const TIME_PRESETS: TimePreset[] = [
  { id: "minus2h", deltaMinutes: -120 },
  { id: "minus1h", deltaMinutes: -60 },
  { id: "minus15m", deltaMinutes: -15 },
  { id: "minus5m", deltaMinutes: -5 },
  { id: "plus5m", deltaMinutes: 5 },
  { id: "plus15m", deltaMinutes: 15 },
  { id: "plus1h", deltaMinutes: 60 },
  { id: "plus2h", deltaMinutes: 120 },
  { id: "rest8h", deltaMinutes: 480 }
];
