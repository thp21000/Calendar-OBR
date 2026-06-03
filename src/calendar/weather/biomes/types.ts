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

export type WeatherBiomeRules = {
  temperatureOffset?: number;
  rainMultiplier?: number;
  windMultiplier?: number;
  stateWeights?: Partial<Record<WeatherState, number>>;
};

export type WeatherBiomeDefinition = {
  id: WeatherBiomeId;
  icon: string;
  nameKey: string;
  descriptionKey: string;
  entryMessageKey: string;
  transitionDurationMinutes: number;
  rules: WeatherBiomeRules;
};

export type WeatherBiomeState = {
  currentBiomeId: WeatherBiomeId;
  previousBiomeId?: WeatherBiomeId;
  biomeChangedAtMinutes?: number;
  transitionDurationMinutes?: number;
};
