import type { CalendarProject, LocaleCode } from "../domain/types";
import { assertCalendarSystem } from "../calendar/dateEngine";
import { normalizeMoon } from "../calendar/moonLogic";
import { normalizeSeasonWeatherProfile } from "../calendar/seasonsLogic";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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
  if (data.units.temperature !== "celsius") return { valid: false, error: "units.temperature must be 'celsius'." };
  if (data.units.windSpeed !== "kmh") return { valid: false, error: "units.windSpeed must be 'kmh'." };
  if (data.units.rain !== "mm") return { valid: false, error: "units.rain must be 'mm'." };

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
  if (!Array.isArray(data.seasons)) return { valid: false, error: "seasons must be an array." };
  if (!Array.isArray(data.moons)) return { valid: false, error: "moons must be an array." };
  if (!Array.isArray(data.weatherEvents)) return { valid: false, error: "weatherEvents must be an array." };
  if (!isRecord(data.weatherSettings)) return { valid: false, error: "weatherSettings must be an object." };

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
    weatherEvents: Array.isArray(data.weatherEvents) ? data.weatherEvents : []
  };

  if (!isRecord(maybeCompat.weatherSettings)) {
    maybeCompat.weatherSettings = {};
  }

  if (!isRecord(maybeCompat.uiSettings)) {
    maybeCompat.uiSettings = { activeTab: "today", compactMode: true };
  }

  if (isRecord(maybeCompat.uiSettings) && typeof maybeCompat.uiSettings.defaultMoonSystemInitialized !== "boolean") {
    delete maybeCompat.uiSettings.defaultMoonSystemInitialized;
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
        const numericRange = (value: unknown, fallback: { min: number; average: number; max: number }) =>
          isRecord(value)
            ? {
                min: typeof value.min === "number" ? value.min : fallback.min,
                average: typeof value.average === "number" ? value.average : fallback.average,
                max: typeof value.max === "number" ? value.max : fallback.max
              }
            : fallback;
        next.weatherProfile = normalizeSeasonWeatherProfile({
          temperature: numericRange(wp.temperature, { min: 0, average: 10, max: 20 }),
          windSpeed: numericRange(wp.windSpeed, { min: 0, average: 15, max: 40 }),
          rain: numericRange(wp.rain, { min: 0, average: 2, max: 10 })
        });
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
                ((condition.type === "state" &&
                  (condition.state === "clear" ||
                    condition.state === "cloudy" ||
                    condition.state === "overcast" ||
                    condition.state === "fog" ||
                    condition.state === "lightRain" ||
                    condition.state === "heavyRain" ||
                    condition.state === "storm" ||
                    condition.state === "snow" ||
                    condition.state === "strongWind" ||
                    condition.state === "tempest")) ||
                  ((condition.type === undefined || condition.type === "metric") &&
                    (condition.metric === "temperature" || condition.metric === "windSpeed" || condition.metric === "rain") &&
                    (condition.operator === "gte" || condition.operator === "lte") &&
                    typeof condition.value === "number" &&
                    Number.isFinite(condition.value)))
            );
        } else {
          next.conditions = [];
        }
        if (typeof next.enabled !== "boolean") delete next.enabled;
        if (typeof next.requireAllConditions !== "boolean") delete next.requireAllConditions;
        if (typeof next.summary !== "string") delete next.summary;
        if (typeof next.link !== "string") delete next.link;
        if (typeof next.icon !== "string") delete next.icon;
        return next;
      });
  }

  const validation = validateImportedCalendarProject(maybeCompat);
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
