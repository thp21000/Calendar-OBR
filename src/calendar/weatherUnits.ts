import type { LocaleCode } from "../domain/types";

export const getWeatherUnitLabels = (locale: LocaleCode): { temperature: string; windSpeed: string; rain: string; rainTotal: string } =>
  locale === "fr"
    ? { temperature: "°C", windSpeed: "km/h", rain: "mm/h", rainTotal: "mm" }
    : { temperature: "°F", windSpeed: "mi/h", rain: "in/h", rainTotal: "in" };