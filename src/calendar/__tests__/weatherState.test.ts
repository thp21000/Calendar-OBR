import { describe, expect, it } from "vitest";
import { getWeatherState } from "../weatherState";

describe("weatherState", () => {
  it("classifies light rain", () => {
    expect(getWeatherState({ temperature: 10, windSpeed: 10, rain: 2 })).toBe("lightRain");
  });
  it("classifies heavy rain", () => {
    expect(getWeatherState({ temperature: 10, windSpeed: 15, rain: 7 })).toBe("heavyRain");
  });
  it("classifies snow", () => {
    expect(getWeatherState({ temperature: 0, windSpeed: 10, rain: 3 })).toBe("snow");
  });
  it("classifies strong wind", () => {
    expect(getWeatherState({ temperature: 18, windSpeed: 50, rain: 0 })).toBe("strongWind");
  });
  it("classifies tempest", () => {
    expect(getWeatherState({ temperature: 12, windSpeed: 75, rain: 13 })).toBe("tempest");
  });
  it("classifies clear/cloudy baseline", () => {
    expect(getWeatherState({ temperature: 18, windSpeed: 4, rain: 0 })).toBe("clear");
    expect(getWeatherState({ temperature: 18, windSpeed: 12, rain: 0 })).toBe("cloudy");
  });
});
