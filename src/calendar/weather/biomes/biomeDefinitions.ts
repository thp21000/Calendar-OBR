import type { WeatherBiomeDefinition, WeatherBiomeId } from "./types";

export const DEFAULT_WEATHER_BIOME_ID: WeatherBiomeId = "temperate";

const DEFAULT_TRANSITION_DURATION_MINUTES = 120;

const transitionDurationFor = (id: WeatherBiomeId): number => {
  if (id === "hell" || id === "sky") return 30;
  if (id === "volcanic") return 45;
  if (id === "paradise" || id === "underground" || id === "cave") return 60;
  return DEFAULT_TRANSITION_DURATION_MINUTES;
};

const biome = (
  id: WeatherBiomeId,
  icon: string,
  rules: WeatherBiomeDefinition["rules"]
): WeatherBiomeDefinition => ({
  id,
  icon,
  nameKey: `weatherBiome.${id}.name`,
  descriptionKey: `weatherBiome.${id}.description`,
  entryMessageKey: `weatherBiome.${id}.entry`,
  transitionDurationMinutes: transitionDurationFor(id),
  rules
});

/**
 * Fixed weather biome definitions.
 *
 * Rule fields are intentionally small and explicit:
 * - temperatureOffset adds or removes degrees from generated temperatures.
 * - rainMultiplier multiplies generated rain values and daily rain totals.
 * - windMultiplier multiplies generated wind speed values.
 * - stateWeights influence relative weather-state tendencies for deterministic corrections.
 * - transitionDurationMinutes controls how abruptly weather moves toward this biome.
 */
export const WEATHER_BIOME_DEFINITIONS: WeatherBiomeDefinition[] = [
  biome("temperate", "🌤️", { temperatureOffset: 0, rainMultiplier: 1, windMultiplier: 1, stateWeights: {} }),
  biome("mountain", "⛰️", { temperatureOffset: -6, rainMultiplier: 1.1, windMultiplier: 1.35, stateWeights: { strongWind: 1.4, snow: 1.3, fog: 1.2, clear: 0.9 } }),
  biome("arctic", "❄️", { temperatureOffset: -18, rainMultiplier: 0.7, windMultiplier: 1.3, stateWeights: { snow: 2.5, strongWind: 1.5, tempest: 1.2, clear: 0.8, lightRain: 0.2, heavyRain: 0.1 } }),
  biome("desert", "🏜️", { temperatureOffset: 8, rainMultiplier: 0.2, windMultiplier: 1.15, stateWeights: { clear: 1.8, cloudy: 0.6, overcast: 0.4, lightRain: 0.2, heavyRain: 0.05, storm: 0.4, strongWind: 1.3 } }),
  biome("marsh", "🐊", { temperatureOffset: 1, rainMultiplier: 1.5, windMultiplier: 0.8, stateWeights: { fog: 1.8, lightRain: 1.5, heavyRain: 1.3, overcast: 1.4, clear: 0.7 } }),
  biome("jungle", "🌴", { temperatureOffset: 4, rainMultiplier: 1.8, windMultiplier: 0.75, stateWeights: { lightRain: 1.5, heavyRain: 1.8, storm: 1.4, fog: 1.3, clear: 0.7 } }),
  biome("temperateForest", "🌲", { temperatureOffset: -1, rainMultiplier: 1.2, windMultiplier: 0.75, stateWeights: { fog: 1.3, lightRain: 1.2, clear: 0.9, strongWind: 0.7 } }),
  biome("coast", "🌊", { temperatureOffset: 0, rainMultiplier: 1.25, windMultiplier: 1.4, stateWeights: { strongWind: 1.4, fog: 1.2, lightRain: 1.2, storm: 1.1 } }),
  biome("freshwater", "💧", { temperatureOffset: -1, rainMultiplier: 1.25, windMultiplier: 1, stateWeights: { fog: 1.5, lightRain: 1.2, clear: 0.9 } }),
  biome("sea", "⛵", { temperatureOffset: -2, rainMultiplier: 1.5, windMultiplier: 1.7, stateWeights: { strongWind: 1.8, tempest: 1.4, storm: 1.4, heavyRain: 1.4, fog: 1.2, clear: 0.7 } }),
  biome("hell", "🔥", { temperatureOffset: 18, rainMultiplier: 0.05, windMultiplier: 1.2, stateWeights: { clear: 1.4, storm: 1.3, tempest: 1.2, lightRain: 0.05, heavyRain: 0.02, snow: 0.01, fog: 0.6 } }),
  biome("volcanic", "🌋", { temperatureOffset: 12, rainMultiplier: 0.35, windMultiplier: 1.25, stateWeights: { overcast: 1.5, fog: 1.4, strongWind: 1.2, clear: 0.8, snow: 0.1 } }),
  biome("sky", "☁️", { temperatureOffset: -8, rainMultiplier: 1.1, windMultiplier: 2, stateWeights: { strongWind: 2, tempest: 1.5, clear: 1.1, fog: 0.7 } }),
  biome("paradise", "✨", { temperatureOffset: 3, rainMultiplier: 0.75, windMultiplier: 0.7, stateWeights: { clear: 1.8, cloudy: 1.1, storm: 0.4, tempest: 0.2, heavyRain: 0.5, fog: 0.6 } }),
  biome("underground", "🪨", { temperatureOffset: -4, rainMultiplier: 0.2, windMultiplier: 0.35, stateWeights: { fog: 1.4, clear: 0.5, storm: 0.05, tempest: 0.05, strongWind: 0.3, lightRain: 0.2, heavyRain: 0.1 } }),
  biome("cave", "🕳️", { temperatureOffset: -3, rainMultiplier: 0.65, windMultiplier: 0.3, stateWeights: { fog: 1.8, lightRain: 0.6, heavyRain: 0.35, overcast: 1.2, storm: 0.05, tempest: 0.05, strongWind: 0.25 } })
];

export const WEATHER_BIOME_DEFINITION_BY_ID: Record<WeatherBiomeId, WeatherBiomeDefinition> = Object.fromEntries(
  WEATHER_BIOME_DEFINITIONS.map((definition) => [definition.id, definition])
) as Record<WeatherBiomeId, WeatherBiomeDefinition>;

export const getWeatherBiomeDefinition = (id: WeatherBiomeId | undefined): WeatherBiomeDefinition =>
  WEATHER_BIOME_DEFINITION_BY_ID[id ?? DEFAULT_WEATHER_BIOME_ID] ?? WEATHER_BIOME_DEFINITION_BY_ID[DEFAULT_WEATHER_BIOME_ID];
