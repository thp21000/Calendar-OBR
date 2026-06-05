import type { LocaleCode, RainUnit, TemperatureUnit, UnitsSettings, WindSpeedUnit } from "../domain/types";

export const DEFAULT_UNITS: UnitsSettings = { temperature: "celsius", windSpeed: "kmh", rain: "mm" };
export const METRIC_UNITS: UnitsSettings = { ...DEFAULT_UNITS };
export const IMPERIAL_UNITS: UnitsSettings = { temperature: "fahrenheit", windSpeed: "mph", rain: "inch" };

export const celsiusToFahrenheit = (value: number): number => value * 9 / 5 + 32;
export const fahrenheitToCelsius = (value: number): number => (value - 32) * 5 / 9;
export const celsiusDeltaToFahrenheitDelta = (value: number): number => value * 9 / 5;
export const fahrenheitDeltaToCelsiusDelta = (value: number): number => value * 5 / 9;
export const kmhToMph = (value: number): number => value * 0.621371;
export const mphToKmh = (value: number): number => value / 0.621371;
export const mmToInch = (value: number): number => value / 25.4;
export const inchToMm = (value: number): number => value * 25.4;

export const toDisplayTemperature = (valueCelsius: number, unit: TemperatureUnit): number => unit === "fahrenheit" ? celsiusToFahrenheit(valueCelsius) : valueCelsius;
export const fromDisplayTemperature = (displayValue: number, unit: TemperatureUnit): number => unit === "fahrenheit" ? fahrenheitToCelsius(displayValue) : displayValue;
export const toDisplayTemperatureDelta = (valueCelsiusDelta: number, unit: TemperatureUnit): number => unit === "fahrenheit" ? celsiusDeltaToFahrenheitDelta(valueCelsiusDelta) : valueCelsiusDelta;
export const fromDisplayTemperatureDelta = (displayDelta: number, unit: TemperatureUnit): number => unit === "fahrenheit" ? fahrenheitDeltaToCelsiusDelta(displayDelta) : displayDelta;
export const toDisplayWindSpeed = (valueKmh: number, unit: WindSpeedUnit): number => unit === "mph" ? kmhToMph(valueKmh) : valueKmh;
export const fromDisplayWindSpeed = (displayValue: number, unit: WindSpeedUnit): number => unit === "mph" ? mphToKmh(displayValue) : displayValue;
export const toDisplayRain = (valueMm: number, unit: RainUnit): number => unit === "inch" ? mmToInch(valueMm) : valueMm;
export const fromDisplayRain = (displayValue: number, unit: RainUnit): number => unit === "inch" ? inchToMm(displayValue) : displayValue;

const roundTo = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const formatNumber = (value: number, locale: LocaleCode, decimals: number): string =>
  new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);

export const getWeatherUnitLabels = (units: UnitsSettings): { temperature: string; windSpeed: string; rain: string; rainTotal: string } => ({
  temperature: units.temperature === "fahrenheit" ? "°F" : "°C",
  windSpeed: units.windSpeed === "mph" ? "mph" : "km/h",
  rain: units.rain === "inch" ? "in/h" : "mm/h",
  rainTotal: units.rain === "inch" ? "in" : "mm"
});

export const formatTemperature = (valueCelsius: number, units: UnitsSettings, locale: LocaleCode): string => {
  const display = toDisplayTemperature(valueCelsius, units.temperature);
  return `${formatNumber(roundTo(display, 0), locale, 0)} ${getWeatherUnitLabels(units).temperature}`;
};

export const formatTemperatureDelta = (valueCelsiusDelta: number, units: UnitsSettings, locale: LocaleCode): string => {
  const display = toDisplayTemperatureDelta(valueCelsiusDelta, units.temperature);
  return `${formatNumber(roundTo(display, 1), locale, Number.isInteger(roundTo(display, 1)) ? 0 : 1)} ${getWeatherUnitLabels(units).temperature}`;
};

export const formatWindSpeed = (valueKmh: number, units: UnitsSettings, locale: LocaleCode): string => {
  const display = toDisplayWindSpeed(valueKmh, units.windSpeed);
  return `${formatNumber(roundTo(display, 0), locale, 0)} ${getWeatherUnitLabels(units).windSpeed}`;
};

export const formatRain = (valueMm: number, units: UnitsSettings, locale: LocaleCode): string => {
  const display = toDisplayRain(valueMm, units.rain);
  const decimals = units.rain === "inch" ? 2 : 1;
  return `${formatNumber(roundTo(display, decimals), locale, decimals)} ${getWeatherUnitLabels(units).rain}`;
};

export const formatRainTotal = (valueMm: number, units: UnitsSettings, locale: LocaleCode): string => {
  const display = toDisplayRain(valueMm, units.rain);
  const decimals = units.rain === "inch" ? 2 : 1;
  return `${formatNumber(roundTo(display, decimals), locale, decimals)} ${getWeatherUnitLabels(units).rainTotal}`;
};