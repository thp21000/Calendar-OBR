import { describe, expect, it } from "vitest";
import { getWeatherUnitLabels } from "../weatherUnits";

describe("weatherUnits", () => {
  it("locale fr retourne °C, km/h, mm/h", () => {
    expect(getWeatherUnitLabels("fr")).toEqual({ temperature: "°C", windSpeed: "km/h", rain: "mm/h" });
  });

  it("locale en retourne °F, mi/h, in/h", () => {
    expect(getWeatherUnitLabels("en")).toEqual({ temperature: "°F", windSpeed: "mi/h", rain: "in/h" });
  });
});

