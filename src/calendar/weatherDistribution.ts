import type { WeatherTrendKind } from "../domain/types";

export type MetricRange = {
  min: number;
  average: number;
  max: number;
};

export type CenteredMetricInput = {
  range: MetricRange;
  rolls: [number, number, number];
  extremeRoll: number;
  extremeDepthRoll: number;
  stability: number;
  trendKind?: WeatherTrendKind;
  trendOffset?: number;
};

export type SkewedLowMetricInput = {
  range: MetricRange;
  roll: number;
  moderateRoll: number;
  extremeRoll: number;
  extremeDepthRoll: number;
  stability: number;
  intensity: number;
  trendKind?: WeatherTrendKind;
  multiplier?: number;
  allowZero?: boolean;
};

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
export const clamp01 = (value: number): number => clamp(value, 0, 1);
export const round1 = (value: number): number => Math.round(value * 10) / 10;

const normalizeRange = (range: MetricRange): MetricRange => {
  const min = Math.min(range.min, range.max);
  const max = Math.max(range.min, range.max);
  return { min, max, average: clamp(range.average, min, max) };
};

const trendTemperatureBias = (trendKind: WeatherTrendKind | undefined): number => {
  switch (trendKind) {
    case "cold": return -0.28;
    case "warm": return 0.28;
    case "stable": return 0;
    case "unstable": return 0;
    default: return 0;
  }
};

const trendExtremeBoost = (trendKind: WeatherTrendKind | undefined): number => {
  switch (trendKind) {
    case "stormy": return 0.03;
    case "unstable": return 0.02;
    case "windy": return 0.018;
    case "wet": return 0.014;
    case "cold":
    case "warm": return 0.01;
    default: return 0;
  }
};

export const sampleCenteredMetric = (input: CenteredMetricInput): number => {
  const range = normalizeRange(input.range);
  const spanBelow = Math.max(0, range.average - range.min);
  const spanAbove = Math.max(0, range.max - range.average);
  const stability = clamp01(input.stability);
  const trendKind = input.trendKind;
  const centerRoll = (input.rolls[0] + input.rolls[1] + input.rolls[2]) / 3;
  const biasedRoll = clamp01(centerRoll + trendTemperatureBias(trendKind) * 0.18);
  const signed = (biasedRoll - 0.5) * 2;
  const direction = signed < 0 ? -1 : 1;
  const sideSpan = direction < 0 ? spanBelow : spanAbove;
  const spread = 0.42 + (1 - stability) * 0.3 + (trendKind === "unstable" ? 0.08 : 0) + (trendKind === "stable" ? -0.08 : 0);
  const shaped = Math.pow(Math.abs(signed), 1.75) * clamp(spread, 0.22, 0.86);

  const extremeChance = clamp(0.012 + (1 - stability) * 0.018 + trendExtremeBoost(trendKind), 0.005, 0.07);
  const extremeDirection = trendKind === "cold" ? -1 : trendKind === "warm" ? 1 : direction;
  if (input.extremeRoll < extremeChance) {
    const extremeSpan = extremeDirection < 0 ? spanBelow : spanAbove;
    const depth = 0.72 + input.extremeDepthRoll * 0.24;
    return round1(clamp(range.average + (extremeDirection < 0 ? -1 : 1) * extremeSpan * depth + (input.trendOffset ?? 0), range.min, range.max));
  }

  return round1(clamp(range.average + direction * sideSpan * shaped + (input.trendOffset ?? 0), range.min, range.max));
};

export const sampleSkewedLowMetric = (input: SkewedLowMetricInput): number => {
  const range = normalizeRange(input.range);
  const stability = clamp01(input.stability);
  const intensity = clamp01(input.intensity);
  const multiplier = Math.max(0, input.multiplier ?? 1);
  const upperSpan = Math.max(0, range.max - range.average);
  const lowerToAverage = Math.max(0, range.average - range.min);

  const extremeChance = clamp(0.01 + intensity * 0.045 + (1 - stability) * 0.018 + trendExtremeBoost(input.trendKind), 0.004, 0.12);
  if (input.extremeRoll < extremeChance && upperSpan > 0) {
    const depth = 0.48 + input.extremeDepthRoll * (0.45 + intensity * 0.07);
    return round1(clamp((range.average + upperSpan * depth) * multiplier, range.min, range.max));
  }

  const normalTopRatio = clamp(0.08 + intensity * 0.24 + (1 - stability) * 0.08, 0.05, 0.42);
  const normalTop = range.average + upperSpan * normalTopRatio;
  const exponent = clamp(2.4 - intensity * 1.05 - (1 - stability) * 0.25, 1.15, 2.8);
  let value = range.min + (normalTop - range.min) * Math.pow(clamp01(input.roll), exponent);

  const moderateChance = clamp(0.08 + intensity * 0.18 + (1 - stability) * 0.08, 0.05, 0.38);
  if (input.moderateRoll < moderateChance && upperSpan > 0) {
    const moderateTop = range.average + upperSpan * clamp(0.18 + intensity * 0.28, 0.18, 0.58);
    value = Math.max(value, range.average + (moderateTop - range.average) * Math.pow(clamp01(input.roll), 1.4));
  }

  if (!input.allowZero && value <= 0 && (range.average > 0 || range.max > 0)) {
    value = Math.min(range.max, Math.max(0.1, lowerToAverage * 0.15));
  }

  return round1(clamp(value * multiplier, range.min, range.max));
};
