export type LocaleCode = "fr" | "en";

export type UnitsSettings = {
  temperature: "celsius";
  windSpeed: "kmh";
  rain: "mm";
};

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
  firstWeekdayOffset?: number;
  months: CalendarMonth[];
  weekdays: CalendarWeekday[];
};

export type InternalTime = {
  absoluteDay: number;
  hour: number;
  minute: number;
};

export type CalendarCurrentTime = InternalTime;

export type CalendarDate = {
  year: number;
  monthId: string;
  dayOfMonth: number;
  hour: number;
  minute: number;
};

export type DisplayDate = CalendarDate & {
  monthName: string;
  weekdayId?: string;
  weekdayName?: string;
};

export type CalendarEventVisibility = "gm" | "players" | "revealOnTrigger";
export type CalendarEventStatus = "active" | "triggered" | "archived" | "disabled";

export type CalendarEventRecurrence =
  | { type: "none" }
  | { type: "everyXDays"; interval: number }
  | { type: "everyXMonths"; interval: number }
  | { type: "yearly"; interval: number };

export type CalendarEvent = {
  id: string;
  name: string;
  icon?: string;
  date: CalendarDate;
  endDate?: CalendarDate;
  recurrence: CalendarEventRecurrence;
  summary: string;
  gmDescription?: string;
  playerDescription?: string;
  link?: string;
  visibility: CalendarEventVisibility;
  notifyOnTrigger: boolean;
  deleteAfterTrigger: boolean;
  archiveAfterTrigger: boolean;
  status: CalendarEventStatus;
  allDay?: boolean;
};

export type UiSettings = {
  activeTab: "today" | "month" | "events" | "settings" | "player";
  compactMode: boolean;
  monthGridStartsOnWeekdayId?: string;
  defaultMoonSystemInitialized?: boolean;
};

export type WeatherSettings = {
  seed?: string;
  forecastMode?: "wide" | "fine";
};

export type WindDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export type WeatherState = "clear" | "cloudy" | "overcast" | "fog" | "lightRain" | "heavyRain" | "storm" | "snow" | "strongWind" | "tempest";

export type WeatherSnapshot = {
  temperature: number;
  windSpeed: number;
  windDirection: WindDirection;
  rain: number;
  state?: WeatherState;
};

export type Season = {
  id: string;
  name: string;
  icon?: string;
  start: SeasonDate;
  end: SeasonDate;
  weatherProfile?: SeasonWeatherProfile;
};

export type SeasonDate = {
  monthId: string;
  dayOfMonth: number;
};

export type SeasonWeatherProfile = {
  temperature: { min: number; max: number; average: number };
  windSpeed: { min: number; max: number; average: number };
  rain: { min: number; max: number; average: number };
};

export type Moon = {
  id: string;
  name: string;
  icon?: string;
  cycleLengthDays: number;
  cycleOffsetDays?: number;
};

export type MoonPhaseId =
  | "new"
  | "waxingCrescent"
  | "firstQuarter"
  | "waxingGibbous"
  | "full"
  | "waningGibbous"
  | "lastQuarter"
  | "waningCrescent";

export type MoonPhase = {
  id: MoonPhaseId;
  icon: string;
  illumination: number;
};

export type WeatherConditionMetric = "temperature" | "windSpeed" | "rain";
export type WeatherConditionOperator = "gte" | "lte";

export type WeatherCondition = {
  metric: WeatherConditionMetric;
  operator: WeatherConditionOperator;
  value: number;
};

export type WeatherEvent = {
  id: string;
  name: string;
  icon?: string;
  summary?: string;
  link?: string;
  conditions: WeatherCondition[];
  requireAllConditions: boolean;
  enabled: boolean;
};


export type CalendarProject = {
  schemaVersion: number;
  appVersion: string;
  id: string;
  name: string;
  locale: LocaleCode;
  units: UnitsSettings;
  currentTime: CalendarCurrentTime;
  calendarSystem: CalendarSystem;
  events: CalendarEvent[];
  seasons: Season[];
  moons: Moon[];
  weatherSettings: WeatherSettings;
  weatherEvents: WeatherEvent[];
  uiSettings: UiSettings;
};

export type CalendarPack = {
  schemaVersion: number;
  packId: string;
  packVersion: string;
  name: string;
  description?: string;
  author?: string;
  locale: LocaleCode;
  project: CalendarProject;
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
