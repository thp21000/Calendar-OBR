import type { CalendarProject, LocaleCode } from "../domain/types";
import { assertCalendarSystem } from "../calendar/dateEngine";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

  const isLocale = (value: unknown): value is LocaleCode => value === "fr" || value === "en";
  
  const isValidUiTab = (value: unknown): value is CalendarProject["uiSettings"]["activeTab"] =>
  value === "today" || value === "month" || value === "events" || value === "settings";

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
