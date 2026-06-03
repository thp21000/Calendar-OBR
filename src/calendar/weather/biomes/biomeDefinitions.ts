import type { WeatherBiomeDefinition, WeatherBiomeId } from "./types";

export const DEFAULT_WEATHER_BIOME_ID: WeatherBiomeId = "temperate";

const DEFAULT_TRANSITION_DURATION_MINUTES = 120;

const transitionDurationFor = (id: WeatherBiomeId): number => {
  if (id === "hell" || id === "sky") return 30;
  if (id === "volcanic") return 45;
  if (id === "paradise" || id === "underground" || id === "cave") return 60;
  return DEFAULT_TRANSITION_DURATION_MINUTES;
};

const biome = (id: WeatherBiomeId, icon: string): WeatherBiomeDefinition => ({
  id,
  icon,
  nameKey: `weatherBiome.${id}.name`,
  descriptionKey: `weatherBiome.${id}.description`,
  entryMessageKey: `weatherBiome.${id}.entry`,
  transitionDurationMinutes: transitionDurationFor(id)
});

/**
 * Fixed weather biome identity definitions.
 *
 * The actual climate values live in biomeProfileDefaults.ts so the biome name,
 * icon, translation keys and transition duration stay easy to scan here.
 * transitionDurationMinutes controls how abrupt the transition toward this biome is.
 */
export const WEATHER_BIOME_DEFINITIONS: WeatherBiomeDefinition[] = [
  biome("temperate", "🌤️"),
  biome("mountain", "⛰️"),
  biome("arctic", "❄️"),
  biome("desert", "🏜️"),
  biome("marsh", "🐊"),
  biome("jungle", "🌴"),
  biome("temperateForest", "🌲"),
  biome("coast", "🌊"),
  biome("freshwater", "💧"),
  biome("sea", "⛵"),
  biome("hell", "🔥"),
  biome("volcanic", "🌋"),
  biome("sky", "☁️"),
  biome("paradise", "✨"),
  biome("underground", "🪨"),
  biome("cave", "🕳️")
];

export const WEATHER_BIOME_DEFINITION_BY_ID: Record<WeatherBiomeId, WeatherBiomeDefinition> = Object.fromEntries(
  WEATHER_BIOME_DEFINITIONS.map((definition) => [definition.id, definition])
) as Record<WeatherBiomeId, WeatherBiomeDefinition>;

export const getWeatherBiomeDefinition = (id: WeatherBiomeId | undefined): WeatherBiomeDefinition =>
  WEATHER_BIOME_DEFINITION_BY_ID[id ?? DEFAULT_WEATHER_BIOME_ID] ?? WEATHER_BIOME_DEFINITION_BY_ID[DEFAULT_WEATHER_BIOME_ID];