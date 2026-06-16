import type { WeatherBiomeId, WeatherBiomeProfile, WeatherBiomeState } from "../calendar/weather/biomes/types";
import type { SeasonWeatherModifier } from "../calendar/weather/seasonModifiers/types";

export type LocaleCode = "fr" | "en";

export type TemperatureUnit = "celsius" | "fahrenheit";
export type WindSpeedUnit = "kmh" | "mph";
export type RainUnit = "mm" | "inch";

export type UnitsSettings = {
  temperature: TemperatureUnit;
  windSpeed: WindSpeedUnit;
  rain: RainUnit;
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
  monthNumber?: number;
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

export type AdventureContextCategory = "location" | "activity" | "kingmaker";

export type AdventureContextDefinition = {
  id: string;
  label: Record<LocaleCode, string>;
  description?: Record<LocaleCode, string>;
  icon: string;
  category: AdventureContextCategory;
  enabled: boolean;
};

export type AdventureContextState = {
  primaryContextId: string | null;
  secondaryContextIds: string[];
  availableContexts: AdventureContextDefinition[];
};

export type AdventureContextCondition = {
  type: "adventureContext";
  mode: "any" | "all" | "none";
  contextIds: string[];
  includePrimary?: boolean;
  includeSecondary?: boolean;
};

export type EventCondition = AdventureContextCondition;

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
  reminderEnabled?: boolean;
  reminderMinutesBefore?: number;
  conditions?: EventCondition[];
};

export type DateFormatPreference = "weekdayDayMonthYear" | "dayMonthYear" | "dayMonthYearNumeric" | "yearMonthDay" | "monthDayYear";
export type TimeFormatPreference = "24h" | "12h";

export type PlayerWeatherDetailLevel = "precise" | "broad" | "narrative";
export type PlayerForecastDetailLevel = "precise" | "broad" | "narrative";
export type PlayerViewTab = "today" | "month";

export type PlayerViewSettings = {
  enabledTabs: {
    today: boolean;
    month: boolean;
  };
  defaultTab: PlayerViewTab;
  today: {
    showHeader: boolean;
    showDate: boolean;
    showSeason: boolean;
    showWeather: boolean;
    showBiome: boolean;
    showMoons: boolean;
    showEvents: boolean;
    showWeatherEvents: boolean;
    showMoonEvents: boolean;
    showDayNotes: boolean;
    showHourlyForecast: boolean;
    weatherDetailLevel: PlayerWeatherDetailLevel;
    forecastDetailLevel: PlayerForecastDetailLevel;
  };
  month: {
    showMonthGrid: boolean;
    showPublicEvents: boolean;
    showWeatherEvents: boolean;
    showMoonEvents: boolean;
    showDayNotes: boolean;
    showWeatherSummary: boolean;
    showFiveDayForecast: boolean;
    weatherDetailLevel: PlayerWeatherDetailLevel;
    forecastDetailLevel: PlayerForecastDetailLevel;
  };
};

export type UiSettings = {
  activeTab: "today" | "month" | "events" | "settings" | "player";
  compactMode: boolean;
  monthGridStartsOnWeekdayId?: string;
  dateFormat?: DateFormatPreference;
  timeFormat?: TimeFormatPreference;
  defaultMoonSystemInitialized?: boolean;
  playerView?: PlayerViewSettings;
};

export type WeatherSettings = {
  seed?: string;
  forecastMode?: "wide" | "fine";
};

export type WindDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export type WeatherTrendKind = "cold" | "warm" | "wet" | "dry" | "windy" | "calm" | "stormy" | "stable" | "unstable";

export type WeatherState = "clear" | "cloudy" | "overcast" | "fog" | "lightRain" | "heavyRain" | "storm" | "snow" | "strongWind" | "tempest" | "blizzard" | "sandstorm" | "monsoon" | "seaFog" | "volcanicAsh";

export type WeatherAdvancedThresholds = {
  minTemperature?: number;
  maxTemperature?: number;
  minWindSpeed?: number;
  maxWindSpeed?: number;
  minRain?: number;
  maxRain?: number;
  minDailyRainTotal?: number;
  maxDailyRainTotal?: number;
  minPrecipitationChance?: number;
  maxPrecipitationChance?: number;
  minStormChance?: number;
  maxStormChance?: number;
  minFogChance?: number;
  maxFogChance?: number;
};

export type WeatherStateConfig = {
  id: string;
  enabled: boolean;
  custom?: boolean;
  label?: Partial<Record<LocaleCode, string>>;
  icon?: string;
  description?: Partial<Record<LocaleCode, string>>;
  priority?: number;
  thresholds?: WeatherAdvancedThresholds;
  biomeTags?: WeatherBiomeId[];
};

export type WeatherTrendConfig = {
  id: WeatherTrendKind | string;
  enabled: boolean;
  label?: Partial<Record<LocaleCode, string>>;
  icon?: string;
  temperatureOffset?: number;
  rainMultiplier?: number;
  windMultiplier?: number;
  stabilityModifier?: number;
  stormChanceModifier?: number;
};

export type WeatherDominanceConfig = {
  id: string;
  enabled: boolean;
  custom?: boolean;
  stateId: string;
  priority?: number;
  thresholds?: WeatherAdvancedThresholds;
};

export type WeatherAdvancedSettings = {
  stateConfigs?: Record<string, Partial<WeatherStateConfig>>;
  trendConfigs?: Record<string, Partial<WeatherTrendConfig>>;
  dominanceConfigs?: Record<string, Partial<WeatherDominanceConfig>>;
};

export type WeatherSnapshot = {
  temperature: number;
  windSpeed: number;
  windDirection: WindDirection;
  rain: number;
  state?: WeatherState;
  dailyMinTemperature?: number;
  dailyMaxTemperature?: number;
  dailyRainTotal?: number;
  dominantState?: WeatherState;
  trendKind?: WeatherTrendKind;
};

export type Season = {
  id: string;
  name: string;
  icon?: string;
  start: SeasonDate;
  end: SeasonDate;
  /** Legacy absolute season climate profile kept for old saves and current settings UI. */
  weatherProfile?: SeasonWeatherProfile;
  weatherModifier?: SeasonWeatherModifier;
};

export type SeasonDate = {
  monthId: string;
  dayOfMonth: number;
};

export type SeasonWeatherProfile = {
  temperature: { min: number; max: number; average: number };
  windSpeed: { min: number; max: number; average: number };
  rain: { min: number; max: number; average: number };
  stability?: number;
  precipitationChance?: number;
  stormChance?: number;
  fogChance?: number;
  temperatureSwing?: number;
  windVariability?: number;
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

export type WeatherOverride = {
  id: string;
  absoluteDay: number;
  startMinuteOfDay?: number;
  endMinuteOfDay?: number;
  label?: string;
  temperature?: number;
  dailyMinTemperature?: number;
  dailyMaxTemperature?: number;
  rain?: number;
  dailyRainTotal?: number;
  windSpeed?: number;
  windDirection?: WindDirection;
  state?: WeatherState;
  dominantState?: WeatherState;
  trendKind?: WeatherTrendKind;
  gmNote?: string;
  source?: "manual" | "weatherEvent" | "sceneWeather";
  sourceId?: string;
  sceneId?: string;
  sceneName?: string;
  transitionStartAtMinutes?: number;
  transitionDurationMinutes?: number;
  transitionFrom?: {
    temperature?: number;
    dailyMinTemperature?: number;
    dailyMaxTemperature?: number;
    rain?: number;
    dailyRainTotal?: number;
    windSpeed?: number;
  };
};

export type SceneWeatherProfile = {
  id: string;
  name: string;
  icon?: string;
  enabled: boolean;
  durationMinutes?: number;
  transitionMinutes?: number;
  forceBiomeId?: WeatherBiomeId;
  override: {
    temperature?: number;
    dailyMinTemperature?: number;
    dailyMaxTemperature?: number;
    rain?: number;
    dailyRainTotal?: number;
    windSpeed?: number;
    windDirection?: WindDirection;
    state?: WeatherState;
    dominantState?: WeatherState;
    trendKind?: WeatherTrendKind;
    gmNote?: string;
  };
};

export type SceneWeatherSceneState = {
  profileId?: string;
  profileName?: string;
  profileIcon?: string;
  isActive?: boolean;
  lastAppliedAtMinutes?: number;
  lastPromptedAtMinutes?: number;
};

export type WeatherConditionMetric = "temperature" | "windSpeed" | "rain" | "dailyMinTemperature" | "dailyMaxTemperature" | "dailyRainTotal";
export type WeatherConditionOperator = "gte" | "lte";

export type WeatherMetricCondition = {
  type?: "metric";
  metric: WeatherConditionMetric;
  operator: WeatherConditionOperator;
  value: number;
};

export type WeatherStateCondition = {
  type: "state";
  state: WeatherState;
};

export type WeatherSeasonCondition = {
  type: "season";
  seasonId: string;
};

export type WeatherTimeOfDayCondition = {
  type: "timeOfDay";
  startHour: number;
  endHour: number;
};

export type WeatherMoonPhaseCondition = {
  type: "moonPhase";
  moonId: string;
  phaseId: MoonPhaseId;
};

export type WeatherDominantStateCondition = {
  type: "dominantState";
  state: WeatherState;
};

export type WeatherWindDirectionCondition = {
  type: "windDirection";
  direction: WindDirection;
};

export type WeatherBiomeCondition = {
  type: "biome";
  biomeIds?: WeatherBiomeId[];
};

export type WeatherCondition = WeatherMetricCondition | WeatherStateCondition | WeatherDominantStateCondition | WeatherWindDirectionCondition | WeatherSeasonCondition | WeatherTimeOfDayCondition | WeatherMoonPhaseCondition | WeatherBiomeCondition | AdventureContextCondition;

export type WeatherEventTriggerHistoryEntry = {
  id: string;
  triggeredAtMinutes: number;
  weatherState?: WeatherState;
  dominantState?: WeatherState;
  trendKind?: WeatherTrendKind;
  temperature?: number;
  rain?: number;
  windSpeed?: number;
};

export type WeatherEventKind = "informational" | "weatherEffect";
export type WeatherEventEffect = {
  temperature?: number;
  dailyMinTemperature?: number;
  dailyMaxTemperature?: number;
  rain?: number;
  dailyRainTotal?: number;
  windSpeed?: number;
  windDirection?: WindDirection;
  state?: WeatherState;
  dominantState?: WeatherState;
  trendKind?: WeatherTrendKind;
};

export type WeatherEvent = {
  id: string;
  name: string;
  icon?: string;
  summary?: string;
  link?: string;
  gmDescription?: string;
  playerDescription?: string;
  visibility?: "gm" | "players" | "revealOnTrigger";
  notifyOnTrigger?: boolean;
  status?: "active" | "triggered" | "archived" | "disabled";
  lastTriggeredAtMinutes?: number;
  activeStartedAtMinutes?: number;
  lastEndedAtMinutes?: number;
  archiveAfterTrigger?: boolean;
  disableAfterTrigger?: boolean;
  triggerHistory?: WeatherEventTriggerHistoryEntry[];
  kind?: WeatherEventKind;
  triggerChancePercent?: number;
  effect?: WeatherEventEffect;
  conditions: WeatherCondition[];
  requireAllConditions: boolean;
  enabled: boolean;
  durationHours?: number;
  cooldownHours?: number;
};

export type MoonEvent = {
  id: string;
  name: string;
  icon?: string;
  summary: string;
  gmDescription?: string;
  playerDescription?: string;
  moonId: string;
  phaseId: MoonPhaseId;
  visibility: "gm" | "players" | "revealOnTrigger";
  enabled: boolean;
  notifyOnTrigger: boolean;
  status: "active" | "triggered" | "archived" | "disabled";
  conditions?: MoonEventExtraConditions;
  repeatMode?: MoonEventRepeatMode;
  lastTriggeredAbsoluteDay?: number;
};

export type MoonEventRepeatMode = "once" | "everyOccurrence" | "everyOtherOccurrence";

export type MoonEventExtraConditions = {
  seasonIds?: string[];
  monthIds?: string[];
};

export type DayNote = {
  id: string;
  date: CalendarDate;
  gmNote?: string;
  playerNote?: string;
  visibility: "gm" | "players";
  updatedAt: number;
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
  moonEvents?: MoonEvent[];
  dayNotes?: DayNote[];
  weatherSettings: WeatherSettings;
  weatherAdvancedSettings?: WeatherAdvancedSettings;
  weatherEvents: WeatherEvent[];
  weatherOverrides?: WeatherOverride[];
  weatherBiome?: WeatherBiomeState;
  weatherBiomeProfiles?: Partial<Record<WeatherBiomeId, WeatherBiomeProfile>>;
  sceneWeatherProfiles?: SceneWeatherProfile[];
  adventureContext?: AdventureContextState;
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
