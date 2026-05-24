import type { WeatherSnapshot, WeatherState } from "../domain/types";

// v1 thresholds (simple and documented):
// - rain >= 12 and wind >= 70 => tempest
// - rain >= 8 and wind >= 45 => storm
// - temp <= 1 and rain >= 1 => snow
// - rain >= 6 => heavyRain
// - rain >= 1 => lightRain
// - wind >= 45 => strongWind
// - wind <= 6 and rain < 0.5 => clear/cloudy/overcast by wind bucket
export const getWeatherState = (snapshot: Pick<WeatherSnapshot, "temperature" | "windSpeed" | "rain">): WeatherState => {
  const { temperature, windSpeed, rain } = snapshot;

  if (rain >= 12 && windSpeed >= 70) return "tempest";
  if (rain >= 8 && windSpeed >= 45) return "storm";
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
  }
};

type HourlyWeatherStateInput = Pick<WeatherSnapshot, "temperature" | "windSpeed" | "rain"> & {
  dailyRainTotal?: number;
  dominantState?: WeatherState;
  hour?: number;
};

export const getHourlyWeatherState = (input: HourlyWeatherStateInput): WeatherState => {
  const { temperature, windSpeed, rain, dailyRainTotal, dominantState, hour } = input;

  // Primary instantaneous weather remains priority.
  const instant = getWeatherState({ temperature, windSpeed, rain });
  if (rain >= 1 || windSpeed >= 45 || (temperature <= 1 && rain > 0)) return instant;

  const safeHour = ((hour ?? 12) % 24 + 24) % 24;
  const rain24h = Math.max(0, dailyRainTotal ?? 0);

  switch (dominantState) {
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