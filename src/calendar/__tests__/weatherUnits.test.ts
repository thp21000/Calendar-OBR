import { describe, expect, it } from "vitest";
import { getWeatherUnitLabels } from "../weatherUnits";

describe("weatherUnits", () => {
  it("locale fr retourne °C, km/h, mm/h et mm pour le cumul", () => {
    expect(getWeatherUnitLabels("fr")).toEqual({ temperature: "°C", windSpeed: "km/h", rain: "mm/h", rainTotal: "mm" });
  });

  it("locale en retourne °F, mi/h, in/h et in pour le cumul", () => {
    expect(getWeatherUnitLabels("en")).toEqual({ temperature: "°F", windSpeed: "mi/h", rain: "in/h", rainTotal: "in" });
  });
});