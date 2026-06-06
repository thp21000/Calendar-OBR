import type { PlayerForecastDetailLevel, PlayerViewSettings, PlayerViewTab, PlayerWeatherDetailLevel } from "../domain/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isDetailLevel = (value: unknown): value is PlayerWeatherDetailLevel & PlayerForecastDetailLevel =>
  value === "precise" || value === "broad" || value === "narrative";

const isPlayerViewTab = (value: unknown): value is PlayerViewTab => value === "today" || value === "month";

const boolValue = (source: Record<string, unknown>, key: string, fallback: boolean): boolean =>
  typeof source[key] === "boolean" ? source[key] as boolean : fallback;

export const DEFAULT_PLAYER_VIEW_SETTINGS: PlayerViewSettings = {
  enabledTabs: {
    today: true,
    month: true
  },
  defaultTab: "today",
  today: {
    showHeader: true,
    showDate: true,
    showSeason: true,
    showWeather: true,
    showBiome: true,
    showMoons: true,
    showEvents: true,
    showWeatherEvents: true,
    showMoonEvents: true,
    showDayNotes: true,
    showHourlyForecast: false,
    weatherDetailLevel: "precise",
    forecastDetailLevel: "broad"
  },
  month: {
    showMonthGrid: true,
    showPublicEvents: true,
    showWeatherEvents: true,
    showMoonEvents: true,
    showDayNotes: true,
    showWeatherSummary: true,
    showFiveDayForecast: false,
    weatherDetailLevel: "broad",
    forecastDetailLevel: "broad"
  }
};

export const normalizePlayerViewSettings = (settings?: unknown): PlayerViewSettings => {
  const source = isRecord(settings) ? settings : {};
  const enabledSource = isRecord(source.enabledTabs) ? source.enabledTabs : {};
  const todayEnabled = typeof enabledSource.today === "boolean" ? enabledSource.today : DEFAULT_PLAYER_VIEW_SETTINGS.enabledTabs.today;
  const monthEnabled = typeof enabledSource.month === "boolean" ? enabledSource.month : DEFAULT_PLAYER_VIEW_SETTINGS.enabledTabs.month;
  const enabledTabs = todayEnabled || monthEnabled
    ? { today: todayEnabled, month: monthEnabled }
    : { today: true, month: false };
  const sourceDefaultTab = isPlayerViewTab(source.defaultTab) ? source.defaultTab : DEFAULT_PLAYER_VIEW_SETTINGS.defaultTab;
  const defaultTab = enabledTabs[sourceDefaultTab] ? sourceDefaultTab : enabledTabs.today ? "today" : "month";

  const todaySource = isRecord(source.today) ? source.today : {};
  const monthSource = isRecord(source.month) ? source.month : {};

  return {
    enabledTabs,
    defaultTab,
    today: {
      showHeader: boolValue(todaySource, "showHeader", DEFAULT_PLAYER_VIEW_SETTINGS.today.showHeader),
      showDate: boolValue(todaySource, "showDate", DEFAULT_PLAYER_VIEW_SETTINGS.today.showDate),
      showSeason: boolValue(todaySource, "showSeason", DEFAULT_PLAYER_VIEW_SETTINGS.today.showSeason),
      showWeather: boolValue(todaySource, "showWeather", DEFAULT_PLAYER_VIEW_SETTINGS.today.showWeather),
      showBiome: boolValue(todaySource, "showBiome", DEFAULT_PLAYER_VIEW_SETTINGS.today.showBiome),
      showMoons: boolValue(todaySource, "showMoons", DEFAULT_PLAYER_VIEW_SETTINGS.today.showMoons),
      showEvents: boolValue(todaySource, "showEvents", DEFAULT_PLAYER_VIEW_SETTINGS.today.showEvents),
      showWeatherEvents: boolValue(todaySource, "showWeatherEvents", DEFAULT_PLAYER_VIEW_SETTINGS.today.showWeatherEvents),
      showMoonEvents: boolValue(todaySource, "showMoonEvents", DEFAULT_PLAYER_VIEW_SETTINGS.today.showMoonEvents),
      showDayNotes: boolValue(todaySource, "showDayNotes", DEFAULT_PLAYER_VIEW_SETTINGS.today.showDayNotes),
      showHourlyForecast: boolValue(todaySource, "showHourlyForecast", DEFAULT_PLAYER_VIEW_SETTINGS.today.showHourlyForecast),
      weatherDetailLevel: isDetailLevel(todaySource.weatherDetailLevel) ? todaySource.weatherDetailLevel : DEFAULT_PLAYER_VIEW_SETTINGS.today.weatherDetailLevel,
      forecastDetailLevel: isDetailLevel(todaySource.forecastDetailLevel) ? todaySource.forecastDetailLevel : DEFAULT_PLAYER_VIEW_SETTINGS.today.forecastDetailLevel
    },
    month: {
      showMonthGrid: boolValue(monthSource, "showMonthGrid", DEFAULT_PLAYER_VIEW_SETTINGS.month.showMonthGrid),
      showPublicEvents: boolValue(monthSource, "showPublicEvents", DEFAULT_PLAYER_VIEW_SETTINGS.month.showPublicEvents),
      showWeatherEvents: boolValue(monthSource, "showWeatherEvents", DEFAULT_PLAYER_VIEW_SETTINGS.month.showWeatherEvents),
      showMoonEvents: boolValue(monthSource, "showMoonEvents", DEFAULT_PLAYER_VIEW_SETTINGS.month.showMoonEvents),
      showDayNotes: boolValue(monthSource, "showDayNotes", DEFAULT_PLAYER_VIEW_SETTINGS.month.showDayNotes),
      showWeatherSummary: boolValue(monthSource, "showWeatherSummary", DEFAULT_PLAYER_VIEW_SETTINGS.month.showWeatherSummary),
      showFiveDayForecast: boolValue(monthSource, "showFiveDayForecast", DEFAULT_PLAYER_VIEW_SETTINGS.month.showFiveDayForecast),
      weatherDetailLevel: isDetailLevel(monthSource.weatherDetailLevel) ? monthSource.weatherDetailLevel : DEFAULT_PLAYER_VIEW_SETTINGS.month.weatherDetailLevel,
      forecastDetailLevel: isDetailLevel(monthSource.forecastDetailLevel) ? monthSource.forecastDetailLevel : DEFAULT_PLAYER_VIEW_SETTINGS.month.forecastDetailLevel
    }
  };
};
