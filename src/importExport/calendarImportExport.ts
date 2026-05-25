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
  if (data.dayNotes !== undefined && !Array.isArray(data.dayNotes)) return { valid: false, error: "dayNotes must be an array." };
  if (!Array.isArray(data.seasons)) return { valid: false, error: "seasons must be an array." };
  if (!Array.isArray(data.moons)) return { valid: false, error: "moons must be an array." };
  if (data.moonEvents !== undefined && !Array.isArray(data.moonEvents)) return { valid: false, error: "moonEvents must be an array." };
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
    dayNotes: Array.isArray(data.dayNotes) ? data.dayNotes : [],
    moonEvents: Array.isArray(data.moonEvents) ? data.moonEvents : [],
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
        const optionalNumber = (value: unknown): number | undefined =>
          typeof value === "number" && Number.isFinite(value) ? value : undefined;
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
      return next;
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
                (condition.type === "dominantState" &&
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
              if (entry.weatherState === "clear" || entry.weatherState === "cloudy" || entry.weatherState === "overcast" || entry.weatherState === "fog" || entry.weatherState === "lightRain" || entry.weatherState === "heavyRain" || entry.weatherState === "storm" || entry.weatherState === "snow" || entry.weatherState === "strongWind" || entry.weatherState === "tempest") out.weatherState = entry.weatherState;
              if (entry.dominantState === "clear" || entry.dominantState === "cloudy" || entry.dominantState === "overcast" || entry.dominantState === "fog" || entry.dominantState === "lightRain" || entry.dominantState === "heavyRain" || entry.dominantState === "storm" || entry.dominantState === "snow" || entry.dominantState === "strongWind" || entry.dominantState === "tempest") out.dominantState = entry.dominantState;
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
