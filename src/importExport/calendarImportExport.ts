import type { CalendarProject, LocaleCode } from "../domain/types";
import type { WeatherBiomeId, WeatherBiomeProfile, WeatherValueRange } from "../calendar/weather/biomes";
import type { SeasonWeatherModifier } from "../calendar/weather/seasonModifiers";
import { assertCalendarSystem } from "../calendar/dateEngine";
import { normalizeMoon } from "../calendar/moonLogic";
import { normalizeSeasonWeatherProfile } from "../calendar/seasonsLogic";
import { DEFAULT_WEATHER_BIOME_ID, DEFAULT_WEATHER_BIOME_PROFILES, WEATHER_BIOME_DEFINITIONS, normalizeWeatherBiomeProfile } from "../calendar/weather/biomes";
import { ensureDefaultSceneWeatherProfiles } from "../calendar/sceneWeatherDefaults";
import { sanitizeWeatherAdvancedSettings } from "../calendar/weatherAdvancedSettings";
import { DEFAULT_UNITS } from "../calendar/weatherUnits";
import { isWeatherState } from "../calendar/weatherStates";
import { normalizePlayerViewSettings } from "../calendar/playerViewSettings";
import { normalizeAdventureContext } from "../calendar/adventureContext";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const weatherBiomeIds = new Set(WEATHER_BIOME_DEFINITIONS.map((definition) => definition.id));
const isWeatherBiomeId = (value: unknown): value is WeatherBiomeId =>
  typeof value === "string" && weatherBiomeIds.has(value as WeatherBiomeId);

const isWindDirection = (value: unknown): boolean =>
  value === "N" || value === "NE" || value === "E" || value === "SE" || value === "S" || value === "SW" || value === "W" || value === "NW";

const isTrendKind = (value: unknown): boolean =>
  value === "cold" || value === "warm" || value === "wet" || value === "dry" || value === "windy" || value === "calm" || value === "stormy" || value === "stable" || value === "unstable";

const numericRange = (value: unknown, fallback: WeatherValueRange): WeatherValueRange =>
  isRecord(value)
    ? {
        min: typeof value.min === "number" ? value.min : fallback.min,
        average: typeof value.average === "number" ? value.average : fallback.average,
        max: typeof value.max === "number" ? value.max : fallback.max
      }
    : fallback;

const optionalNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const sanitizeStateWeights = (value: unknown): WeatherBiomeProfile["stateWeights"] | undefined => {
  if (!isRecord(value)) return undefined;
  const out: WeatherBiomeProfile["stateWeights"] = {};
  for (const [state, weight] of Object.entries(value)) {
    if (typeof weight !== "number" || !Number.isFinite(weight) || weight < 0) continue;
    if (isWeatherState(state)) {
      out[state] = weight;
    }
  }
  return out;
};

const sanitizeWeatherBiomeProfile = (value: unknown, fallback: WeatherBiomeProfile): WeatherBiomeProfile | undefined => {
  if (!isRecord(value)) return undefined;
  const traits = isRecord(value.traits) ? value.traits : {};
  return normalizeWeatherBiomeProfile({
    temperature: numericRange(value.temperature, fallback.temperature),
    rain: numericRange(value.rain, fallback.rain),
    dailyRain: numericRange(value.dailyRain, fallback.dailyRain),
    windSpeed: numericRange(value.windSpeed, fallback.windSpeed),
    traits: {
      stability: optionalNumber(traits.stability) ?? fallback.traits.stability,
      precipitationChance: optionalNumber(traits.precipitationChance) ?? fallback.traits.precipitationChance,
      fogChance: optionalNumber(traits.fogChance) ?? fallback.traits.fogChance,
      stormChance: optionalNumber(traits.stormChance) ?? fallback.traits.stormChance,
      dayNightAmplitude: optionalNumber(traits.dayNightAmplitude) ?? fallback.traits.dayNightAmplitude,
      windVariability: optionalNumber(traits.windVariability) ?? fallback.traits.windVariability
    },
    stateWeights: sanitizeStateWeights(value.stateWeights) ?? fallback.stateWeights
  });
};

const sanitizeSeasonWeatherModifier = (value: unknown): SeasonWeatherModifier | undefined => {
  if (!isRecord(value)) return undefined;
  const out: SeasonWeatherModifier = {};
  const copyNumbers = <T extends Record<string, unknown>>(source: unknown, keys: string[]): T | undefined => {
    if (!isRecord(source)) return undefined;
    const next: Record<string, unknown> = {};
    for (const key of keys) {
      if (typeof source[key] === "number" && Number.isFinite(source[key])) next[key] = source[key];
    }
    return Object.keys(next).length > 0 ? next as T : undefined;
  };
  out.temperature = copyNumbers(value.temperature, ["minOffset", "averageOffset", "maxOffset"]);
  out.rain = copyNumbers(value.rain, ["minMultiplier", "averageMultiplier", "maxMultiplier"]);
  out.dailyRain = copyNumbers(value.dailyRain, ["minMultiplier", "averageMultiplier", "maxMultiplier"]);
  out.windSpeed = copyNumbers(value.windSpeed, ["minMultiplier", "averageMultiplier", "maxMultiplier"]);
  out.traits = copyNumbers(value.traits, ["stabilityOffset", "precipitationChanceOffset", "fogChanceOffset", "stormChanceOffset", "dayNightAmplitudeMultiplier", "windVariabilityMultiplier"]);
  out.stateWeights = sanitizeStateWeights(value.stateWeights);
  return Object.values(out).some((entry) => entry && Object.keys(entry).length > 0) ? out : undefined;
};

const isLocale = (value: unknown): value is LocaleCode => value === "fr" || value === "en";
  
const isValidUiTab = (value: unknown): value is CalendarProject["uiSettings"]["activeTab"] =>
  value === "today" || value === "month" || value === "events" || value === "settings" || value === "player";

export const validateImportedCalendarProject = (
  data: unknown
): { valid: true; project: CalendarProject } | { valid: false; error: string } => {
  if (!isRecord(data)) return { valid: false, error: "Invalid JSON payload." };

  if (typeof data.schemaVersion !== "number") return { valid: false, error: "schemaVersion is required and must be a number." };
  if (typeof data.appVersion !== "string") return { valid: false, error: "appVersion is required and must be a string." };
  if (typeof data.id !== "string" || data.id.trim().length === 0) return { valid: false, error: "id is required and must be a non-empty string." };
  if (typeof data.name !== "string" || data.name.trim().length === 0)
    return { valid: false, error: "name is required and must be a non-empty string." };
  if (!isLocale(data.locale)) return { valid: false, error: "locale must be 'fr' or 'en'." };

  if (!isRecord(data.units)) return { valid: false, error: "units is required and must be an object." };
  if (data.units.temperature !== "celsius" && data.units.temperature !== "fahrenheit") return { valid: false, error: "units.temperature is invalid." };
  if (data.units.windSpeed !== "kmh" && data.units.windSpeed !== "mph") return { valid: false, error: "units.windSpeed is invalid." };
  if (data.units.rain !== "mm" && data.units.rain !== "inch") return { valid: false, error: "units.rain is invalid." };

  if (!isRecord(data.currentTime)) return { valid: false, error: "currentTime is required and must be an object." };
  const absoluteDay = data.currentTime.absoluteDay;
  const hour = data.currentTime.hour;
  const minute = data.currentTime.minute;
  if (typeof absoluteDay !== "number" || !Number.isInteger(absoluteDay)) {
    return { valid: false, error: "currentTime.absoluteDay must be an integer." };
  }
  if (typeof hour !== "number" || !Number.isInteger(hour) || hour < 0 || hour > 23) {
    return { valid: false, error: "currentTime.hour must be an integer between 0 and 23." };
  }
  if (typeof minute !== "number" || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    return { valid: false, error: "currentTime.minute must be an integer between 0 and 59." };
  }

  if (!isRecord(data.calendarSystem)) return { valid: false, error: "calendarSystem is required and must be an object." };

  try {
    assertCalendarSystem(data.calendarSystem as CalendarProject["calendarSystem"]);
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }

  if (!Array.isArray(data.events)) return { valid: false, error: "events must be an array." };
  if (data.dayNotes !== undefined && !Array.isArray(data.dayNotes)) return { valid: false, error: "dayNotes must be an array." };
  if (!Array.isArray(data.seasons)) return { valid: false, error: "seasons must be an array." };
  if (!Array.isArray(data.moons)) return { valid: false, error: "moons must be an array." };
  if (data.moonEvents !== undefined && !Array.isArray(data.moonEvents)) return { valid: false, error: "moonEvents must be an array." };
  if (!Array.isArray(data.weatherEvents)) return { valid: false, error: "weatherEvents must be an array." };
  if (!isRecord(data.weatherSettings)) return { valid: false, error: "weatherSettings must be an object." };

  if (!isRecord(data.adventureContext)) return { valid: false, error: "adventureContext must be an object." };
  if (!isRecord(data.uiSettings)) return { valid: false, error: "uiSettings is required and must be an object." };
  if (!isValidUiTab(data.uiSettings.activeTab)) return { valid: false, error: "uiSettings.activeTab is invalid." };
  if (typeof data.uiSettings.compactMode !== "boolean") return { valid: false, error: "uiSettings.compactMode must be a boolean." };

  return { valid: true, project: data as CalendarProject };
};

export const sanitizeCalendarProject = (data: unknown): { ok: true; project: CalendarProject } | { ok: false; error: string } => {
  if (!isRecord(data)) return { ok: false, error: "Invalid JSON payload." };

  const maybeCompat: Record<string, unknown> = {
    ...data,
    seasons: Array.isArray(data.seasons) ? data.seasons : [],
    moons: Array.isArray(data.moons) ? data.moons : [],
    dayNotes: Array.isArray(data.dayNotes) ? data.dayNotes : [],
    moonEvents: Array.isArray(data.moonEvents) ? data.moonEvents : [],
    weatherEvents: Array.isArray(data.weatherEvents) ? data.weatherEvents : [],
    weatherOverrides: Array.isArray((data as Record<string, unknown>).weatherOverrides) ? (data as Record<string, unknown>).weatherOverrides as unknown[] : [],
    sceneWeatherProfiles: Array.isArray((data as Record<string, unknown>).sceneWeatherProfiles) ? (data as Record<string, unknown>).sceneWeatherProfiles as unknown[] : []
  };

  maybeCompat.adventureContext = normalizeAdventureContext((data as Record<string, unknown>).adventureContext);

  if (isRecord(maybeCompat.units)) {
    const units = maybeCompat.units as Record<string, unknown>;
    maybeCompat.units = {
      temperature: units.temperature === "fahrenheit" ? "fahrenheit" : DEFAULT_UNITS.temperature,
      windSpeed: units.windSpeed === "mph" ? "mph" : DEFAULT_UNITS.windSpeed,
      rain: units.rain === "inch" ? "inch" : DEFAULT_UNITS.rain
    };
  } else {
    maybeCompat.units = DEFAULT_UNITS;
  }

  if (!isRecord(maybeCompat.weatherSettings)) {
    maybeCompat.weatherSettings = {};
  }

  if (isRecord(maybeCompat.weatherBiome)) {
    const biome = maybeCompat.weatherBiome as Record<string, unknown>;
    const currentBiomeId = isWeatherBiomeId(biome.currentBiomeId) ? biome.currentBiomeId : DEFAULT_WEATHER_BIOME_ID;
    const previousBiomeId = isWeatherBiomeId(biome.previousBiomeId) ? biome.previousBiomeId : undefined;
    const biomeChangedAtMinutes = typeof biome.biomeChangedAtMinutes === "number" && Number.isFinite(biome.biomeChangedAtMinutes) ? Math.trunc(biome.biomeChangedAtMinutes) : undefined;
    const transitionDurationMinutes = typeof biome.transitionDurationMinutes === "number" && Number.isFinite(biome.transitionDurationMinutes) && biome.transitionDurationMinutes > 0 ? Math.trunc(biome.transitionDurationMinutes) : undefined;
    const disabledBiomeIds = Array.isArray(biome.disabledBiomeIds)
      ? Array.from(new Set(biome.disabledBiomeIds.filter(isWeatherBiomeId))).filter((id) => id !== currentBiomeId)
      : undefined;
    maybeCompat.weatherBiome = {
      currentBiomeId,
      ...(previousBiomeId ? { previousBiomeId } : {}),
      ...(biomeChangedAtMinutes !== undefined ? { biomeChangedAtMinutes } : {}),
      ...(transitionDurationMinutes !== undefined ? { transitionDurationMinutes } : {}),
      ...(disabledBiomeIds && disabledBiomeIds.length > 0 ? { disabledBiomeIds } : {})
    };
  } else if (maybeCompat.weatherBiome !== undefined) {
    delete maybeCompat.weatherBiome;
  }

  if (isRecord(maybeCompat.weatherBiomeProfiles)) {
    const profiles: Partial<Record<WeatherBiomeId, WeatherBiomeProfile>> = {};
    for (const [id, profile] of Object.entries(maybeCompat.weatherBiomeProfiles)) {
      if (!isWeatherBiomeId(id)) continue;
      const sanitizedProfile = sanitizeWeatherBiomeProfile(profile, DEFAULT_WEATHER_BIOME_PROFILES[id]);
      if (sanitizedProfile) profiles[id] = sanitizedProfile;
    }
    maybeCompat.weatherBiomeProfiles = profiles;
  } else if (maybeCompat.weatherBiomeProfiles !== undefined) {
    delete maybeCompat.weatherBiomeProfiles;
  }

  if (!isRecord(maybeCompat.uiSettings)) {
    maybeCompat.uiSettings = { activeTab: "today", compactMode: true };
  }

  if (isRecord(maybeCompat.uiSettings) && typeof maybeCompat.uiSettings.defaultMoonSystemInitialized !== "boolean") {
    delete maybeCompat.uiSettings.defaultMoonSystemInitialized;
  }

  if (isRecord(maybeCompat.uiSettings)) {
    const ui = maybeCompat.uiSettings as Record<string, unknown>;
    if (!["weekdayDayMonthYear", "dayMonthYear", "dayMonthYearNumeric", "yearMonthDay", "monthDayYear"].includes(String(ui.dateFormat))) delete ui.dateFormat;
    if (ui.timeFormat !== "24h" && ui.timeFormat !== "12h") delete ui.timeFormat;
    ui.playerView = normalizePlayerViewSettings(ui.playerView);
  }

  if (isRecord(maybeCompat.weatherSettings)) {
    const ws = maybeCompat.weatherSettings as Record<string, unknown>;
    if (typeof ws.seed !== "string") delete ws.seed;
    if (ws.forecastMode !== "fine" && ws.forecastMode !== "wide") delete ws.forecastMode;
  }

  if (Array.isArray(maybeCompat.moons)) {
    maybeCompat.moons = maybeCompat.moons
      .filter(isRecord)
      .filter((moon) => typeof moon.id === "string" && typeof moon.name === "string")
      .map((moon) =>
        normalizeMoon({
          id: moon.id as string,
          name: moon.name as string,
          icon: typeof moon.icon === "string" ? moon.icon : undefined,
          cycleLengthDays: typeof moon.cycleLengthDays === "number" ? moon.cycleLengthDays : 29.5,
          cycleOffsetDays: typeof moon.cycleOffsetDays === "number" ? moon.cycleOffsetDays : 0
        })
      );
  }

  if (Array.isArray(maybeCompat.seasons)) {
    maybeCompat.seasons = maybeCompat.seasons.map((season) => {
      if (!isRecord(season)) return season;
      const next = { ...season } as Record<string, unknown>;
      if (isRecord(next.weatherProfile)) {
        const wp = next.weatherProfile as Record<string, unknown>;
        next.weatherProfile = normalizeSeasonWeatherProfile({
          temperature: numericRange(wp.temperature, { min: 0, average: 10, max: 20 }),
          windSpeed: numericRange(wp.windSpeed, { min: 0, average: 15, max: 40 }),
          rain: numericRange(wp.rain, { min: 0, average: 2, max: 10 }),
          stability: optionalNumber(wp.stability),
          precipitationChance: optionalNumber(wp.precipitationChance),
          stormChance: optionalNumber(wp.stormChance),
          fogChance: optionalNumber(wp.fogChance),
          temperatureSwing: optionalNumber(wp.temperatureSwing),
          windVariability: optionalNumber(wp.windVariability)
        });
      }
      if (isRecord(next.weatherModifier)) {
        next.weatherModifier = sanitizeSeasonWeatherModifier(next.weatherModifier);
        if (!next.weatherModifier) delete next.weatherModifier;
      }
      return next;
    });
  }

  if (Array.isArray(maybeCompat.sceneWeatherProfiles)) {
    maybeCompat.sceneWeatherProfiles = maybeCompat.sceneWeatherProfiles
      .filter(isRecord)
      .filter((profile) => typeof profile.id === "string" && profile.id.trim().length > 0)
      .filter((profile) => typeof profile.name === "string" && profile.name.trim().length > 0)
      .map((profile) => {
        const next = { ...profile } as Record<string, unknown>;
        if (typeof next.icon !== "string") delete next.icon;
        if (typeof next.enabled !== "boolean") next.enabled = true;
        if (typeof next.durationMinutes !== "number" || !Number.isFinite(next.durationMinutes) || next.durationMinutes < 5) delete next.durationMinutes;
        else next.durationMinutes = Math.trunc(next.durationMinutes);
        if (typeof next.transitionMinutes !== "number" || !Number.isFinite(next.transitionMinutes) || next.transitionMinutes < 0) delete next.transitionMinutes;
        else next.transitionMinutes = Math.trunc(next.transitionMinutes);
        if (!isWeatherBiomeId(next.forceBiomeId)) delete next.forceBiomeId;
        const sourceOverride = isRecord(next.override) ? next.override : {};
        const override: Record<string, unknown> = {};
        for (const key of ["temperature", "dailyMinTemperature", "dailyMaxTemperature", "rain", "dailyRainTotal", "windSpeed"]) {
          const value = sourceOverride[key];
          if (typeof value !== "number" || !Number.isFinite(value)) continue;
          override[key] = (key === "rain" || key === "dailyRainTotal" || key === "windSpeed") && value < 0 ? 0 : value;
        }
        if (isWindDirection(sourceOverride.windDirection)) override.windDirection = sourceOverride.windDirection;
        if (isWeatherState(sourceOverride.state)) override.state = sourceOverride.state;
        if (isWeatherState(sourceOverride.dominantState)) override.dominantState = sourceOverride.dominantState;
        if (isTrendKind(sourceOverride.trendKind)) override.trendKind = sourceOverride.trendKind;
        if (typeof sourceOverride.gmNote === "string") override.gmNote = sourceOverride.gmNote;
        next.override = override;
        return next;
      });
  }

  if (Array.isArray((maybeCompat as Record<string, unknown>).weatherOverrides)) {
    (maybeCompat as Record<string, unknown>).weatherOverrides = ((maybeCompat as Record<string, unknown>).weatherOverrides as unknown[])
      .filter(isRecord)
      .filter((o) => typeof o.id === "string" && o.id.trim().length > 0)
      .filter((o) => typeof o.absoluteDay === "number" && Number.isInteger(o.absoluteDay))
      .map((o) => {
        const n = { ...o } as Record<string, unknown>;
        const num = (k: string, nonNeg = false) => {
          const v = n[k];
          if (typeof v !== "number" || !Number.isFinite(v)) { delete n[k]; return; }
          if (nonNeg && v < 0) { n[k] = 0; return; }
        };
        for (const k of ["temperature", "dailyMinTemperature", "dailyMaxTemperature", "dailyRainTotal", "windSpeed", "rain"]) num(k, ["dailyRainTotal","windSpeed","rain"].includes(k));
        if (typeof n.label !== "string") delete n.label;
        if (typeof n.gmNote !== "string") delete n.gmNote;
        if (!isWindDirection(n.windDirection)) delete n.windDirection;
        if (!isWeatherState(n.state)) delete n.state;
        if (!isWeatherState(n.dominantState)) delete n.dominantState;
        if (!isTrendKind(n.trendKind)) delete n.trendKind;
        if (!(n.source === "manual" || n.source === "weatherEvent" || n.source === "sceneWeather")) delete n.source;
        if (typeof n.sourceId !== "string") delete n.sourceId;
        if (typeof n.sceneId !== "string") delete n.sceneId;
        if (typeof n.sceneName !== "string") delete n.sceneName;
        for (const k of ["transitionStartAtMinutes", "transitionDurationMinutes"]) num(k, true);
        if (isRecord(n.transitionFrom)) {
          const from = { ...n.transitionFrom } as Record<string, unknown>;
          for (const k of ["temperature", "dailyMinTemperature", "dailyMaxTemperature", "dailyRainTotal", "windSpeed", "rain"]) {
            const v = from[k];
            if (typeof v !== "number" || !Number.isFinite(v)) delete from[k];
            else if (["dailyRainTotal", "windSpeed", "rain"].includes(k) && v < 0) from[k] = 0;
          }
          n.transitionFrom = from;
        } else delete n.transitionFrom;
        return n;
      });
  }

  if (Array.isArray(maybeCompat.events)) {
    maybeCompat.events = maybeCompat.events
      .filter(isRecord)
      .map((event) => {
        const next = { ...event } as Record<string, unknown>;
        if (typeof next.reminderEnabled !== "boolean") delete next.reminderEnabled;
        if (typeof next.reminderMinutesBefore !== "number" || !Number.isFinite(next.reminderMinutesBefore) || next.reminderMinutesBefore < 0) {
          delete next.reminderMinutesBefore;
        } else {
          next.reminderMinutesBefore = Math.trunc(next.reminderMinutesBefore);
        }
        return next;
      });
  }

  if (Array.isArray(maybeCompat.weatherEvents)) {
    maybeCompat.weatherEvents = maybeCompat.weatherEvents
      .filter(isRecord)
      .filter((event) => typeof event.id === "string" && event.id.trim().length > 0)
      .filter((event) => typeof event.name === "string" && event.name.trim().length > 0)
      .map((event) => {
        const next = { ...event } as Record<string, unknown>;
        if (Array.isArray(next.conditions)) {
          next.conditions = next.conditions
            .filter(isRecord)
            .filter(
              (condition) =>
                ((condition.type === "state" && isWeatherState(condition.state)) ||
                (condition.type === "dominantState" && isWeatherState(condition.state)) ||
                (condition.type === "windDirection" &&
                  (condition.direction === "N" ||
                    condition.direction === "NE" ||
                    condition.direction === "E" ||
                    condition.direction === "SE" ||
                    condition.direction === "S" ||
                    condition.direction === "SW" ||
                    condition.direction === "W" ||
                    condition.direction === "NW")) ||
                (condition.type === "season" && typeof condition.seasonId === "string" && condition.seasonId.trim().length > 0) ||
                  (condition.type === "adventureContext" &&
                    (condition.mode === "any" || condition.mode === "all" || condition.mode === "none") &&
                    (condition.target === undefined || condition.target === "allContexts" || condition.target === "primaryOnly" || condition.target === "secondaryOnly" || condition.target === "primaryAndAnySecondary") &&
                    Array.isArray(condition.contextIds)) ||
                  (condition.type === "biome" && (condition.biomeIds === undefined || Array.isArray(condition.biomeIds))) ||
                  (condition.type === "timeOfDay" &&
                    typeof condition.startHour === "number" &&
                    Number.isFinite(condition.startHour) &&
                    typeof condition.endHour === "number" &&
                    Number.isFinite(condition.endHour)) ||
                  (condition.type === "moonPhase" &&
                    typeof condition.moonId === "string" &&
                    condition.moonId.trim().length > 0 &&
                    (condition.phaseId === "new" ||
                      condition.phaseId === "waxingCrescent" ||
                      condition.phaseId === "firstQuarter" ||
                      condition.phaseId === "waxingGibbous" ||
                      condition.phaseId === "full" ||
                      condition.phaseId === "waningGibbous" ||
                      condition.phaseId === "lastQuarter" ||
                      condition.phaseId === "waningCrescent")) ||
                  ((condition.type === undefined || condition.type === "metric") &&
                    (condition.metric === "temperature" || condition.metric === "windSpeed" || condition.metric === "rain" || condition.metric === "dailyMinTemperature" || condition.metric === "dailyMaxTemperature" || condition.metric === "dailyRainTotal") &&
                    (condition.operator === "gte" || condition.operator === "lte") &&
                    typeof condition.value === "number" &&
                    Number.isFinite(condition.value)))
            );
            next.conditions = (next.conditions as Record<string, unknown>[]).map((condition) => {
            if (!isRecord(condition)) return condition;
            if (condition.type === "timeOfDay") {
              return {
                ...condition,
                startHour: Math.max(0, Math.min(23, Math.trunc(condition.startHour as number))),
                endHour: Math.max(0, Math.min(23, Math.trunc(condition.endHour as number)))
              };
            }
            if (condition.type === "biome") {
              const biomeIds = Array.isArray(condition.biomeIds) ? Array.from(new Set(condition.biomeIds.filter(isWeatherBiomeId))) : [];
              return biomeIds.length > 0 ? { ...condition, biomeIds } : { type: "biome" };
            }
            if (condition.type === "adventureContext") {
              const target = condition.target === "primaryOnly" || condition.target === "secondaryOnly" || condition.target === "primaryAndAnySecondary" ? condition.target : "allContexts";
              return {
                type: "adventureContext",
                mode: target === "primaryAndAnySecondary" ? "any" : condition.mode === "all" || condition.mode === "none" ? condition.mode : "any",
                target,
                mode: condition.mode === "all" || condition.mode === "none" ? condition.mode : "any",
                contextIds: Array.isArray(condition.contextIds) ? Array.from(new Set(condition.contextIds.filter((id) => typeof id === "string" && id.trim().length > 0))) : [],
                includePrimary: typeof condition.includePrimary === "boolean" ? condition.includePrimary : true,
                includeSecondary: typeof condition.includeSecondary === "boolean" ? condition.includeSecondary : true
              };
            }
            return condition;
          });
        } else {
          next.conditions = [];
        }
        if (typeof next.enabled !== "boolean") delete next.enabled;
        if (typeof next.requireAllConditions !== "boolean") delete next.requireAllConditions;
        if (typeof next.summary !== "string") delete next.summary;
        if (typeof next.link !== "string") delete next.link;
        if (typeof next.icon !== "string") delete next.icon;
        if (typeof next.gmDescription !== "string") delete next.gmDescription;
        if (typeof next.playerDescription !== "string") delete next.playerDescription;
        if (!(next.visibility === "gm" || next.visibility === "players" || next.visibility === "revealOnTrigger")) next.visibility = "gm";
        if (typeof next.notifyOnTrigger !== "boolean") next.notifyOnTrigger = true;
        if (!(next.status === "active" || next.status === "triggered" || next.status === "archived" || next.status === "disabled")) next.status = "active";
        if (typeof next.lastTriggeredAtMinutes !== "number" || !Number.isFinite(next.lastTriggeredAtMinutes) || next.lastTriggeredAtMinutes < 0) delete next.lastTriggeredAtMinutes;
        if (typeof next.archiveAfterTrigger !== "boolean") next.archiveAfterTrigger = false;
        if (typeof next.disableAfterTrigger !== "boolean") next.disableAfterTrigger = false;
        if (Array.isArray(next.triggerHistory)) {
          next.triggerHistory = next.triggerHistory
            .filter(isRecord)
            .map((entry) => {
              if (typeof entry.triggeredAtMinutes !== "number" || !Number.isFinite(entry.triggeredAtMinutes) || entry.triggeredAtMinutes < 0) return null;
              const out: Record<string, unknown> = {
                id: typeof entry.id === "string" && entry.id.trim().length > 0 ? entry.id : `weather-trigger-${Math.trunc(entry.triggeredAtMinutes as number)}`,
                triggeredAtMinutes: Math.trunc(entry.triggeredAtMinutes as number)
              };
              if (isWeatherState(entry.weatherState)) out.weatherState = entry.weatherState;
              if (isWeatherState(entry.dominantState)) out.dominantState = entry.dominantState;
              if (typeof entry.temperature === "number" && Number.isFinite(entry.temperature)) out.temperature = entry.temperature;
              if (typeof entry.rain === "number" && Number.isFinite(entry.rain)) out.rain = entry.rain;
              if (typeof entry.windSpeed === "number" && Number.isFinite(entry.windSpeed)) out.windSpeed = entry.windSpeed;
              return out;
            })
            .filter((entry): entry is Record<string, unknown> => entry !== null)
            .slice(-10);
        } else {
          delete next.triggerHistory;
        }
        if (typeof next.durationHours !== "number" || !Number.isFinite(next.durationHours) || next.durationHours < 0) {
          delete next.durationHours;
        } else {
          next.durationHours = Math.trunc(next.durationHours);
        }
        if (typeof next.cooldownHours !== "number" || !Number.isFinite(next.cooldownHours) || next.cooldownHours < 0) {
          delete next.cooldownHours;
        } else {
          next.cooldownHours = Math.trunc(next.cooldownHours);
        }
        return next;
      });
  }

  if (Array.isArray(maybeCompat.events)) {
    maybeCompat.events = (maybeCompat.events as unknown[]).filter(isRecord).map((event) => {
      const next = { ...event } as Record<string, unknown>;
      if (Array.isArray(next.conditions)) {
        next.conditions = next.conditions
          .filter(isRecord)
          .filter((condition) => condition.type === "adventureContext" && (condition.mode === "any" || condition.mode === "all" || condition.mode === "none") && Array.isArray(condition.contextIds))
          .map((condition) => {
            const target = condition.target === "primaryOnly" || condition.target === "secondaryOnly" || condition.target === "primaryAndAnySecondary" ? condition.target : "allContexts";
            return {
              type: "adventureContext",
              mode: target === "primaryAndAnySecondary" ? "any" : condition.mode === "all" || condition.mode === "none" ? condition.mode : "any",
              target,
              contextIds: Array.from(new Set((condition.contextIds as unknown[]).filter((id): id is string => typeof id === "string" && id.trim().length > 0))),
              includePrimary: typeof condition.includePrimary === "boolean" ? condition.includePrimary : true,
              includeSecondary: typeof condition.includeSecondary === "boolean" ? condition.includeSecondary : true
            };
          });
      } else {
        delete next.conditions;
      }
      return next;
    });
  }
  
  if (Array.isArray(maybeCompat.moonEvents)) {
    maybeCompat.moonEvents = maybeCompat.moonEvents
      .filter(isRecord)
      .filter((event) => typeof event.id === "string" && event.id.trim().length > 0)
      .filter((event) => typeof event.name === "string" && event.name.trim().length > 0)
      .map((event) => {
        const next = { ...event } as Record<string, unknown>;
        if (typeof next.icon !== "string") delete next.icon;
        if (typeof next.summary !== "string") next.summary = "";
        if (typeof next.gmDescription !== "string") delete next.gmDescription;
        if (typeof next.playerDescription !== "string") delete next.playerDescription;
        if (typeof next.moonId !== "string") next.moonId = "";
        if (!(next.phaseId === "new" || next.phaseId === "waxingCrescent" || next.phaseId === "firstQuarter" || next.phaseId === "waxingGibbous" || next.phaseId === "full" || next.phaseId === "waningGibbous" || next.phaseId === "lastQuarter" || next.phaseId === "waningCrescent")) next.phaseId = "full";
        if (!(next.visibility === "gm" || next.visibility === "players" || next.visibility === "revealOnTrigger")) next.visibility = "gm";
        if (typeof next.enabled !== "boolean") next.enabled = true;
        if (typeof next.notifyOnTrigger !== "boolean") next.notifyOnTrigger = true;
        if (!(next.status === "active" || next.status === "triggered" || next.status === "archived" || next.status === "disabled")) next.status = "active";
        if (typeof next.lastTriggeredAtMinutes !== "number" || !Number.isFinite(next.lastTriggeredAtMinutes) || next.lastTriggeredAtMinutes < 0) delete next.lastTriggeredAtMinutes;
        if (typeof next.archiveAfterTrigger !== "boolean") next.archiveAfterTrigger = false;
        if (typeof next.disableAfterTrigger !== "boolean") next.disableAfterTrigger = false;
        if (!(next.status === "active" || next.status === "triggered" || next.status === "archived" || next.status === "disabled")) next.status = "active";
        return next;
      });
  }
  if (Array.isArray(maybeCompat.dayNotes)) {
    maybeCompat.dayNotes = maybeCompat.dayNotes
      .filter(isRecord)
      .filter((note) => typeof note.id === "string" && note.id.trim().length > 0)
      .filter((note) => isRecord(note.date))
      .map((note) => {
        const next = { ...note } as Record<string, unknown>;
        if (typeof next.gmNote !== "string") delete next.gmNote;
        if (typeof next.playerNote !== "string") delete next.playerNote;
        if (!(next.visibility === "gm" || next.visibility === "players")) next.visibility = "gm";
        if (typeof next.updatedAt !== "number" || !Number.isFinite(next.updatedAt)) next.updatedAt = Date.now();
        return next;
      });
  }

  if (isRecord(maybeCompat.weatherAdvancedSettings)) {
    const weatherAdvancedSettings = sanitizeWeatherAdvancedSettings(maybeCompat.weatherAdvancedSettings);
    if (weatherAdvancedSettings) maybeCompat.weatherAdvancedSettings = weatherAdvancedSettings;
    else delete maybeCompat.weatherAdvancedSettings;
  } else {
    delete maybeCompat.weatherAdvancedSettings;
  }

  const validation = validateImportedCalendarProject(ensureDefaultSceneWeatherProfiles(maybeCompat as CalendarProject));
  if (!validation.valid) return { ok: false, error: validation.error };
  return { ok: true, project: validation.project };
};

export const exportCalendarProject = (project: CalendarProject): string => JSON.stringify(project, null, 2);

export const importCalendarProject = (
  input: string,
  currentProject: CalendarProject
): { ok: true; project: CalendarProject } | { ok: false; error: string; project: CalendarProject } => {
  try {
    const parsed = JSON.parse(input) as unknown;
    const sanitized = sanitizeCalendarProject(parsed);
    if (!sanitized.ok) {
      return { ok: false, error: sanitized.error, project: currentProject };
    }

    return { ok: true, project: sanitized.project };
  } catch {
    return { ok: false, error: "Invalid JSON file.", project: currentProject };
  }
};
