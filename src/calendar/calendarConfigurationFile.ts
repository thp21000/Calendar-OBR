import type { CalendarCurrentTime, CalendarEvent, CalendarProject, CalendarSystem, DayNote, LocaleCode, Moon, MoonEvent, PlayerViewSettings, SceneWeatherProfile, Season, UiSettings, UnitsSettings, WeatherAdvancedSettings, WeatherEvent, WeatherSettings } from "../domain/types";
import type { WeatherBiomeId, WeatherBiomeProfile } from "./weather/biomes";
import { sanitizeCalendarProject } from "../importExport/calendarImportExport";
import { createDefaultCalendarProject } from "../storage/calendarStorage";

export const CALENDAR_CONFIGURATION_KIND = "calendar-obr.configuration" as const;
export const CALENDAR_CUSTOM_EXPORT_KIND = "calendar-obr.custom-export" as const;
export const CALENDAR_CONFIGURATION_SCHEMA_VERSION = 1 as const;

export const CALENDAR_SECTION_IDS = [
  "calendarSystem",
  "seasons",
  "moons",
  "moonEvents",
  "weather",
  "biomes",
  "weatherProfiles",
  "weatherStates",
  "weatherTrends",
  "weatherDominance",
  "weatherEvents",
  "units",
  "dateTimeFormats",
  "playerView",
  "campaignEvents",
  "dayNotes",
  "currentTime"
] as const;

export type CalendarSectionId = typeof CALENDAR_SECTION_IDS[number];
export type CalendarSectionMap = Partial<Record<CalendarSectionId, unknown>>;

export const CONFIGURATION_SECTION_IDS: CalendarSectionId[] = [
  "calendarSystem",
  "seasons",
  "moons",
  "moonEvents",
  "weather",
  "biomes",
  "weatherProfiles",
  "weatherStates",
  "weatherTrends",
  "weatherDominance",
  "weatherEvents",
  "units",
  "dateTimeFormats",
  "playerView"
];

export const CAMPAIGN_SECTION_IDS: CalendarSectionId[] = ["campaignEvents", "dayNotes", "currentTime"];

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

export type CalendarCustomExportFile = {
  kind: typeof CALENDAR_CUSTOM_EXPORT_KIND;
  schemaVersion: typeof CALENDAR_CONFIGURATION_SCHEMA_VERSION;
  exportedAt: string;
  name: string;
  description?: string;
  sections: CalendarSectionMap;
};

type BuildOptions = { name?: string; description?: string; exportedAt?: string };
type ApplyOptions = { name?: string };
type ValidationResult = { ok: true; file: CalendarConfigurationFile } | { ok: false; error: string };
type CustomValidationResult = { ok: true; file: CalendarCustomExportFile } | { ok: false; error: string };

export type CalendarImportFile =
  | { type: "project"; project: CalendarProject; sections: CalendarSectionMap; availableSectionIds: CalendarSectionId[]; defaultSelectedSectionIds: CalendarSectionId[]; requiresFullProjectConfirmation: true }
  | { type: "configuration"; file: CalendarConfigurationFile; sections: CalendarSectionMap; availableSectionIds: CalendarSectionId[]; defaultSelectedSectionIds: CalendarSectionId[]; requiresFullProjectConfirmation: false }
  | { type: "custom"; file: CalendarCustomExportFile; sections: CalendarSectionMap; availableSectionIds: CalendarSectionId[]; defaultSelectedSectionIds: CalendarSectionId[]; requiresFullProjectConfirmation: false };

const clone = <T>(value: T): T => structuredClone(value);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isSectionId = (value: string): value is CalendarSectionId => (CALENDAR_SECTION_IDS as readonly string[]).includes(value);
const selected = (selectedSectionIds: Iterable<CalendarSectionId>): Set<CalendarSectionId> => new Set(selectedSectionIds);

const buildReusableUiSettings = (project: CalendarProject): CalendarConfigurationPayload["uiSettings"] => ({
  compactMode: project.uiSettings.compactMode,
  monthGridStartsOnWeekdayId: project.uiSettings.monthGridStartsOnWeekdayId,
  dateFormat: project.uiSettings.dateFormat,
  timeFormat: project.uiSettings.timeFormat,
  defaultMoonSystemInitialized: project.uiSettings.defaultMoonSystemInitialized,
  playerView: project.uiSettings.playerView ? clone(project.uiSettings.playerView) : undefined
});

export const buildProjectSections = (project: CalendarProject): CalendarSectionMap => ({
  calendarSystem: clone(project.calendarSystem),
  seasons: clone(project.seasons),
  moons: clone(project.moons),
  moonEvents: clone(project.moonEvents ?? []),
  weather: clone({ weatherSettings: project.weatherSettings, weatherBiome: project.weatherBiome }),
  biomes: clone({ weatherBiome: project.weatherBiome, weatherBiomeProfiles: project.weatherBiomeProfiles }),
  weatherProfiles: clone({ weatherBiomeProfiles: project.weatherBiomeProfiles, sceneWeatherProfiles: project.sceneWeatherProfiles }),
  weatherStates: clone(project.weatherAdvancedSettings?.stateConfigs ?? {}),
  weatherTrends: clone(project.weatherAdvancedSettings?.trendConfigs ?? {}),
  weatherDominance: clone(project.weatherAdvancedSettings?.dominanceConfigs ?? {}),
  weatherEvents: clone(project.weatherEvents),
  units: clone(project.units),
  dateTimeFormats: clone({ dateFormat: project.uiSettings.dateFormat, timeFormat: project.uiSettings.timeFormat, compactMode: project.uiSettings.compactMode, monthGridStartsOnWeekdayId: project.uiSettings.monthGridStartsOnWeekdayId }),
  playerView: clone(project.uiSettings.playerView),
  campaignEvents: clone(project.events),
  dayNotes: clone(project.dayNotes ?? []),
  currentTime: clone(project.currentTime)
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

export const configurationFileToSections = (file: CalendarConfigurationFile): CalendarSectionMap => buildProjectSections(configurationToProject(file, createDefaultCalendarProject()));

export const applyCalendarSections = (
  project: CalendarProject,
  sections: CalendarSectionMap,
  selectedSectionIds: Iterable<CalendarSectionId>,
  options: ApplyOptions = {}
): { ok: true; project: CalendarProject } | { ok: false; error: string; project: CalendarProject } => {
  const ids = selected(selectedSectionIds);
  if (ids.size === 0) return { ok: false, error: "No section selected.", project };
  const next: CalendarProject = clone(project);
  if (options.name) next.name = options.name;
  if (ids.has("calendarSystem") && sections.calendarSystem) next.calendarSystem = clone(sections.calendarSystem as CalendarSystem);
  if (ids.has("seasons") && sections.seasons) next.seasons = clone(sections.seasons as Season[]);
  if (ids.has("moons") && sections.moons) next.moons = clone(sections.moons as Moon[]);
  if (ids.has("moonEvents") && sections.moonEvents) next.moonEvents = clone(sections.moonEvents as MoonEvent[]);
  if (ids.has("weather") && isRecord(sections.weather)) {
    const weather = sections.weather as { weatherSettings?: WeatherSettings; weatherBiome?: CalendarProject["weatherBiome"] };
    if (weather.weatherSettings) next.weatherSettings = clone(weather.weatherSettings);
    next.weatherBiome = weather.weatherBiome ? clone(weather.weatherBiome) : undefined;
  }
  if (ids.has("biomes") && isRecord(sections.biomes)) {
    const biomes = sections.biomes as { weatherBiome?: CalendarProject["weatherBiome"]; weatherBiomeProfiles?: Partial<Record<WeatherBiomeId, WeatherBiomeProfile>> };
    next.weatherBiome = biomes.weatherBiome ? clone(biomes.weatherBiome) : next.weatherBiome;
    next.weatherBiomeProfiles = biomes.weatherBiomeProfiles ? clone(biomes.weatherBiomeProfiles) : undefined;
  }
  if (ids.has("weatherProfiles") && isRecord(sections.weatherProfiles)) {
    const profiles = sections.weatherProfiles as { weatherBiomeProfiles?: Partial<Record<WeatherBiomeId, WeatherBiomeProfile>>; sceneWeatherProfiles?: SceneWeatherProfile[] };
    next.weatherBiomeProfiles = profiles.weatherBiomeProfiles ? clone(profiles.weatherBiomeProfiles) : next.weatherBiomeProfiles;
    next.sceneWeatherProfiles = profiles.sceneWeatherProfiles ? clone(profiles.sceneWeatherProfiles) : undefined;
  }
  const advanced: WeatherAdvancedSettings = { ...(next.weatherAdvancedSettings ?? {}) };
  let changedAdvanced = false;
  if (ids.has("weatherStates")) { advanced.stateConfigs = isRecord(sections.weatherStates) ? clone(sections.weatherStates as WeatherAdvancedSettings["stateConfigs"]) : undefined; changedAdvanced = true; }
  if (ids.has("weatherTrends")) { advanced.trendConfigs = isRecord(sections.weatherTrends) ? clone(sections.weatherTrends as WeatherAdvancedSettings["trendConfigs"]) : undefined; changedAdvanced = true; }
  if (ids.has("weatherDominance")) { advanced.dominanceConfigs = isRecord(sections.weatherDominance) ? clone(sections.weatherDominance as WeatherAdvancedSettings["dominanceConfigs"]) : undefined; changedAdvanced = true; }
  if (changedAdvanced) next.weatherAdvancedSettings = advanced;
  if (ids.has("weatherEvents") && sections.weatherEvents) next.weatherEvents = clone(sections.weatherEvents as WeatherEvent[]);
  if (ids.has("units") && sections.units) next.units = clone(sections.units as UnitsSettings);
  if (ids.has("dateTimeFormats") && isRecord(sections.dateTimeFormats)) {
    const formats = sections.dateTimeFormats as Partial<UiSettings>;
    next.uiSettings = { ...next.uiSettings, compactMode: formats.compactMode ?? next.uiSettings.compactMode, monthGridStartsOnWeekdayId: formats.monthGridStartsOnWeekdayId, dateFormat: formats.dateFormat, timeFormat: formats.timeFormat };
  }
  if (ids.has("playerView")) next.uiSettings = { ...next.uiSettings, playerView: sections.playerView ? clone(sections.playerView as PlayerViewSettings) : undefined };
  if (ids.has("campaignEvents") && sections.campaignEvents) next.events = clone(sections.campaignEvents as CalendarEvent[]);
  if (ids.has("dayNotes") && sections.dayNotes) next.dayNotes = clone(sections.dayNotes as DayNote[]);
  if (ids.has("currentTime") && sections.currentTime) next.currentTime = clone(sections.currentTime as CalendarCurrentTime);
  const sanitized = sanitizeCalendarProject(next);
  if (!sanitized.ok) return { ok: false, error: sanitized.error, project };
  return { ok: true, project: sanitized.project };
};

export const applyCalendarConfigurationFile = (project: CalendarProject, file: CalendarConfigurationFile, options: ApplyOptions = {}) =>
  applyCalendarSections(project, configurationFileToSections(file), CONFIGURATION_SECTION_IDS, options);

export const buildCalendarCustomExportFile = (project: CalendarProject, selectedSectionIds: Iterable<CalendarSectionId>, options: BuildOptions = {}): CalendarCustomExportFile => {
  const ids = selected(selectedSectionIds);
  const allSections = buildProjectSections(project);
  const sections: CalendarSectionMap = {};
  for (const id of CALENDAR_SECTION_IDS) if (ids.has(id) && allSections[id] !== undefined) sections[id] = clone(allSections[id]);
  return {
    kind: CALENDAR_CUSTOM_EXPORT_KIND,
    schemaVersion: CALENDAR_CONFIGURATION_SCHEMA_VERSION,
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    name: options.name?.trim() || project.name,
    ...(options.description?.trim() ? { description: options.description.trim() } : {}),
    sections
  };
};

export const validateCalendarCustomExportFile = (input: unknown): CustomValidationResult => {
  if (!isRecord(input)) return { ok: false, error: "Invalid custom export file: expected a JSON object." };
  if (input.kind !== CALENDAR_CUSTOM_EXPORT_KIND) return { ok: false, error: "Invalid custom export file: unsupported kind." };
  if (input.schemaVersion !== CALENDAR_CONFIGURATION_SCHEMA_VERSION) return { ok: false, error: "Invalid custom export file: unsupported schemaVersion." };
  if (!isRecord(input.sections)) return { ok: false, error: "Invalid custom export file: missing sections." };
  const sections: CalendarSectionMap = {};
  for (const [key, value] of Object.entries(input.sections)) if (isSectionId(key)) sections[key] = clone(value);
  return {
    ok: true,
    file: {
      kind: CALENDAR_CUSTOM_EXPORT_KIND,
      schemaVersion: CALENDAR_CONFIGURATION_SCHEMA_VERSION,
      exportedAt: typeof input.exportedAt === "string" ? input.exportedAt : new Date(0).toISOString(),
      name: typeof input.name === "string" && input.name.trim() ? input.name.trim() : createDefaultCalendarProject().name,
      ...(typeof input.description === "string" && input.description.trim() ? { description: input.description.trim() } : {}),
      sections
    }
  };
};

export const applyCalendarCustomExportFile = (project: CalendarProject, file: CalendarCustomExportFile, selectedSectionIds: Iterable<CalendarSectionId>) => {
  const validation = validateCalendarCustomExportFile(file);
  if (!validation.ok) return { ok: false as const, error: validation.error, project };
  return applyCalendarSections(project, validation.file.sections, selectedSectionIds);
};

export const readCalendarImportFileFromText = (text: string): { ok: true; importFile: CalendarImportFile } | { ok: false; error: string } => {
  let parsed: unknown;
  try { parsed = JSON.parse(text) as unknown; } catch { return { ok: false, error: "Invalid JSON file." }; }
  if (isRecord(parsed) && parsed.kind === CALENDAR_CONFIGURATION_KIND) {
    const normalized = normalizeCalendarConfigurationFile(parsed);
    if (!normalized.ok) return { ok: false, error: normalized.error };
    const sections = configurationFileToSections(normalized.file);
    return { ok: true, importFile: { type: "configuration", file: normalized.file, sections, availableSectionIds: CONFIGURATION_SECTION_IDS.filter((id) => sections[id] !== undefined), defaultSelectedSectionIds: [...CONFIGURATION_SECTION_IDS], requiresFullProjectConfirmation: false } };
  }
  if (isRecord(parsed) && parsed.kind === CALENDAR_CUSTOM_EXPORT_KIND) {
    const validation = validateCalendarCustomExportFile(parsed);
    if (!validation.ok) return { ok: false, error: validation.error };
    const available = CALENDAR_SECTION_IDS.filter((id) => validation.file.sections[id] !== undefined);
    return { ok: true, importFile: { type: "custom", file: validation.file, sections: validation.file.sections, availableSectionIds: available, defaultSelectedSectionIds: available, requiresFullProjectConfirmation: false } };
  }
  const sanitized = sanitizeCalendarProject(parsed);
  if (sanitized.ok) {
    const sections = buildProjectSections(sanitized.project);
    return { ok: true, importFile: { type: "project", project: sanitized.project, sections, availableSectionIds: [...CALENDAR_SECTION_IDS], defaultSelectedSectionIds: [...CALENDAR_SECTION_IDS], requiresFullProjectConfirmation: true } };
  }
  return { ok: false, error: "Unrecognized file." };
};

export const readCalendarConfigurationFileFromText = (text: string): ValidationResult => {
  const detected = readCalendarImportFileFromText(text);
  if (!detected.ok) return { ok: false, error: detected.error };
  return detected.importFile.type === "configuration" ? { ok: true, file: detected.importFile.file } : { ok: false, error: "Invalid configuration file: unsupported kind." };
};

export const exportCalendarConfigurationFile = (project: CalendarProject, options: BuildOptions = {}): string => JSON.stringify(buildCalendarConfigurationFile(project, options), null, 2);
export const exportCalendarCustomExportFile = (project: CalendarProject, selectedSectionIds: Iterable<CalendarSectionId>, options: BuildOptions = {}): string => JSON.stringify(buildCalendarCustomExportFile(project, selectedSectionIds, options), null, 2);
export const buildCalendarConfigurationFileName = (date = new Date()): string => `calendar-obr-configuration-${date.toISOString().slice(0, 10)}.json`;
export const buildCalendarProjectFileName = (date = new Date()): string => `calendar-obr-project-${date.toISOString().slice(0, 10)}.json`;
export const buildCalendarCustomExportFileName = (date = new Date()): string => `calendar-obr-custom-export-${date.toISOString().slice(0, 10)}.json`;

export const downloadJsonFile = (json: string, fileName: string): void => {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadCalendarConfigurationFile = (project: CalendarProject): void => downloadJsonFile(exportCalendarConfigurationFile(project), buildCalendarConfigurationFileName());