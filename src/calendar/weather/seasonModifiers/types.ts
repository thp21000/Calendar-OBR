import type { WeatherState } from "../../../domain/types";

export type SeasonWeatherModifier = {
  temperature?: {
    minOffset?: number;
    averageOffset?: number;
    maxOffset?: number;
  };
  rain?: {
    minMultiplier?: number;
    averageMultiplier?: number;
    maxMultiplier?: number;
  };
  dailyRain?: {
    minMultiplier?: number;
    averageMultiplier?: number;
    maxMultiplier?: number;
  };
  windSpeed?: {
    minMultiplier?: number;
    averageMultiplier?: number;
    maxMultiplier?: number;
  };
  traits?: {
    stabilityOffset?: number;
    precipitationChanceOffset?: number;
    fogChanceOffset?: number;
    stormChanceOffset?: number;
    dayNightAmplitudeMultiplier?: number;
    windVariabilityMultiplier?: number;
  };
  stateWeights?: Partial<Record<WeatherState, number>>;
};
