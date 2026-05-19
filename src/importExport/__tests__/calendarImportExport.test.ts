import { describe, expect, it, vi } from "vitest";
import { createDefaultCalendarProject, loadCalendarProject, CALENDAR_STORAGE_KEY } from "../../storage/calendarStorage";
import { exportCalendarProject, importCalendarProject, validateImportedCalendarProject } from "../calendarImportExport";

describe("calendarImportExport", () => {
  it("accepts a complete valid JSON import", () => {
    const project = createDefaultCalendarProject();
    const result = importCalendarProject(JSON.stringify(project), project);
    expect(result.ok).toBe(true);
  });

  it("exports then imports default project", () => {
    const project = createDefaultCalendarProject();
    const exported = exportCalendarProject(project);
    const imported = importCalendarProject(exported, project);
    expect(imported.ok).toBe(true);
    if (imported.ok) expect(imported.project).toEqual(project);
  });

  it("rejects when id is missing", () => {
    const project = createDefaultCalendarProject();
    expect(validateImportedCalendarProject({ ...project, id: "" }).valid).toBe(false);
  });

  it("rejects when name is missing", () => {
    const project = createDefaultCalendarProject();
    expect(validateImportedCalendarProject({ ...project, name: "" }).valid).toBe(false);
  });

  it("rejects invalid locale", () => {
    const project = createDefaultCalendarProject();
    expect(validateImportedCalendarProject({ ...project, locale: "es" }).valid).toBe(false);
  });

  it("rejects when currentTime is missing", () => {
    const project = createDefaultCalendarProject() as Record<string, unknown>;
    delete project.currentTime;
    expect(validateImportedCalendarProject(project).valid).toBe(false);
  });

  it("rejects when events is not an array", () => {
    const project = createDefaultCalendarProject() as Record<string, unknown>;
    project.events = {};
    expect(validateImportedCalendarProject(project).valid).toBe(false);
  });

  it("rejects duplicated month ids", () => {
    const project = createDefaultCalendarProject();
    project.calendarSystem.months = [
      { id: "dup", name: "A", order: 1, days: 30 },
      { id: "dup", name: "B", order: 2, days: 20 }
    ];
    expect(validateImportedCalendarProject(project).valid).toBe(false);
  });

  it("loadCalendarProject returns default project with invalid localStorage JSON", () => {
    const getItem = vi.fn(() => "{invalid json");
    vi.stubGlobal("localStorage", { getItem, setItem: vi.fn(), removeItem: vi.fn() });

    const loaded = loadCalendarProject();
    expect(loaded).toEqual(createDefaultCalendarProject());
    expect(getItem).toHaveBeenCalledWith(CALENDAR_STORAGE_KEY);

    vi.unstubAllGlobals();
  });
});
