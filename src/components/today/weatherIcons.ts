import { getWeatherStateIcon } from "../../calendar/weatherState";
import type { WeatherSnapshot, WeatherTrendKind } from "../../domain/types";

export const getTemperatureIcon = (temperature: number): string => {
  if (temperature < -15) return "🧊";
  if (temperature < -10) return "❄️";
  if (temperature <= 0) return "🥶";
  if (temperature <= 10) return "🌬️";
  if (temperature <= 20) return "🌤️";
  if (temperature <= 30) return "☀️";
  if (temperature <= 35) return "🔥";
  if (temperature <= 50) return "🌋";
  return "☄️";
};

export const getWindSpeedIcon = (windSpeed: number): string => {
  if (windSpeed <= 0) return "🪶";
  if (windSpeed <= 20) return "🍃";
  if (windSpeed <= 30) return "🌬️";
  if (windSpeed <= 50) return "💨";
  if (windSpeed <= 70) return "🌪️";
  if (windSpeed <= 90) return "🌀";
  if (windSpeed <= 120) return "⚠️";
  return "🚨";
};

export const getWindDirectionIcon = (direction?: string): string => {
  const map: Record<string, string> = {
    N: "↑",
    NE: "↗",
    E: "→",
    SE: "↘",
    S: "↓",
    SW: "↙",
    W: "←",
    NW: "↖"
  };
  return direction ? map[direction] ?? "" : "";
};

export const getRainIcon = (weather: WeatherSnapshot): string => {
  if (weather.state && ["storm", "heavyRain", "tempest", "monsoon", "blizzard"].includes(weather.state)) {
    return getWeatherStateIcon(weather.state);
  }
  if (weather.rain <= 0) return "☁️";
  if (weather.rain <= 1) return "🌦️";
  if (weather.rain <= 5) return "🌧️";
  if (weather.rain <= 15) return "☔";
  return "⛈️";
};

export const getTrendIcon = (trendKind?: WeatherTrendKind): string => {
  switch (trendKind) {
    case "cold": return "🧊";
    case "warm": return "☀️";
    case "wet": return "🌧️";
    case "dry": return "🏜️";
    case "windy": return "💨";
    case "calm": return "🍃";
    case "stormy": return "⛈️";
    case "stable": return "⚖️";
    case "unstable": return "🔀";
    default: return "•";
  }
};