import type { CalendarPack, CalendarProject, LocaleCode } from "../domain/types";
import { sanitizeCalendarProject, validateImportedCalendarProject } from "../importExport/calendarImportExport";
import { defaultFantasyCalendarPackEn, defaultFantasyCalendarPackFr } from "./defaultFantasyCalendarPack";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isLocale = (value: unknown): value is LocaleCode => value === "fr" || value === "en";

const BUILT_IN_PACKS: CalendarPack[] = [defaultFantasyCalendarPackFr, defaultFantasyCalendarPackEn];

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export type CalendarPackSummary = {
  months: number;
  seasons: number;
  moons: number;
  weatherEvents: number;
};

export const getBuiltInCalendarPacks = (locale: LocaleCode): CalendarPack[] =>
  (() => {
    const localized = BUILT_IN_PACKS.filter((pack) => pack.locale === locale);
    if (localized.length > 0) return localized;
    return BUILT_IN_PACKS.filter((pack) => pack.locale === "fr");
  })();

export const validateCalendarPack = (
  pack: unknown
): { ok: true; pack: CalendarPack } | { ok: false; error: string } => {
  if (!isRecord(pack)) return { ok: false, error: "Invalid pack payload." };
  if (typeof pack.schemaVersion !== "number") return { ok: false, error: "pack.schemaVersion must be a number." };
  if (typeof pack.packId !== "string" || pack.packId.trim().length === 0) {
    return { ok: false, error: "pack.packId is required and must be a non-empty string." };
  }
  if (typeof pack.packVersion !== "string" || pack.packVersion.trim().length === 0) {
    return { ok: false, error: "pack.packVersion is required and must be a non-empty string." };
  }
  if (typeof pack.name !== "string" || pack.name.trim().length === 0) {
    return { ok: false, error: "pack.name is required and must be a non-empty string." };
  }
  if (!isLocale(pack.locale)) return { ok: false, error: "pack.locale must be 'fr' or 'en'." };

  if (typeof pack.description !== "undefined" && typeof pack.description !== "string") {
    return { ok: false, error: "pack.description must be a string when provided." };
  }
  if (typeof pack.author !== "undefined" && typeof pack.author !== "string") {
    return { ok: false, error: "pack.author must be a string when provided." };
  }

  const sanitizedProject = sanitizeCalendarProject(pack.project);
  if (!sanitizedProject.ok) return { ok: false, error: sanitizedProject.error };

  const validation = validateImportedCalendarProject(sanitizedProject.project);
  if (!validation.valid) return { ok: false, error: validation.error };

  return {
    ok: true,
    pack: {
      ...(pack as Omit<CalendarPack, "project">),
      project: sanitizedProject.project
    }
  };
};

export const getCalendarPackSummary = (pack: CalendarPack): CalendarPackSummary => ({
  months: pack.project.calendarSystem.months.length,
  seasons: pack.project.seasons.length,
  moons: pack.project.moons.length,
  weatherEvents: pack.project.weatherEvents.length
});

export const importCalendarPack = (
  pack: unknown,
  currentProject: CalendarProject
): { ok: true; project: CalendarProject } | { ok: false; error: string; project: CalendarProject } => {
  const validated = validateCalendarPack(pack);
  if (!validated.ok) return { ok: false, error: validated.error, project: currentProject };
  return { ok: true, project: validated.pack.project };
};

export const createCalendarPackFromProject = (
  project: CalendarProject,
  metadata: {
    packId?: string;
    packVersion?: string;
    name?: string;
    description?: string;
    author?: string;
  }
): CalendarPack => {
  const rawName = metadata.name?.trim() || project.name.trim() || "Calendar Pack";
  const generatedIdBase = slugify(rawName) || slugify(project.name) || "calendar-pack";
  const packId = metadata.packId?.trim() || `pack-${generatedIdBase}`;
  const packVersion = metadata.packVersion?.trim() || "1.0.0";

  return {
    schemaVersion: 1,
    packId,
    packVersion,
    name: rawName,
    description: metadata.description?.trim() || undefined,
    author: metadata.author?.trim() || undefined,
    locale: project.locale,
    project: structuredClone(project)
  };
};

export const exportCalendarPack = (pack: CalendarPack): string => JSON.stringify(pack, null, 2);
