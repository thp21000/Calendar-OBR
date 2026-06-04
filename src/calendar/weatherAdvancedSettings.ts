import { getWeatherStateIcon } from "./weatherState";
import { WEATHER_STATES } from "./weatherStates";
import type { CalendarProject, LocaleCode, WeatherAdvancedSettings, WeatherAdvancedThresholds, WeatherDominanceConfig, WeatherState, WeatherStateConfig, WeatherTrendConfig, WeatherTrendKind } from "../domain/types";

export const WEATHER_TRENDS: WeatherTrendKind[] = ["cold", "warm", "wet", "dry", "windy", "calm", "stormy", "stable", "unstable"];

export type NormalizedWeatherAdvancedSettings = {
  stateConfigs: Record<string, WeatherStateConfig>;
  trendConfigs: Record<string, WeatherTrendConfig>;
  dominanceConfigs: Record<string, WeatherDominanceConfig>;
};

export type WeatherDominanceMetrics = {
  minTemperature: number;
  maxTemperature: number;
  rainTotal24h: number;
  maxWindSpeed: number;
  stormChance: number;
  fogChance: number;
  precipitationChance: number;
  rainAverage: number;
};

const trendDefaults: Record<WeatherTrendKind, Omit<WeatherTrendConfig, "id" | "enabled">> = {
  cold: { icon: "🧊", label: { fr: "froide", en: "cold" }, temperatureOffset: -3, rainMultiplier: 1.05, windMultiplier: 1, stormChanceModifier: 0, stabilityModifier: 0 },
  warm: { icon: "☀️", label: { fr: "chaude", en: "warm" }, temperatureOffset: 3, rainMultiplier: 0.95, windMultiplier: 1, stormChanceModifier: 0, stabilityModifier: 0 },
  wet: { icon: "🌧️", label: { fr: "humide", en: "wet" }, temperatureOffset: 0, rainMultiplier: 1.25, windMultiplier: 1.05, stormChanceModifier: 0.05, stabilityModifier: -0.08 },
  dry: { icon: "🏜️", label: { fr: "sèche", en: "dry" }, temperatureOffset: 0.5, rainMultiplier: 0.65, windMultiplier: 0.95, stormChanceModifier: -0.05, stabilityModifier: 0.08 },
  windy: { icon: "💨", label: { fr: "venteuse", en: "windy" }, temperatureOffset: 0, rainMultiplier: 1, windMultiplier: 1.25, stormChanceModifier: 0.05, stabilityModifier: -0.08 },
  calm: { icon: "🍃", label: { fr: "calme", en: "calm" }, temperatureOffset: 0, rainMultiplier: 0.95, windMultiplier: 0.75, stormChanceModifier: -0.03, stabilityModifier: 0.12 },
  stormy: { icon: "⛈️", label: { fr: "orageuse", en: "stormy" }, temperatureOffset: -0.5, rainMultiplier: 1.35, windMultiplier: 1.3, stormChanceModifier: 0.18, stabilityModifier: -0.18 },
  stable: { icon: "⚖️", label: { fr: "stable", en: "stable" }, temperatureOffset: 0, rainMultiplier: 0.95, windMultiplier: 0.9, stormChanceModifier: -0.02, stabilityModifier: 0.2 },
  unstable: { icon: "🔀", label: { fr: "instable", en: "unstable" }, temperatureOffset: 0, rainMultiplier: 1.1, windMultiplier: 1.1, stormChanceModifier: 0.08, stabilityModifier: -0.2 }
};

const stateLabels: Record<WeatherState, Partial<Record<LocaleCode, string>>> = {
  clear: { fr: "Ciel dégagé", en: "Clear" },
  cloudy: { fr: "Nuageux", en: "Cloudy" },
  overcast: { fr: "Couvert", en: "Overcast" },
  fog: { fr: "Brouillard", en: "Fog" },
  lightRain: { fr: "Pluie légère", en: "Light rain" },
  heavyRain: { fr: "Pluie forte", en: "Heavy rain" },
  storm: { fr: "Orage", en: "Storm" },
  snow: { fr: "Neige", en: "Snow" },
  strongWind: { fr: "Vent fort", en: "Strong wind" },
  tempest: { fr: "Tempête", en: "Tempest" },
  blizzard: { fr: "Blizzard", en: "Blizzard" },
  sandstorm: { fr: "Tempête de sable", en: "Sandstorm" },
  monsoon: { fr: "Mousson", en: "Monsoon" },
  seaFog: { fr: "Brume marine", en: "Sea fog" },
  volcanicAsh: { fr: "Cendres volcaniques", en: "Volcanic ash" }
};

const stateThresholds: Partial<Record<WeatherState, WeatherAdvancedThresholds>> = {
  blizzard: { maxTemperature: -5, minWindSpeed: 45, minRain: 1 },
  sandstorm: { minTemperature: 18, minWindSpeed: 70, maxRain: 0.5 },
  monsoon: { minRain: 15 },
  seaFog: { maxWindSpeed: 18, maxRain: 2 },
  volcanicAsh: {},
  tempest: { minWindSpeed: 70, minRain: 12 },
  storm: { minWindSpeed: 45, minRain: 8 },
  snow: { maxTemperature: 1, minRain: 1 },
  heavyRain: { minRain: 6 },
  lightRain: { minRain: 1 },
  strongWind: { minWindSpeed: 45 }
};

export const DEFAULT_WEATHER_STATE_CONFIGS: Record<WeatherState, WeatherStateConfig> = Object.fromEntries(
  WEATHER_STATES.map((state, index) => [state, {
    id: state,
    enabled: true,
    custom: false,
    icon: getWeatherStateIcon(state),
    label: stateLabels[state],
    priority: 10 + index,
    thresholds: stateThresholds[state] ?? {}
  }])
) as Record<WeatherState, WeatherStateConfig>;

export const DEFAULT_WEATHER_TREND_CONFIGS: Record<WeatherTrendKind, WeatherTrendConfig> = Object.fromEntries(
  WEATHER_TRENDS.map((trend) => [trend, { id: trend, enabled: true, ...trendDefaults[trend] }])
) as Record<WeatherTrendKind, WeatherTrendConfig>;

export const DEFAULT_WEATHER_DOMINANCE_CONFIGS: Record<string, WeatherDominanceConfig> = {
  blizzard: { id: "blizzard", enabled: true, stateId: "blizzard", priority: 100, thresholds: { maxTemperature: 1, minDailyRainTotal: 1.5, minWindSpeed: 45, minStormChance: 0.2 } },
  monsoon: { id: "monsoon", enabled: true, stateId: "monsoon", priority: 90, thresholds: { minDailyRainTotal: 26, minPrecipitationChance: 0.58 } },
  sandstorm: { id: "sandstorm", enabled: true, stateId: "sandstorm", priority: 85, thresholds: { maxDailyRainTotal: 0.4, minWindSpeed: 70, minTemperature: 28, maxPrecipitationChance: 0.18 } },
  seaFog: { id: "seaFog", enabled: true, stateId: "seaFog", priority: 70, thresholds: { minFogChance: 0.72, maxWindSpeed: 18, maxDailyRainTotal: 4 } },
  tempest: { id: "tempest", enabled: true, stateId: "tempest", priority: 60, thresholds: { minDailyRainTotal: 12, minWindSpeed: 55, minStormChance: 0.65 } },
  storm: { id: "storm", enabled: true, stateId: "storm", priority: 55, thresholds: { minDailyRainTotal: 8, minWindSpeed: 40, minStormChance: 0.45 } },
  snow: { id: "snow", enabled: true, stateId: "snow", priority: 50, thresholds: { maxTemperature: 1, minDailyRainTotal: 0.2 } },
  heavyRain: { id: "heavyRain", enabled: true, stateId: "heavyRain", priority: 40, thresholds: { minDailyRainTotal: 7 } },
  lightRain: { id: "lightRain", enabled: true, stateId: "lightRain", priority: 30, thresholds: { minDailyRainTotal: 1.2 } },
  strongWind: { id: "strongWind", enabled: true, stateId: "strongWind", priority: 28, thresholds: { minWindSpeed: 45 } },
  fog: { id: "fog", enabled: true, stateId: "fog", priority: 25, thresholds: { minFogChance: 0.65, maxWindSpeed: 15 } },
  overcast: { id: "overcast", enabled: true, stateId: "overcast", priority: 15, thresholds: { minPrecipitationChance: 0.65 } },
  cloudy: { id: "cloudy", enabled: true, stateId: "cloudy", priority: 10, thresholds: { minPrecipitationChance: 0.35 } },
  clear: { id: "clear", enabled: true, stateId: "clear", priority: 0, thresholds: {} },
  volcanicAsh: { id: "volcanicAsh", enabled: true, stateId: "volcanicAsh", priority: 65, thresholds: {} }
};

const safeNumber = (value: unknown, fallback: number | undefined): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const sanitizeThresholds = (value: unknown, fallback: WeatherAdvancedThresholds = {}): WeatherAdvancedThresholds => {
  const source = typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    minTemperature: safeNumber(source.minTemperature, fallback.minTemperature),
    maxTemperature: safeNumber(source.maxTemperature, fallback.maxTemperature),
    minWindSpeed: safeNumber(source.minWindSpeed, fallback.minWindSpeed),
    maxWindSpeed: safeNumber(source.maxWindSpeed, fallback.maxWindSpeed),
    minRain: safeNumber(source.minRain, fallback.minRain),
    maxRain: safeNumber(source.maxRain, fallback.maxRain),
    minDailyRainTotal: safeNumber(source.minDailyRainTotal, fallback.minDailyRainTotal),
    maxDailyRainTotal: safeNumber(source.maxDailyRainTotal, fallback.maxDailyRainTotal),
    minPrecipitationChance: safeNumber(source.minPrecipitationChance, fallback.minPrecipitationChance),
    maxPrecipitationChance: safeNumber(source.maxPrecipitationChance, fallback.maxPrecipitationChance),
    minStormChance: safeNumber(source.minStormChance, fallback.minStormChance),
    maxStormChance: safeNumber(source.maxStormChance, fallback.maxStormChance),
    minFogChance: safeNumber(source.minFogChance, fallback.minFogChance),
    maxFogChance: safeNumber(source.maxFogChance, fallback.maxFogChance)
  };
};

const sanitizeLabel = (value: unknown): Partial<Record<LocaleCode, string>> | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const label: Partial<Record<LocaleCode, string>> = {};
  if (typeof source.fr === "string") label.fr = source.fr;
  if (typeof source.en === "string") label.en = source.en;
  return Object.keys(label).length > 0 ? label : undefined;
};

export const normalizeWeatherAdvancedSettings = (settings?: WeatherAdvancedSettings): NormalizedWeatherAdvancedSettings => {
  const stateConfigs: Record<string, WeatherStateConfig> = { ...DEFAULT_WEATHER_STATE_CONFIGS };
  for (const [id, patch] of Object.entries(settings?.stateConfigs ?? {})) {
    if (!patch || typeof patch !== "object") continue;
    const base = stateConfigs[id as WeatherState] ?? { id, enabled: true, custom: true, priority: 50, thresholds: {} };
    stateConfigs[id] = {
      ...base,
      id,
      enabled: typeof patch.enabled === "boolean" ? patch.enabled : base.enabled,
      custom: typeof patch.custom === "boolean" ? patch.custom : base.custom,
      icon: typeof patch.icon === "string" ? patch.icon : base.icon,
      label: sanitizeLabel(patch.label) ?? base.label,
      description: sanitizeLabel(patch.description) ?? base.description,
      priority: safeNumber(patch.priority, base.priority),
      thresholds: sanitizeThresholds(patch.thresholds, base.thresholds)
    };
  }

  const trendConfigs: Record<string, WeatherTrendConfig> = { ...DEFAULT_WEATHER_TREND_CONFIGS };
  for (const [id, patch] of Object.entries(settings?.trendConfigs ?? {})) {
    if (!patch || typeof patch !== "object") continue;
    const base = trendConfigs[id as WeatherTrendKind] ?? { id, enabled: true };
    trendConfigs[id] = {
      ...base,
      id,
      enabled: typeof patch.enabled === "boolean" ? patch.enabled : base.enabled,
      icon: typeof patch.icon === "string" ? patch.icon : base.icon,
      label: sanitizeLabel(patch.label) ?? base.label,
      temperatureOffset: safeNumber(patch.temperatureOffset, base.temperatureOffset),
      rainMultiplier: safeNumber(patch.rainMultiplier, base.rainMultiplier),
      windMultiplier: safeNumber(patch.windMultiplier, base.windMultiplier),
      stabilityModifier: safeNumber(patch.stabilityModifier, base.stabilityModifier),
      stormChanceModifier: safeNumber(patch.stormChanceModifier, base.stormChanceModifier)
    };
  }

  const dominanceConfigs: Record<string, WeatherDominanceConfig> = { ...DEFAULT_WEATHER_DOMINANCE_CONFIGS };
  for (const [id, patch] of Object.entries(settings?.dominanceConfigs ?? {})) {
    if (!patch || typeof patch !== "object") continue;
    const base = dominanceConfigs[id] ?? { id, enabled: true, custom: true, stateId: id, priority: 0, thresholds: {} };
    dominanceConfigs[id] = {
      ...base,
      id,
      enabled: typeof patch.enabled === "boolean" ? patch.enabled : base.enabled,
      custom: typeof patch.custom === "boolean" ? patch.custom : base.custom,
      stateId: typeof patch.stateId === "string" ? patch.stateId : base.stateId,
      priority: safeNumber(patch.priority, base.priority),
      thresholds: sanitizeThresholds(patch.thresholds, base.thresholds)
    };
  }

  return { stateConfigs, trendConfigs, dominanceConfigs };
};

export const getWeatherAdvancedSettings = (project: CalendarProject): NormalizedWeatherAdvancedSettings =>
  normalizeWeatherAdvancedSettings(project.weatherAdvancedSettings);

export const getWeatherStateConfig = (project: CalendarProject, stateId: string): WeatherStateConfig =>
  getWeatherAdvancedSettings(project).stateConfigs[stateId] ?? { id: stateId, enabled: true, custom: true, priority: 50, thresholds: {} };

export const getWeatherTrendConfig = (project: CalendarProject, trendId: WeatherTrendKind): WeatherTrendConfig =>
  getWeatherAdvancedSettings(project).trendConfigs[trendId] as WeatherTrendConfig;

export const getWeatherStateLabel = (project: CalendarProject, stateId: WeatherState, locale = project.locale): string => {
  const config = getWeatherStateConfig(project, stateId);
  return config.label?.[locale] ?? config.label?.fr ?? config.label?.en ?? stateId;
};

export const getConfiguredWeatherStateIcon = (project: CalendarProject, stateId: WeatherState): string =>
  getWeatherStateConfig(project, stateId).icon || getWeatherStateIcon(stateId);

export const getWeatherTrendLabel = (project: CalendarProject, trendId: WeatherTrendKind, locale = project.locale): string => {
  const config = getWeatherTrendConfig(project, trendId);
  return config?.label?.[locale] ?? config?.label?.fr ?? config?.label?.en ?? trendId;
};

export const getConfiguredWeatherTrendIcon = (project: CalendarProject, trendId: WeatherTrendKind): string =>
  getWeatherTrendConfig(project, trendId)?.icon || "•";

export const getEnabledWeatherStates = (project: CalendarProject): WeatherState[] =>
  WEATHER_STATES.filter((state) => getWeatherStateConfig(project, state).enabled !== false);

export const getEnabledWeatherTrends = (project: CalendarProject): WeatherTrendKind[] =>
  WEATHER_TRENDS.filter((trend) => getWeatherTrendConfig(project, trend)?.enabled !== false);

export const resolveGeneratedWeatherState = (project: CalendarProject, state: WeatherState): WeatherState => {
  if (getWeatherStateConfig(project, state).enabled !== false) return state;
  const fallback: Record<WeatherState, WeatherState[]> = {
    blizzard: ["snow", "strongWind", "overcast"],
    sandstorm: ["strongWind", "overcast"],
    monsoon: ["heavyRain", "overcast"],
    seaFog: ["fog", "cloudy"],
    volcanicAsh: ["overcast"],
    tempest: ["storm", "strongWind", "overcast"],
    storm: ["heavyRain", "strongWind", "overcast"],
    snow: ["overcast", "cloudy"],
    strongWind: ["overcast", "cloudy"],
    heavyRain: ["lightRain", "overcast"],
    lightRain: ["cloudy", "overcast"],
    fog: ["cloudy", "overcast"],
    overcast: ["cloudy", "clear"],
    cloudy: ["clear"],
    clear: ["cloudy"]
  };
  return fallback[state].find((candidate) => getWeatherStateConfig(project, candidate).enabled !== false) ?? "clear";
};

const hasThresholds = (thresholds: WeatherAdvancedThresholds | undefined): boolean => Boolean(thresholds && Object.values(thresholds).some((value) => typeof value === "number" && Number.isFinite(value)));

const thresholdMatches = (thresholds: WeatherAdvancedThresholds | undefined, metrics: WeatherDominanceMetrics): boolean => {
  if (!thresholds) return false;
  if (thresholds.minTemperature !== undefined && metrics.maxTemperature < thresholds.minTemperature) return false;
  if (thresholds.maxTemperature !== undefined && metrics.minTemperature > thresholds.maxTemperature) return false;
  if (thresholds.minWindSpeed !== undefined && metrics.maxWindSpeed < thresholds.minWindSpeed) return false;
  if (thresholds.maxWindSpeed !== undefined && metrics.maxWindSpeed > thresholds.maxWindSpeed) return false;
  if (thresholds.minDailyRainTotal !== undefined && metrics.rainTotal24h < thresholds.minDailyRainTotal) return false;
  if (thresholds.maxDailyRainTotal !== undefined && metrics.rainTotal24h > thresholds.maxDailyRainTotal) return false;
  if (thresholds.minPrecipitationChance !== undefined && metrics.precipitationChance < thresholds.minPrecipitationChance) return false;
  if (thresholds.maxPrecipitationChance !== undefined && metrics.precipitationChance > thresholds.maxPrecipitationChance) return false;
  if (thresholds.minStormChance !== undefined && metrics.stormChance < thresholds.minStormChance) return false;
  if (thresholds.maxStormChance !== undefined && metrics.stormChance > thresholds.maxStormChance) return false;
  if (thresholds.minFogChance !== undefined && metrics.fogChance < thresholds.minFogChance) return false;
  if (thresholds.maxFogChance !== undefined && metrics.fogChance > thresholds.maxFogChance) return false;
  return true;
};

export const chooseDominantWeatherState = (project: CalendarProject, metrics: WeatherDominanceMetrics): WeatherState | undefined => {
  const settings = getWeatherAdvancedSettings(project);
  const rules = Object.values(settings.dominanceConfigs)
    .filter((rule) => rule.enabled !== false && WEATHER_STATES.includes(rule.stateId as WeatherState))
    .filter((rule) => hasThresholds(rule.thresholds))
    .filter((rule) => getWeatherStateConfig(project, rule.stateId).enabled !== false)
    .filter((rule) => thresholdMatches(rule.thresholds, metrics))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return rules[0]?.stateId as WeatherState | undefined;
};
