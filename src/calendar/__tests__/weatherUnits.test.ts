import { describe, expect, it } from "vitest";
import {
  celsiusDeltaToFahrenheitDelta,
  celsiusToFahrenheit,
  fahrenheitDeltaToCelsiusDelta,
  fahrenheitToCelsius,
  formatRain,
  formatTemperature,
  formatWindSpeed,
  getWeatherUnitLabels,
  inchToMm,
  kmhToMph,
  mmToInch,
  mphToKmh
} from "../weatherUnits";
import type { UnitsSettings } from "../../domain/types";

const metric: UnitsSettings = { temperature: "celsius", windSpeed: "kmh", rain: "mm" };
const imperial: UnitsSettings = { temperature: "fahrenheit", windSpeed: "mph", rain: "inch" };

describe("weatherUnits", () => {
  it("returns unit labels from unit settings", () => {
    expect(getWeatherUnitLabels(metric)).toEqual({ temperature: "°C", windSpeed: "km/h", rain: "mm/h", rainTotal: "mm" });
    expect(getWeatherUnitLabels(imperial)).toEqual({ temperature: "°F", windSpeed: "mph", rain: "in/h", rainTotal: "in" });
  });

  it("converts temperatures and temperature deltas", () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(20)).toBe(68);
    expect(fahrenheitToCelsius(68)).toBe(20);
    expect(celsiusDeltaToFahrenheitDelta(10)).toBe(18);
    expect(fahrenheitDeltaToCelsiusDelta(18)).toBe(10);
  });

  it("converts wind speed and rain", () => {
    expect(kmhToMph(100)).toBeCloseTo(62.14, 2);
    expect(mphToKmh(62.1371)).toBeCloseTo(100, 2);
    expect(mmToInch(25.4)).toBe(1);
    expect(inchToMm(1)).toBe(25.4);
  });

  it("formats metric and imperial weather values", () => {
    expect(formatTemperature(20, metric, "en")).toBe("20 °C");
    expect(formatTemperature(20, imperial, "en")).toBe("68 °F");
    expect(formatWindSpeed(50, metric, "en")).toBe("50 km/h");
    expect(formatWindSpeed(50, imperial, "en")).toBe("31 mph");
    expect(formatRain(25.4, metric, "en")).toBe("25.4 mm/h");
    expect(formatRain(25.4, imperial, "en")).toBe("1.00 in/h");
  });
});