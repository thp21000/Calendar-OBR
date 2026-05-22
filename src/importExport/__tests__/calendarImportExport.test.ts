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

  it("accepts uiSettings.activeTab = player on import", () => {
    const project = createDefaultCalendarProject();
    const payload = { ...project, uiSettings: { ...project.uiSettings, activeTab: "player" as const } };
    const imported = importCalendarProject(JSON.stringify(payload), project);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.project.uiSettings.activeTab).toBe("player");
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
    const firstCondition = imported.project.weatherEvents[0].conditions[0];
    expect(firstCondition.type === "metric" || firstCondition.type === undefined ? firstCondition.value : undefined).toBe(-15);
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

  it("imports weather event with state condition and legacy metric condition", () => {
    const project = createDefaultCalendarProject();
    const payload = {
      ...project,
      weatherEvents: [
        {
          id: "combo",
          name: "Combo",
          enabled: true,
          requireAllConditions: false,
          conditions: [
            { type: "state", state: "storm" },
            { metric: "temperature", operator: "gte", value: 35 }
          ]
        }
      ]
    };
    const imported = importCalendarProject(JSON.stringify(payload), project);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.project.weatherEvents[0].conditions).toEqual(payload.weatherEvents[0].conditions);
  });

  it("sanitizes invalid durationHours/cooldownHours values", () => {
    const project = createDefaultCalendarProject();
    const payload = {
      ...project,
      weatherEvents: [
        {
          id: "bad-1",
          name: "Bad 1",
          enabled: true,
          requireAllConditions: true,
          durationHours: -2,
          cooldownHours: "oops",
          conditions: [{ metric: "temperature", operator: "gte", value: 35 }]
        },
        {
          id: "ok-1",
          name: "Ok 1",
          enabled: true,
          requireAllConditions: true,
          durationHours: 2.8,
          cooldownHours: 1.2,
          conditions: [{ metric: "temperature", operator: "gte", value: 35 }]
        }
      ]
    };
    const imported = importCalendarProject(JSON.stringify(payload), project);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.project.weatherEvents[0].durationHours).toBeUndefined();
    expect(imported.project.weatherEvents[0].cooldownHours).toBeUndefined();
    expect(imported.project.weatherEvents[1].durationHours).toBe(2);
    expect(imported.project.weatherEvents[1].cooldownHours).toBe(1);
  });

  it("sanitizes season/timeOfDay weather conditions", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [{ id: "s1", name: "S1", start: { monthId: project.calendarSystem.months[0].id, dayOfMonth: 1 }, end: { monthId: project.calendarSystem.months[0].id, dayOfMonth: 10 } }];
    const payload = {
      ...project,
      weatherEvents: [
        { id: "ok", name: "ok", enabled: true, requireAllConditions: true, conditions: [{ type: "season", seasonId: "s1" }, { type: "timeOfDay", startHour: 26, endHour: -2 }] },
        { id: "bad", name: "bad", enabled: true, requireAllConditions: true, conditions: [{ type: "season", seasonId: "" }, { type: "timeOfDay", startHour: "a", endHour: 2 }] }
      ]
    };
    const imported = importCalendarProject(JSON.stringify(payload), project);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.project.weatherEvents[0].conditions).toEqual([{ type: "season", seasonId: "s1" }, { type: "timeOfDay", startHour: 23, endHour: 0 }]);
    expect(imported.project.weatherEvents[1].conditions).toEqual([]);
  });

  it("sanitizes moonPhase weather conditions", () => {
    const project = createDefaultCalendarProject();
    project.moons = [{ id: "m1", name: "Moon", cycleLengthDays: 29.5, cycleOffsetDays: 0 }];
    const payload = {
      ...project,
      weatherEvents: [
        { id: "ok", name: "ok", enabled: true, requireAllConditions: true, conditions: [{ type: "moonPhase", moonId: "m1", phaseId: "full" }] },
        { id: "bad", name: "bad", enabled: true, requireAllConditions: true, conditions: [{ type: "moonPhase", moonId: "", phaseId: "full" }, { type: "moonPhase", moonId: "m1", phaseId: "invalid" }] }
      ]
    };
    const imported = importCalendarProject(JSON.stringify(payload), project);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.project.weatherEvents[0].conditions).toEqual([{ type: "moonPhase", moonId: "m1", phaseId: "full" }]);
    expect(imported.project.weatherEvents[1].conditions).toEqual([]);
  });

  it("old calendar without moonEvents is still valid", () => {
    const project = createDefaultCalendarProject() as Record<string, unknown>;
    delete project.moonEvents;
    const imported = importCalendarProject(JSON.stringify(project), createDefaultCalendarProject());
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.project.moonEvents).toEqual([]);
  });
});
