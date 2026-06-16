import type { CalendarProject, CalendarSystem, LocaleCode, Moon, MoonEvent, PlayerViewSettings, SceneWeatherProfile, Season, UiSettings, UnitsSettings, WeatherAdvancedSettings, WeatherEvent, WeatherSettings } from "../domain/types";
import type { WeatherBiomeId, WeatherBiomeProfile } from "./weather/biomes";
import { sanitizeCalendarProject } from "../importExport/calendarImportExport";
import { createDefaultCalendarProject } from "../storage/calendarStorage";

export const CALENDAR_CONFIGURATION_KIND = "calendar-obr.configuration" as const;
export const CALENDAR_CONFIGURATION_SCHEMA_VERSION = 1 as const;

export type CalendarConfigurationPayload = {
  locale?: LocaleCode;
  calendarSystem: CalendarSystem;
  seasons: Season[];
  moons: Moon[];
  moonEvents?: MoonEvent[];
  units: UnitsSettings;
  weatherSettings: WeatherSettings;
  weatherAdvancedSettings?: WeatherAdvancedSettings;
  weatherEvents: WeatherEvent[];
  weatherBiome?: CalendarProject["weatherBiome"];
  weatherBiomeProfiles?: Partial<Record<WeatherBiomeId, WeatherBiomeProfile>>;
  sceneWeatherProfiles?: SceneWeatherProfile[];
  uiSettings: Pick<UiSettings, "compactMode" | "monthGridStartsOnWeekdayId" | "dateFormat" | "timeFormat" | "defaultMoonSystemInitialized" | "playerView"> & {
    playerView?: PlayerViewSettings;
  };
};

export type CalendarConfigurationFile = {
  kind: typeof CALENDAR_CONFIGURATION_KIND;
  schemaVersion: typeof CALENDAR_CONFIGURATION_SCHEMA_VERSION;
  exportedAt: string;
  name: string;
  description?: string;
  configuration: CalendarConfigurationPayload;
};

type BuildOptions = {
  name?: string;
  description?: string;
  exportedAt?: string;
};

type ApplyOptions = {
  name?: string;
};

type ValidationResult = { ok: true; file: CalendarConfigurationFile } | { ok: false; error: string };

const clone = <T>(value: T): T => structuredClone(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const buildReusableUiSettings = (project: CalendarProject): CalendarConfigurationPayload["uiSettings"] => ({
  compactMode: project.uiSettings.compactMode,
  monthGridStartsOnWeekdayId: project.uiSettings.monthGridStartsOnWeekdayId,
  dateFormat: project.uiSettings.dateFormat,
  timeFormat: project.uiSettings.timeFormat,
  defaultMoonSystemInitialized: project.uiSettings.defaultMoonSystemInitialized,
  playerView: project.uiSettings.playerView ? clone(project.uiSettings.playerView) : undefined
});

export const buildCalendarConfigurationPayload = (project: CalendarProject): CalendarConfigurationPayload => ({
  locale: project.locale,
  calendarSystem: clone(project.calendarSystem),
  seasons: clone(project.seasons),
  moons: clone(project.moons),
  moonEvents: clone(project.moonEvents ?? []),
  units: clone(project.units),
  weatherSettings: clone(project.weatherSettings),
  weatherAdvancedSettings: project.weatherAdvancedSettings ? clone(project.weatherAdvancedSettings) : undefined,
  weatherEvents: clone(project.weatherEvents),
  weatherBiome: project.weatherBiome ? clone(project.weatherBiome) : undefined,
  weatherBiomeProfiles: project.weatherBiomeProfiles ? clone(project.weatherBiomeProfiles) : undefined,
  sceneWeatherProfiles: project.sceneWeatherProfiles ? clone(project.sceneWeatherProfiles) : undefined,
  uiSettings: buildReusableUiSettings(project)
});

export const buildCalendarConfigurationFile = (project: CalendarProject, options: BuildOptions = {}): CalendarConfigurationFile => ({
  kind: CALENDAR_CONFIGURATION_KIND,
  schemaVersion: CALENDAR_CONFIGURATION_SCHEMA_VERSION,
  exportedAt: options.exportedAt ?? new Date().toISOString(),
  name: options.name?.trim() || project.name,
  ...(options.description?.trim() ? { description: options.description.trim() } : {}),
  configuration: buildCalendarConfigurationPayload(project)
});

const configurationToProject = (file: CalendarConfigurationFile, baseProject: CalendarProject): CalendarProject => {
  const configuration = file.configuration;
  return {
    ...baseProject,
    name: file.name || baseProject.name,
    locale: configuration.locale ?? baseProject.locale,
    units: clone(configuration.units),
    calendarSystem: clone(configuration.calendarSystem),
    seasons: clone(configuration.seasons),
    moons: clone(configuration.moons),
    moonEvents: clone(configuration.moonEvents ?? []),
    weatherSettings: clone(configuration.weatherSettings),
    weatherAdvancedSettings: configuration.weatherAdvancedSettings ? clone(configuration.weatherAdvancedSettings) : undefined,
    weatherEvents: clone(configuration.weatherEvents),
    weatherBiome: configuration.weatherBiome ? clone(configuration.weatherBiome) : undefined,
    weatherBiomeProfiles: configuration.weatherBiomeProfiles ? clone(configuration.weatherBiomeProfiles) : undefined,
    sceneWeatherProfiles: configuration.sceneWeatherProfiles ? clone(configuration.sceneWeatherProfiles) : undefined,
    uiSettings: {
      ...baseProject.uiSettings,
      compactMode: configuration.uiSettings.compactMode,
      monthGridStartsOnWeekdayId: configuration.uiSettings.monthGridStartsOnWeekdayId,
      dateFormat: configuration.uiSettings.dateFormat,
      timeFormat: configuration.uiSettings.timeFormat,
      defaultMoonSystemInitialized: configuration.uiSettings.defaultMoonSystemInitialized,
      playerView: configuration.uiSettings.playerView ? clone(configuration.uiSettings.playerView) : undefined
    }
  };
};

export const normalizeCalendarConfigurationFile = (input: unknown): ValidationResult => {
  if (!isRecord(input)) return { ok: false, error: "Invalid configuration file: expected a JSON object." };
  if (input.kind !== CALENDAR_CONFIGURATION_KIND) return { ok: false, error: "Invalid configuration file: unsupported kind." };
  if (input.schemaVersion !== CALENDAR_CONFIGURATION_SCHEMA_VERSION) return { ok: false, error: "Invalid configuration file: unsupported schemaVersion." };
  if (!isRecord(input.configuration)) return { ok: false, error: "Invalid configuration file: missing configuration payload." };

  const baseProject = createDefaultCalendarProject();
  const rawFile = input as Partial<CalendarConfigurationFile>;
  const candidateFile: CalendarConfigurationFile = {
    kind: CALENDAR_CONFIGURATION_KIND,
    schemaVersion: CALENDAR_CONFIGURATION_SCHEMA_VERSION,
    exportedAt: typeof rawFile.exportedAt === "string" ? rawFile.exportedAt : new Date(0).toISOString(),
    name: typeof rawFile.name === "string" && rawFile.name.trim() ? rawFile.name.trim() : baseProject.name,
    ...(typeof rawFile.description === "string" && rawFile.description.trim() ? { description: rawFile.description.trim() } : {}),
    configuration: {
      ...buildCalendarConfigurationPayload(baseProject),
      ...(input.configuration as Partial<CalendarConfigurationPayload>),
      uiSettings: {
        ...buildReusableUiSettings(baseProject),
        ...(isRecord((input.configuration as Record<string, unknown>).uiSettings) ? (input.configuration as Record<string, unknown>).uiSettings as Partial<CalendarConfigurationPayload["uiSettings"]> : {})
      }
    } as CalendarConfigurationPayload
  };

  const sanitized = sanitizeCalendarProject(configurationToProject(candidateFile, baseProject));
  if (!sanitized.ok) return { ok: false, error: `Invalid configuration file: ${sanitized.error}` };
  return { ok: true, file: buildCalendarConfigurationFile(sanitized.project, { name: candidateFile.name, description: candidateFile.description, exportedAt: candidateFile.exportedAt }) };
};

export const validateCalendarConfigurationFile = (input: unknown): ValidationResult => normalizeCalendarConfigurationFile(input);

export const applyCalendarConfigurationFile = (
  project: CalendarProject,
  file: CalendarConfigurationFile,
  options: ApplyOptions = {}
): { ok: true; project: CalendarProject } | { ok: false; error: string; project: CalendarProject } => {
  const normalized = normalizeCalendarConfigurationFile(file);
  if (!normalized.ok) return { ok: false, error: normalized.error, project };
  const next = configurationToProject(normalized.file, project);
  next.name = options.name ?? project.name;
  next.currentTime = clone(project.currentTime);
  next.events = clone(project.events);
  next.dayNotes = clone(project.dayNotes ?? []);
  next.weatherOverrides = clone(project.weatherOverrides ?? []);
  next.uiSettings.activeTab = project.uiSettings.activeTab;

  const sanitized = sanitizeCalendarProject(next);
  if (!sanitized.ok) return { ok: false, error: sanitized.error, project };
  return { ok: true, project: sanitized.project };
};

export const readCalendarConfigurationFileFromText = (text: string): ValidationResult => {
  try {
    return normalizeCalendarConfigurationFile(JSON.parse(text) as unknown);
  } catch {
    return { ok: false, error: "Invalid configuration file: invalid JSON." };
  }
};

export const exportCalendarConfigurationFile = (project: CalendarProject, options: BuildOptions = {}): string =>
  JSON.stringify(buildCalendarConfigurationFile(project, options), null, 2);

export const buildCalendarConfigurationFileName = (date = new Date()): string =>
  `calendar-obr-configuration-${date.toISOString().slice(0, 10)}.json`;

export const downloadCalendarConfigurationFile = (project: CalendarProject): void => {
  const json = exportCalendarConfigurationFile(project);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildCalendarConfigurationFileName();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
