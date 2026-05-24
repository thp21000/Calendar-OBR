import { describe, expect, it } from "vitest";
import { getHourlyWeatherState, getWeatherState } from "../weatherState";

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

  it("pluie forte actuelle reste prioritaire même si dominant clear", () => {
    expect(getHourlyWeatherState({ temperature: 12, windSpeed: 12, rain: 8, dominantState: "clear", dailyRainTotal: 0, hour: 14 })).toBe("heavyRain");
  });

  it("température basse + pluie actuelle donne snow", () => {
    expect(getHourlyWeatherState({ temperature: 0, windSpeed: 8, rain: 1.5, dominantState: "clear", hour: 7 })).toBe("snow");
  });

  it("vent très fort actuel donne strongWind ou tempest", () => {
    const state = getHourlyWeatherState({ temperature: 14, windSpeed: 52, rain: 0.2, dominantState: "clear", hour: 13 });
    expect(["strongWind", "tempest"]).toContain(state);
  });

  it("dominant storm avec rain 0 donne cloudy/overcast", () => {
    const state = getHourlyWeatherState({ temperature: 15, windSpeed: 18, rain: 0, dominantState: "storm", dailyRainTotal: 6, hour: 11 });
    expect(["cloudy", "overcast"]).toContain(state);
  });

  it("dominant heavyRain avec rain 0 donne cloudy/overcast", () => {
    const state = getHourlyWeatherState({ temperature: 11, windSpeed: 14, rain: 0, dominantState: "heavyRain", dailyRainTotal: 8, hour: 16 });
    expect(["cloudy", "overcast"]).toContain(state);
  });

  it("dominant fog avec vent faible le matin donne fog", () => {
    expect(getHourlyWeatherState({ temperature: 8, windSpeed: 7, rain: 0, dominantState: "fog", hour: 6 })).toBe("fog");
  });

  it("dominant clear avec pluie 0 et vent faible donne clear", () => {
    expect(getHourlyWeatherState({ temperature: 17, windSpeed: 5, rain: 0, dominantState: "clear", hour: 12 })).toBe("clear");
  });

  it("reste compatible sans paramètres enrichis", () => {
    expect(getHourlyWeatherState({ temperature: 18, windSpeed: 10, rain: 0 })).toBe(getWeatherState({ temperature: 18, windSpeed: 10, rain: 0 }));
  });
});