import { describe, expect, it, vi } from "vitest";
import {
  CALENDAR_STORAGE_KEY,
  createDefaultCalendarProject,
  loadCalendarProject,
  saveCalendarProject
} from "../../storage/calendarStorage";
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

  it("rejects when currentTime.hour is 24", () => {
    const project = createDefaultCalendarProject();
    project.currentTime.hour = 24;
    expect(validateImportedCalendarProject(project).valid).toBe(false);
  });

  it("rejects when currentTime.hour is -1", () => {
    const project = createDefaultCalendarProject();
    project.currentTime.hour = -1;
    expect(validateImportedCalendarProject(project).valid).toBe(false);
  });

  it("rejects when currentTime.minute is 60", () => {
    const project = createDefaultCalendarProject();
    project.currentTime.minute = 60;
    expect(validateImportedCalendarProject(project).valid).toBe(false);
  });

  it("rejects when currentTime.minute is -1", () => {
    const project = createDefaultCalendarProject();
    project.currentTime.minute = -1;
    expect(validateImportedCalendarProject(project).valid).toBe(false);
  });

  it("rejects when currentTime.absoluteDay is not an integer", () => {
    const project = createDefaultCalendarProject();
    project.currentTime.absoluteDay = 1.5;
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
  
  it("saveCalendarProject refuses invalid project", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { getItem: vi.fn(), setItem, removeItem: vi.fn() });

    const project = createDefaultCalendarProject();
    project.currentTime.hour = 99;

    const saved = saveCalendarProject(project);
    expect(saved.ok).toBe(false);
    expect(setItem).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("exports then imports and keeps moons", () => {
    const project = createDefaultCalendarProject();
    project.moons = [{ id: "moon-1", name: "Selene", icon: "🌙", cycleLengthDays: 33, cycleOffsetDays: -3 }];

    const imported = importCalendarProject(exportCalendarProject(project), project);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.project.moons).toEqual(project.moons);
  });

  it("exports then imports and keeps defaultMoonSystemInitialized", () => {
    const project = createDefaultCalendarProject();
    project.uiSettings.defaultMoonSystemInitialized = true;

    const imported = importCalendarProject(exportCalendarProject(project), project);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.project.uiSettings.defaultMoonSystemInitialized).toBe(true);
  });

  it("sanitizes invalid moon cycleLengthDays to 29.5", () => {
    const project = createDefaultCalendarProject();
    const payload = {
      ...project,
      moons: [{ id: "moon-1", name: "Selene", cycleLengthDays: 0, cycleOffsetDays: 2 }]
    };
    const imported = importCalendarProject(JSON.stringify(payload), project);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.project.moons[0].cycleLengthDays).toBe(29.5);
  });

  it("keeps negative moon cycleOffsetDays", () => {
    const project = createDefaultCalendarProject();
    const payload = {
      ...project,
      moons: [{ id: "moon-1", name: "Selene", cycleLengthDays: 27, cycleOffsetDays: -8 }]
    };
    const imported = importCalendarProject(JSON.stringify(payload), project);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.project.moons[0].cycleOffsetDays).toBe(-8);
  });

  it("exports then imports and keeps season weather profile", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [
      {
        id: "winter",
        name: "Winter",
        icon: "❄️",
        start: { monthId: "month-1", dayOfMonth: 1 },
        end: { monthId: "month-2", dayOfMonth: 30 },
        weatherProfile: {
          temperature: { min: -10, average: -2, max: 4 },
          windSpeed: { min: 3, average: 12, max: 28 },
          rain: { min: 0, average: 2, max: 8 }
        }
      }
    ];

    const imported = importCalendarProject(exportCalendarProject(project), project);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.project.seasons[0].weatherProfile).toEqual(project.seasons[0].weatherProfile);
  });

  it("exports then imports and keeps weatherSettings seed and forecastMode", () => {
    const project = createDefaultCalendarProject();
    project.weatherSettings = { seed: "campaign-seed", forecastMode: "wide" };
    const imported = importCalendarProject(exportCalendarProject(project), project);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.project.weatherSettings.seed).toBe("campaign-seed");
    expect(imported.project.weatherSettings.forecastMode).toBe("wide");
  });

  it("exports then imports and keeps weather event with conditions", () => {
    const project = createDefaultCalendarProject();
    project.weatherEvents = [
      {
        id: "frost",
        name: "Frost",
        icon: "🥶",
        summary: "Cold alert",
        link: "https://example.com",
        requireAllConditions: true,
        enabled: true,
        conditions: [{ metric: "temperature", operator: "lte", value: -5 }]
      }
    ];
    const imported = importCalendarProject(exportCalendarProject(project), project);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.project.weatherEvents).toEqual(project.weatherEvents);
  });

  it("keeps negative temperature condition value", () => {
    const project = createDefaultCalendarProject();
    const payload = {
      ...project,
      weatherEvents: [
        {
          id: "frost",
          name: "Frost",
          conditions: [{ metric: "temperature", operator: "lte", value: -15 }],
          enabled: true,
          requireAllConditions: true
        }
      ]
    };
    const imported = importCalendarProject(JSON.stringify(payload), project);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.project.weatherEvents[0].conditions[0].value).toBe(-15);
  });

  it("imports weather event without enabled", () => {
    const project = createDefaultCalendarProject();
    const payload = {
      ...project,
      weatherEvents: [
        {
          id: "frost",
          name: "Frost",
          conditions: [{ metric: "temperature", operator: "lte", value: -1 }],
          requireAllConditions: true
        }
      ]
    };
    const imported = importCalendarProject(JSON.stringify(payload), project);
    expect(imported.ok).toBe(true);
  });

  it("imports weather event without requireAllConditions", () => {
    const project = createDefaultCalendarProject();
    const payload = {
      ...project,
      weatherEvents: [
        {
          id: "frost",
          name: "Frost",
          conditions: [{ metric: "temperature", operator: "lte", value: -1 }],
          enabled: true
        }
      ]
    };
    const imported = importCalendarProject(JSON.stringify(payload), project);
    expect(imported.ok).toBe(true);
  });
});
