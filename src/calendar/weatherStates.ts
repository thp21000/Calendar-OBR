import type { WeatherState } from "../domain/types";

export const WEATHER_STATES: WeatherState[] = [
  "clear",
  "cloudy",
  "overcast",
  "fog",
  "lightRain",
  "heavyRain",
  "storm",
  "snow",
  "strongWind",
  "tempest",
  "blizzard",
  "sandstorm",
  "monsoon",
  "seaFog",
  "volcanicAsh"
];

export const isWeatherState = (value: unknown): value is WeatherState =>
  typeof value === "string" && (WEATHER_STATES as string[]).includes(value);
