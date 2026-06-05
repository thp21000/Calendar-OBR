import type { WeatherSnapshot, WeatherState } from "../domain/types";

// Thresholds remain simple and deterministic. Specialized states are strict so
// they stay rare unless metrics or dominant biome weights clearly support them.
export const getWeatherState = (snapshot: Pick<WeatherSnapshot, "temperature" | "windSpeed" | "rain">): WeatherState => {
  const { temperature, windSpeed, rain } = snapshot;


  if (temperature <= -5 && rain >= 1 && windSpeed >= 45) return "blizzard";
  if (rain >= 15) return "monsoon";
  if (rain >= 12 && windSpeed >= 70) return "tempest";
  if (rain >= 8 && windSpeed >= 45) return "storm";
  if (rain < 0.5 && temperature >= 18 && windSpeed >= 70) return "sandstorm";
  if (temperature <= 1 && rain >= 1) return "snow";
  if (rain >= 6) return "heavyRain";
  if (rain >= 1) return "lightRain";
  if (windSpeed >= 45) return "strongWind";

  if (windSpeed <= 6) return "clear";
  if (windSpeed <= 18) return "cloudy";
  if (windSpeed <= 30) return "overcast";
  return "fog";
};

export const getWeatherStateIcon = (state: WeatherState): string => {
  switch (state) {
    case "clear": return "☀️";
    case "cloudy": return "⛅";
    case "overcast": return "☁️";
    case "fog": return "🌫️";
    case "lightRain": return "🌦️";
    case "heavyRain": return "🌧️";
    case "storm": return "⛈️";
    case "snow": return "❄️";
    case "strongWind": return "💨";
    case "tempest": return "🌩️";
    case "blizzard": return "🌨️";
    case "sandstorm": return "🏜️";
    case "monsoon": return "🌧️";
    case "seaFog": return "🌫️";
    case "volcanicAsh": return "🌋";
  }
};

export type HourlyWeatherStateInput = Pick<WeatherSnapshot, "temperature" | "windSpeed" | "rain"> & {
  dailyRainTotal?: number;
  dominantState?: WeatherState;
  hour?: number;
};

export const getHourlyWeatherState = (input: HourlyWeatherStateInput): WeatherState => {
  const { temperature, windSpeed, rain, dailyRainTotal, dominantState, hour } = input;

  // Primary instantaneous weather remains priority.
  const instant = getWeatherState({ temperature, windSpeed, rain });
  if (instant === "blizzard" || instant === "monsoon" || instant === "sandstorm") return instant;
  if (rain >= 6 || windSpeed >= 45) return instant;

  const safeHour = ((hour ?? 12) % 24 + 24) % 24;
  const rain24h = Math.max(0, dailyRainTotal ?? 0);

  switch (dominantState) {
    case "blizzard":
      if (temperature <= -5 && (rain >= 0.3 || windSpeed >= 35)) return "blizzard";
      return temperature <= 1 ? "snow" : "overcast";
    case "monsoon":
      if (rain >= 4 || rain24h >= 18) return "monsoon";
      return rain24h > 4 ? "heavyRain" : "overcast";
    case "sandstorm":
      if (rain < 0.5 && windSpeed >= 35) return "sandstorm";
      return windSpeed >= 20 ? "strongWind" : "overcast";
    case "seaFog":
      if (rain < 2 && windSpeed <= 18) return "seaFog";
      return windSpeed <= 24 ? "fog" : "overcast";
    case "volcanicAsh":
      return rain >= 6 ? instant : "volcanicAsh";
    case "tempest":
    case "storm":
      if (windSpeed >= 45) return "strongWind";
      return rain24h > 0.5 ? "overcast" : "cloudy";
    case "heavyRain":
      return rain24h > 1 ? "overcast" : "cloudy";
    case "lightRain":
      return rain24h > 0.2 ? "cloudy" : instant;
    case "fog": {
      const isMorningOrNight = safeHour <= 8 || safeHour >= 21;
      if (windSpeed <= 12 && isMorningOrNight) return "fog";
      return windSpeed <= 18 ? "cloudy" : instant;
    }
    case "snow":
      if (temperature <= 1) return "snow";
      return "overcast";
    case "strongWind":
      if (windSpeed >= 40) return "strongWind";
      return windSpeed >= 20 ? "overcast" : "cloudy";
    case "clear":
      if (rain <= 0 && windSpeed <= 10) return "clear";
      return instant;
    case "cloudy":
    case "overcast":
      return dominantState;
    default:
      return instant;
  }
};