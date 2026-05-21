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
