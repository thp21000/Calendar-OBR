import { describe, expect, it } from "vitest";
import { deriveSeasonWeatherTraits, normalizeSeasonWeatherProfile } from "../seasonWeatherProfile";

const base = {
  temperature: { min: 0, average: 10, max: 20 },
  windSpeed: { min: 0, average: 10, max: 20 },
  rain: { min: 0, average: 2, max: 6 }
};

describe("seasonWeatherProfile", () => {
  it("legacy profile without advanced fields stays valid", () => {
    const normalized = normalizeSeasonWeatherProfile(base);
    expect(normalized.stability).toBeUndefined();
    expect(normalized.temperature.average).toBe(10);
  });

  it("invalid advanced values are clamped between 0 and 1", () => {
    const normalized = normalizeSeasonWeatherProfile({ ...base, stability: -2, precipitationChance: 3 });
    expect(normalized.stability).toBe(0);
    expect(normalized.precipitationChance).toBe(1);
  });

  it("derive always returns 0..1 values", () => {
    const traits = deriveSeasonWeatherTraits(base);
    Object.values(traits).forEach((value) => expect(value).toBeGreaterThanOrEqual(0));
    Object.values(traits).forEach((value) => expect(value).toBeLessThanOrEqual(1));
  });

  it("humid season has higher precipitationChance than dry season", () => {
    const dry = deriveSeasonWeatherTraits({ ...base, rain: { min: 0, average: 0.2, max: 1 } });
    const wet = deriveSeasonWeatherTraits({ ...base, rain: { min: 2, average: 6, max: 12 } });
    expect(wet.precipitationChance).toBeGreaterThan(dry.precipitationChance);
  });

  it("high rain+wind gives higher stormChance", () => {
    const calm = deriveSeasonWeatherTraits({ ...base, windSpeed: { min: 0, average: 8, max: 15 }, rain: { min: 0, average: 1, max: 3 } });
    const violent = deriveSeasonWeatherTraits({ ...base, windSpeed: { min: 10, average: 30, max: 80 }, rain: { min: 3, average: 5, max: 14 } });
    expect(violent.stormChance).toBeGreaterThan(calm.stormChance);
  });

  it("low wind + rain gives higher fogChance", () => {
    const lowWindRain = deriveSeasonWeatherTraits({ ...base, windSpeed: { min: 0, average: 4, max: 10 }, rain: { min: 0, average: 2, max: 5 } });
    const highWindDry = deriveSeasonWeatherTraits({ ...base, windSpeed: { min: 10, average: 25, max: 40 }, rain: { min: 0, average: 0, max: 0 } });
    expect(lowWindRain.fogChance).toBeGreaterThan(highWindDry.fogChance);
  });

  it("large spreads reduce stability", () => {
    const stable = deriveSeasonWeatherTraits({ ...base, temperature: { min: 8, average: 10, max: 12 }, windSpeed: { min: 8, average: 10, max: 12 }, rain: { min: 1, average: 2, max: 3 } });
    const unstable = deriveSeasonWeatherTraits({ ...base, temperature: { min: -15, average: 10, max: 35 }, windSpeed: { min: 0, average: 25, max: 60 }, rain: { min: 0, average: 5, max: 12 } });
    expect(unstable.stability).toBeLessThan(stable.stability);
  });
});
