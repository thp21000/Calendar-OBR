import type { LocaleCode } from "../domain/types";

export const getWeatherUnitLabels = (locale: LocaleCode): { temperature: string; windSpeed: string; rain: string } =>
  locale === "fr"
    ? { temperature: "°C", windSpeed: "km/h", rain: "mm/h" }
    : { temperature: "°F", windSpeed: "mi/h", rain: "in/h" };

