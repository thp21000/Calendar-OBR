import type { WeatherState } from "../../../domain/types";

export type WeatherBiomeId =
  | "temperate"
  | "mountain"
  | "arctic"
  | "desert"
  | "marsh"
  | "jungle"
  | "temperateForest"
  | "coast"
  | "freshwater"
  | "sea"
  | "hell"
  | "volcanic"
  | "sky"
  | "paradise"
  | "underground"
  | "cave";

export type WeatherValueRange = {
  min: number;
  average: number;
  max: number;
};

export type WeatherBiomeProfile = {
  temperature: WeatherValueRange;
  rain: WeatherValueRange;
  dailyRain: WeatherValueRange;
  windSpeed: WeatherValueRange;
  traits: {
    stability: number;
    precipitationChance: number;
    fogChance: number;
    stormChance: number;
    dayNightAmplitude: number;
    windVariability: number;
  };
  stateWeights: Partial<Record<WeatherState, number>>;
};

export type WeatherBiomeDefinition = {
  id: WeatherBiomeId;
  icon: string;
  nameKey: string;
  descriptionKey: string;
  entryMessageKey: string;
  transitionDurationMinutes: number;
};

export type WeatherBiomeState = {
  currentBiomeId: WeatherBiomeId;
  previousBiomeId?: WeatherBiomeId;
  biomeChangedAtMinutes?: number;
  transitionDurationMinutes?: number;
  disabledBiomeIds?: WeatherBiomeId[];
};
