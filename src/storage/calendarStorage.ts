import type { CalendarProject } from "../domain/types";
import { createDefaultMoonSystem } from "../calendar/moonLogic";
import { sanitizeCalendarProject, validateImportedCalendarProject } from "../importExport/calendarImportExport";

const STORAGE_KEY = "calendar-obr.project.local-dev";

const defaultProject: CalendarProject = {
  schemaVersion: 1,
  appVersion: "0.1.0",
  id: "default-calendar",
  name: "Calendrier de campagne",
  locale: "fr",
  units: { temperature: "celsius", windSpeed: "kmh", rain: "mm" },
  currentTime: { absoluteDay: 0, hour: 8, minute: 0 },
  calendarSystem: {
    eraName: "AR",
    startYear: 1000,
    firstWeekdayOffset: 0,
    months: [
      { id: "month-1", name: "Mois 1", order: 1, days: 30 },
      { id: "month-2", name: "Mois 2", order: 2, days: 30 }
    ],
    weekdays: [
      { id: "day-1", name: "Jour 1", order: 1 },
      { id: "day-2", name: "Jour 2", order: 2 },
      { id: "day-3", name: "Jour 3", order: 3 },
      { id: "day-4", name: "Jour 4", order: 4 },
      { id: "day-5", name: "Jour 5", order: 5 },
      { id: "day-6", name: "Jour 6", order: 6 },
      { id: "day-7", name: "Jour 7", order: 7 }
    ]
  },
  events: [],
  seasons: [],
  moons: createDefaultMoonSystem("fr"),
  weatherSettings: {},
  weatherEvents: [],
  uiSettings: { activeTab: "today", compactMode: true }
};

export const createDefaultCalendarProject = (): CalendarProject => structuredClone(defaultProject);

const safeStorage = (): Storage | undefined => {
  if (typeof localStorage === "undefined") return undefined;
  return localStorage;
};

export const loadCalendarProject = (storageKey = STORAGE_KEY): CalendarProject => {
  const storage = safeStorage();
  if (!storage) return createDefaultCalendarProject();

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return createDefaultCalendarProject();
    const parsed = JSON.parse(raw) as unknown;
    const sanitized = sanitizeCalendarProject(parsed);
    if (!sanitized.ok) return createDefaultCalendarProject();
    return sanitized.project;
  } catch {
    return createDefaultCalendarProject();
  }
};

export const saveCalendarProject = (project: CalendarProject, storageKey = STORAGE_KEY): { ok: true } | { ok: false; error: string } => {
  const validation = validateImportedCalendarProject(project);
  if (!validation.valid) return { ok: false, error: validation.error };

  const storage = safeStorage();
  if (!storage) return { ok: false, error: "localStorage unavailable" };

  try {
    storage.setItem(storageKey, JSON.stringify(project));
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to persist project." };
  }
};

export const resetCalendarProject = (storageKey = STORAGE_KEY): CalendarProject => {
  const project = createDefaultCalendarProject();
  const storage = safeStorage();
  if (storage) {
    storage.removeItem(storageKey);
    storage.setItem(storageKey, JSON.stringify(project));
  }
  return project;
};

export const CALENDAR_STORAGE_KEY = STORAGE_KEY;