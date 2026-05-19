import type { CalendarProject } from "../domain/types";
import { assertCalendarSystem } from "../calendar/dateEngine";

export const validateImportedCalendarProject = (data: unknown): { valid: true; project: CalendarProject } | { valid: false; error: string } => {
  if (!data || typeof data !== "object") return { valid: false, error: "Invalid JSON payload." };
  const project = data as Partial<CalendarProject>;

  if (typeof project.schemaVersion !== "number") return { valid: false, error: "schemaVersion is required." };
  if (typeof project.appVersion !== "string") return { valid: false, error: "appVersion is required." };
  if (!project.calendarSystem) return { valid: false, error: "calendarSystem is required." };

  try {
    assertCalendarSystem(project.calendarSystem);
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }

  return { valid: true, project: project as CalendarProject };
};

export const exportCalendarProject = (project: CalendarProject): string => JSON.stringify(project, null, 2);

export const importCalendarProject = (
  input: string,
  currentProject: CalendarProject
): { ok: true; project: CalendarProject } | { ok: false; error: string; project: CalendarProject } => {
  try {
    const parsed = JSON.parse(input) as unknown;
    const validation = validateImportedCalendarProject(parsed);
    if (!validation.valid) {
      return { ok: false, error: validation.error, project: currentProject };
    }

    return { ok: true, project: validation.project };
  } catch {
    return { ok: false, error: "Invalid JSON file.", project: currentProject };
  }
};
