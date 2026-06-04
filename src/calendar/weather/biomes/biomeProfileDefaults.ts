import type { WeatherBiomeId, WeatherBiomeProfile } from "./types";

/**
* Profils météorologiques par défaut des biomes.
*
* La température définit la plage de températures du biome avant application des modifications saisonnières.
* Les précipitations définissent les valeurs instantanées/horaires générées par le biome.
* Les précipitations quotidiennes définissent le total des précipitations sur 24 heures généré par le biome.
* La vitesse du vent définit la plage de vitesses du vent du biome.
* La stabilité des caractéristiques (traits.stability) varie de 0 à 1; une valeur plus élevée indique une météo plus stable.
* La probabilité de précipitations (traits.precipitationChance) varie de 0 à 1; il s'agit d'une probabilité générale de précipitations.
* La probabilité de brouillard (traits.fogChance) varie de 0 à 1 ; il s’agit d’une probabilité générale de brouillard.
* traits.stormChance varie de 0 à 1 ; il s’agit d’une probabilité générale d’orage ou de tempête.
* La variabilité du vent (traits.windVariability) varie de 0 à 1; une valeur plus élevée indique une plus grande variabilité du vent.
* Les pondérations des états météorologiques sont des coefficients multiplicatifs; une valeur manquante correspond à 1.
*/
export const DEFAULT_WEATHER_BIOME_PROFILES: Record<WeatherBiomeId, WeatherBiomeProfile> = {
  temperate: {
    temperature: { min: 0, average: 12, max: 26 },
    rain: { min: 0, average: 1.2, max: 5 },
    dailyRain: { min: 0, average: 3, max: 18 },
    windSpeed: { min: 0, average: 15, max: 45 },
    traits: { stability: 0.55, precipitationChance: 0.42, fogChance: 0.22, stormChance: 0.18, dayNightAmplitude: 8, windVariability: 0.45 },
    stateWeights: {}
  },
  mountain: {
    temperature: { min: -10, average: 5, max: 18 },
    rain: { min: 0, average: 1.4, max: 6 },
    dailyRain: { min: 0, average: 4, max: 22 },
    windSpeed: { min: 5, average: 25, max: 70 },
    traits: { stability: 0.45, precipitationChance: 0.48, fogChance: 0.35, stormChance: 0.25, dayNightAmplitude: 10, windVariability: 0.65 },
    stateWeights: { strongWind: 1.4, snow: 1.3, blizzard: 1.25, fog: 1.2, clear: 0.9 }
  },
  arctic: {
    temperature: { min: -35, average: -16, max: 2 },
    rain: { min: 0, average: 0.5, max: 2 },
    dailyRain: { min: 0, average: 2, max: 10 },
    windSpeed: { min: 5, average: 28, max: 75 },
    traits: { stability: 0.42, precipitationChance: 0.38, fogChance: 0.2, stormChance: 0.28, dayNightAmplitude: 7, windVariability: 0.62 },
    stateWeights: { snow: 2.5, blizzard: 2.1, strongWind: 1.5, tempest: 1.2, clear: 0.8, lightRain: 0.2, heavyRain: 0.1 }
  },
  desert: {
    temperature: { min: 8, average: 30, max: 48 },
    rain: { min: 0, average: 0.1, max: 1.2 },
    dailyRain: { min: 0, average: 0.4, max: 5 },
    windSpeed: { min: 0, average: 18, max: 55 },
    traits: { stability: 0.7, precipitationChance: 0.08, fogChance: 0.04, stormChance: 0.12, dayNightAmplitude: 18, windVariability: 0.58 },
    stateWeights: { clear: 1.8, cloudy: 0.6, overcast: 0.4, lightRain: 0.2, heavyRain: 0.05, storm: 0.4, strongWind: 1.3, sandstorm: 1.7 }
  },
  marsh: {
    temperature: { min: 4, average: 17, max: 30 },
    rain: { min: 0, average: 2.2, max: 7 },
    dailyRain: { min: 0, average: 7, max: 28 },
    windSpeed: { min: 0, average: 10, max: 30 },
    traits: { stability: 0.5, precipitationChance: 0.62, fogChance: 0.62, stormChance: 0.2, dayNightAmplitude: 6, windVariability: 0.32 },
    stateWeights: { fog: 1.8, seaFog: 1.2, lightRain: 1.5, heavyRain: 1.3, monsoon: 1.15, overcast: 1.4, clear: 0.7 }
  },
  jungle: {
    temperature: { min: 18, average: 28, max: 38 },
    rain: { min: 0, average: 3, max: 10 },
    dailyRain: { min: 0, average: 10, max: 40 },
    windSpeed: { min: 0, average: 9, max: 32 },
    traits: { stability: 0.38, precipitationChance: 0.7, fogChance: 0.42, stormChance: 0.32, dayNightAmplitude: 5, windVariability: 0.35 },
    stateWeights: { lightRain: 1.5, heavyRain: 1.8, monsoon: 1.35, storm: 1.4, fog: 1.3, clear: 0.7 }
  },
  temperateForest: {
    temperature: { min: -2, average: 11, max: 24 },
    rain: { min: 0, average: 1.5, max: 5.5 },
    dailyRain: { min: 0, average: 4, max: 20 },
    windSpeed: { min: 0, average: 10, max: 32 },
    traits: { stability: 0.58, precipitationChance: 0.48, fogChance: 0.38, stormChance: 0.15, dayNightAmplitude: 7, windVariability: 0.32 },
    stateWeights: { fog: 1.3, lightRain: 1.2, clear: 0.9, strongWind: 0.7 }
  },
  coast: {
    temperature: { min: 2, average: 14, max: 28 },
    rain: { min: 0, average: 1.8, max: 7 },
    dailyRain: { min: 0, average: 5, max: 26 },
    windSpeed: { min: 5, average: 24, max: 65 },
    traits: { stability: 0.42, precipitationChance: 0.52, fogChance: 0.32, stormChance: 0.24, dayNightAmplitude: 6, windVariability: 0.65 },
    stateWeights: { strongWind: 1.4, seaFog: 1.35, fog: 1.2, lightRain: 1.2, storm: 1.1, monsoon: 1.1 }
  },
  freshwater: {
    temperature: { min: 1, average: 13, max: 26 },
    rain: { min: 0, average: 1.7, max: 6 },
    dailyRain: { min: 0, average: 5, max: 22 },
    windSpeed: { min: 0, average: 14, max: 42 },
    traits: { stability: 0.55, precipitationChance: 0.5, fogChance: 0.48, stormChance: 0.18, dayNightAmplitude: 6, windVariability: 0.42 },
    stateWeights: { fog: 1.5, lightRain: 1.2, clear: 0.9 }
  },
  sea: {
    temperature: { min: 0, average: 12, max: 24 },
    rain: { min: 0, average: 2.5, max: 10 },
    dailyRain: { min: 0, average: 8, max: 42 },
    windSpeed: { min: 8, average: 34, max: 90 },
    traits: { stability: 0.32, precipitationChance: 0.64, fogChance: 0.35, stormChance: 0.4, dayNightAmplitude: 4, windVariability: 0.78 },
    stateWeights: { strongWind: 1.8, tempest: 1.4, storm: 1.4, heavyRain: 1.4, monsoon: 1.25, seaFog: 1.25, fog: 1.2, clear: 0.7 }
  },
  hell: {
    temperature: { min: 28, average: 45, max: 68 },
    rain: { min: 0, average: 0.05, max: 0.7 },
    dailyRain: { min: 0, average: 0.1, max: 2 },
    windSpeed: { min: 0, average: 22, max: 70 },
    traits: { stability: 0.35, precipitationChance: 0.03, fogChance: 0.12, stormChance: 0.45, dayNightAmplitude: 10, windVariability: 0.7 },
    stateWeights: { clear: 1.4, storm: 1.3, tempest: 1.2, volcanicAsh: 1.2, lightRain: 0.05, heavyRain: 0.02, snow: 0.01, fog: 0.6 }
  },
  volcanic: {
    temperature: { min: 16, average: 32, max: 55 },
    rain: { min: 0, average: 0.6, max: 3 },
    dailyRain: { min: 0, average: 1.5, max: 12 },
    windSpeed: { min: 0, average: 24, max: 70 },
    traits: { stability: 0.28, precipitationChance: 0.22, fogChance: 0.45, stormChance: 0.36, dayNightAmplitude: 9, windVariability: 0.72 },
    stateWeights: { overcast: 1.5, volcanicAsh: 2.2, fog: 1.4, strongWind: 1.2, clear: 0.8, snow: 0.1 }
  },
  sky: {
    temperature: { min: -18, average: 0, max: 16 },
    rain: { min: 0, average: 1.5, max: 7 },
    dailyRain: { min: 0, average: 4, max: 24 },
    windSpeed: { min: 15, average: 45, max: 110 },
    traits: { stability: 0.24, precipitationChance: 0.44, fogChance: 0.16, stormChance: 0.42, dayNightAmplitude: 12, windVariability: 0.9 },
    stateWeights: { strongWind: 2, tempest: 1.5, blizzard: 1.15, clear: 1.1, fog: 0.7 }
  },
  paradise: {
    temperature: { min: 12, average: 23, max: 32 },
    rain: { min: 0, average: 0.8, max: 3 },
    dailyRain: { min: 0, average: 2, max: 12 },
    windSpeed: { min: 0, average: 8, max: 28 },
    traits: { stability: 0.82, precipitationChance: 0.25, fogChance: 0.08, stormChance: 0.06, dayNightAmplitude: 5, windVariability: 0.22 },
    stateWeights: { clear: 1.8, cloudy: 1.1, storm: 0.4, tempest: 0.2, heavyRain: 0.5, fog: 0.6 }
  },
  underground: {
    temperature: { min: 2, average: 8, max: 16 },
    rain: { min: 0, average: 0.15, max: 1 },
    dailyRain: { min: 0, average: 0.4, max: 3 },
    windSpeed: { min: 0, average: 5, max: 18 },
    traits: { stability: 0.86, precipitationChance: 0.08, fogChance: 0.28, stormChance: 0.02, dayNightAmplitude: 2, windVariability: 0.18 },
    stateWeights: { fog: 1.4, clear: 0.5, storm: 0.05, tempest: 0.05, strongWind: 0.3, lightRain: 0.2, heavyRain: 0.1 }
  },
  cave: {
    temperature: { min: 3, average: 9, max: 17 },
    rain: { min: 0, average: 0.7, max: 3 },
    dailyRain: { min: 0, average: 2, max: 10 },
    windSpeed: { min: 0, average: 4, max: 16 },
    traits: { stability: 0.8, precipitationChance: 0.25, fogChance: 0.55, stormChance: 0.02, dayNightAmplitude: 2, windVariability: 0.16 },
    stateWeights: { fog: 1.8, lightRain: 0.6, heavyRain: 0.35, overcast: 1.2, storm: 0.05, tempest: 0.05, strongWind: 0.25 }
  }
};
