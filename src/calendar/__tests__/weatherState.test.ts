import { describe, expect, it } from "vitest";
import { t } from "../../i18n/messages";
import { WEATHER_STATES } from "../weatherStates";
import { getHourlyWeatherState, getWeatherState, getWeatherStateIcon } from "../weatherState";

const specializedStates = ["blizzard", "sandstorm", "monsoon", "seaFog", "volcanicAsh"] as const;

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

  it("exposes icons and translations for specialized states", () => {
    for (const state of specializedStates) {
      expect(WEATHER_STATES).toContain(state);
      expect(getWeatherStateIcon(state)).not.toBe("");
      expect(t("fr", `weather.state.${state}`)).not.toBe(`weather.state.${state}`);
      expect(t("en", `weather.state.${state}`)).not.toBe(`weather.state.${state}`);
    }
  });

  it("classifies blizzard from cold precipitation and strong wind", () => {
    expect(getWeatherState({ temperature: -8, windSpeed: 52, rain: 2 })).toBe("blizzard");
  });

  it("classifies monsoon from very heavy rain", () => {
    expect(getWeatherState({ temperature: 24, windSpeed: 18, rain: 16 })).toBe("monsoon");
  });

  it("classifies sandstorm from hot dry extreme wind", () => {
    expect(getWeatherState({ temperature: 32, windSpeed: 76, rain: 0 })).toBe("sandstorm");
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

  it("dominant specialized states keep coherent hourly states", () => {
    expect(getHourlyWeatherState({ temperature: -8, windSpeed: 38, rain: 0.4, dominantState: "blizzard", hour: 8 })).toBe("blizzard");
    expect(getHourlyWeatherState({ temperature: 23, windSpeed: 14, rain: 1, dailyRainTotal: 22, dominantState: "monsoon", hour: 13 })).toBe("monsoon");
    expect(getHourlyWeatherState({ temperature: 31, windSpeed: 38, rain: 0, dominantState: "sandstorm", hour: 15 })).toBe("sandstorm");
    expect(getHourlyWeatherState({ temperature: 12, windSpeed: 10, rain: 0, dominantState: "seaFog", hour: 6 })).toBe("seaFog");
    expect(getHourlyWeatherState({ temperature: 18, windSpeed: 16, rain: 0, dominantState: "volcanicAsh", hour: 12 })).toBe("volcanicAsh");
  });

  it("dominant clear avec pluie 0 et vent faible donne clear", () => {
    expect(getHourlyWeatherState({ temperature: 17, windSpeed: 5, rain: 0, dominantState: "clear", hour: 12 })).toBe("clear");
  });

  it("reste compatible sans paramètres enrichis", () => {
    expect(getHourlyWeatherState({ temperature: 18, windSpeed: 10, rain: 0 })).toBe(getWeatherState({ temperature: 18, windSpeed: 10, rain: 0 }));
  });
});