import { describe, expect, it, vi } from "vitest";
import {
  CALENDAR_STORAGE_KEY,
  createDefaultCalendarProject,
  loadCalendarProject,
  saveCalendarProject
} from "../../storage/calendarStorage";
import { exportCalendarProject, importCalendarProject, sanitizeCalendarProject, validateImportedCalendarProject } from "../calendarImportExport";

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

  it("keeps advanced season weather traits during sanitation", () => {
    const project = createDefaultCalendarProject();
    const payload = {
      ...project,
      seasons: [
        {
          id: "wet",
          name: "Wet",
          icon: "🌧️",
          start: { monthId: "month-1", dayOfMonth: 1 },
          end: { monthId: "month-2", dayOfMonth: 30 },
          weatherProfile: {
            temperature: { min: 4, average: 10, max: 16 },
            windSpeed: { min: 2, average: 9, max: 18 },
            rain: { min: 1, average: 6, max: 12 },
            stability: 0.2,
            precipitationChance: 0.8,
            stormChance: 2,
            fogChance: Number.NaN,
            temperatureSwing: 0.7,
            windVariability: 0.6
          }
        }
      ]
    };

    const sanitized = sanitizeCalendarProject(payload);
    expect(sanitized.ok).toBe(true);
    if (!sanitized.ok) return;
    const profile = sanitized.project.seasons[0].weatherProfile;
    expect(profile).toBeDefined();
    if (!profile) return;
    expect(profile.stability).toBe(0.2);
    expect(profile.precipitationChance).toBe(0.8);
    expect(profile.stormChance).toBe(1);
    expect(profile.fogChance).toBeUndefined();
    expect(profile.temperatureSwing).toBe(0.7);
    expect(profile.windVariability).toBe(0.6);
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
    expect(imported.project.weatherEvents[0]).toMatchObject(project.weatherEvents[0]);
    expect(imported.project.weatherEvents[0].visibility).toBe("gm");
    expect(imported.project.weatherEvents[0].notifyOnTrigger).toBe(true);
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

  it("old calendar without dayNotes is still valid", () => {
    const project = createDefaultCalendarProject() as Record<string, unknown>;
    delete project.dayNotes;
    const imported = importCalendarProject(JSON.stringify(project), createDefaultCalendarProject());
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.project.dayNotes).toEqual([]);
  });

  it("sanitizeCalendarProject backfills missing dayNotes to []", () => {
    const project = createDefaultCalendarProject() as Record<string, unknown>;
    delete project.dayNotes;
    const sanitized = sanitizeCalendarProject(project);
    expect(sanitized.ok).toBe(true);
    if (!sanitized.ok) return;
    expect(sanitized.project.dayNotes).toEqual([]);
  });

  it("sanitizes invalid day notes", () => {
    const project = createDefaultCalendarProject();
    const payload = {
      ...project,
      dayNotes: [
        { id: "", date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 0, minute: 0 }, visibility: "players", updatedAt: 1, playerNote: "x" },
        { id: "n1", date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 0, minute: 0 }, visibility: "invalid", updatedAt: "bad", playerNote: "x" }
      ]
    };
    const imported = importCalendarProject(JSON.stringify(payload), project);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.project.dayNotes?.map((n) => n.id)).toEqual(["n1"]);
    expect(imported.project.dayNotes?.[0].visibility).toBe("gm");
  });

  it("sanitizeCalendarProject normalizes invalid reminder fields", () => {
    const project = createDefaultCalendarProject() as unknown as Record<string, unknown>;
    project.events = [{
      ...(createDefaultCalendarProject().events[0] ?? {
        id: "e1", name: "e1", date: { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 10, minute: 0 }, recurrence: { type: "none" }, summary: "", visibility: "gm", notifyOnTrigger: true, deleteAfterTrigger: false, archiveAfterTrigger: false, status: "active"
      }),
      reminderEnabled: "yes",
      reminderMinutesBefore: -12.8
    }];
    const sanitized = sanitizeCalendarProject(project);
    expect(sanitized.ok).toBe(true);
    if (!sanitized.ok) return;
    const event = sanitized.project.events[0] as Record<string, unknown>;
    expect(event.reminderEnabled).toBeUndefined();
    expect(event.reminderMinutesBefore).toBeUndefined();
  });

it("weather triggerHistory valide conservé et limité à 10", () => {
  const project: any = createDefaultCalendarProject();
  project.weatherEvents = [{
    id: "th1",
    name: "Hist",
    requireAllConditions: true,
    enabled: true,
    conditions: [{ metric: "temperature", operator: "gte", value: 0 }],
    triggerHistory: Array.from({ length: 12 }, (_, i) => ({ id: `h-${i}`, triggeredAtMinutes: i, weatherState: "clear", rain: i }))
  }];
  const sanitized = sanitizeCalendarProject(project);
  expect(sanitized.ok).toBe(true);
  if (!sanitized.ok) return;
  expect(sanitized.project.weatherEvents[0].triggerHistory?.length).toBe(10);
});

it("weather triggerHistory invalide nettoyé", () => {
  const project: any = createDefaultCalendarProject();
  project.weatherEvents = [{
    id: "th2",
    name: "Hist2",
    requireAllConditions: true,
    enabled: true,
    conditions: [{ metric: "temperature", operator: "gte", value: 0 }],
    triggerHistory: [{ id: 1, triggeredAtMinutes: -2 }, { id: "ok", triggeredAtMinutes: 5, weatherState: "bad" }]
  }];
  const sanitized = sanitizeCalendarProject(project);
  expect(sanitized.ok).toBe(true);
  if (!sanitized.ok) return;
  expect(sanitized.project.weatherEvents[0].triggerHistory?.length).toBe(1);
  expect(sanitized.project.weatherEvents[0].triggerHistory?.[0].triggeredAtMinutes).toBe(5);
});

    });

it("keeps new advanced weather conditions on import", () => {
    const project = createDefaultCalendarProject();
    project.weatherEvents = [{
      id: "adv",
      name: "Advanced",
      requireAllConditions: true,
      enabled: true,
      conditions: [
        { type: "metric", metric: "dailyRainTotal", operator: "gte", value: 8 },
        { type: "metric", metric: "dailyMinTemperature", operator: "lte", value: 0 },
        { type: "metric", metric: "dailyMaxTemperature", operator: "gte", value: 35 },
        { type: "dominantState", state: "storm" },
        { type: "windDirection", direction: "N" }
      ]
    }];
    const imported = importCalendarProject(exportCalendarProject(project), project);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(imported.project.weatherEvents[0].conditions).toEqual(project.weatherEvents[0].conditions);
  });

  it("sanitizes invalid dominantState and windDirection conditions", () => {
    const project = createDefaultCalendarProject() as any;
    project.weatherEvents = [{
      id: "bad",
      name: "Bad",
      requireAllConditions: true,
      enabled: true,
      conditions: [
        { type: "dominantState", state: "invalid" },
        { type: "windDirection", direction: "BAD" },
        { type: "metric", metric: "dailyRainTotal", operator: "gte", value: 5 }
      ]
    }];
    const sanitized = sanitizeCalendarProject(project);
    expect(sanitized.ok).toBe(true);
    if (!sanitized.ok) return;
    expect(sanitized.project.weatherEvents[0].conditions).toEqual([{ type: "metric", metric: "dailyRainTotal", operator: "gte", value: 5 }]);
  });

  it("keeps weather event gm/player descriptions visibility notifyOnTrigger", () => {
  const project = createDefaultCalendarProject();
  project.weatherEvents = [{
    id: "v1",
    name: "Visible",
    gmDescription: "gm desc",
    playerDescription: "player desc",
    visibility: "players",
    notifyOnTrigger: true,
    requireAllConditions: true,
    enabled: true,
    conditions: [{ metric: "temperature", operator: "gte", value: 0 }]
  }];
  const imported = importCalendarProject(exportCalendarProject(project), project);
  expect(imported.ok).toBe(true);
  if (!imported.ok) return;
  expect(imported.project.weatherEvents[0].gmDescription).toBe("gm desc");
  expect(imported.project.weatherEvents[0].playerDescription).toBe("player desc");
  expect(imported.project.weatherEvents[0].visibility).toBe("players");
  expect(imported.project.weatherEvents[0].notifyOnTrigger).toBe(true);
});

it("sanitizes invalid weather visibility/notifyOnTrigger", () => {
  const project: any = createDefaultCalendarProject();
  project.weatherEvents = [{
    id: "v2",
    name: "Bad",
    visibility: "invalid",
    notifyOnTrigger: "bad",
    requireAllConditions: true,
    enabled: true,
    conditions: [{ metric: "temperature", operator: "gte", value: 0 }]
  }];
  const sanitized = sanitizeCalendarProject(project);
  expect(sanitized.ok).toBe(true);
  if (!sanitized.ok) return;
  expect(sanitized.project.weatherEvents[0].visibility).toBe("gm");
  expect(sanitized.project.weatherEvents[0].notifyOnTrigger).toBe(true);
});

  it("weather event status valide conservé", () => {
  const project = createDefaultCalendarProject() as any;
  project.weatherEvents = [{ id: "s1", name: "S", status: "triggered", lastTriggeredAtMinutes: 10, archiveAfterTrigger: true, disableAfterTrigger: false, requireAllConditions: true, enabled: true, conditions: [{ metric: "temperature", operator: "gte", value: 0 }] }];
  const imported = importCalendarProject(exportCalendarProject(project), project);
  expect(imported.ok).toBe(true);
  if (!imported.ok) return;
  expect(imported.project.weatherEvents[0].status).toBe("triggered");
  expect(imported.project.weatherEvents[0].lastTriggeredAtMinutes).toBe(10);
});

it("weather event status invalide nettoyé", () => {
  const project = createDefaultCalendarProject() as any;
  project.weatherEvents = [{ id: "s2", name: "S", status: "bad", lastTriggeredAtMinutes: -4, archiveAfterTrigger: "x", disableAfterTrigger: "y", requireAllConditions: true, enabled: true, conditions: [{ metric: "temperature", operator: "gte", value: 0 }] }];
  const sanitized = sanitizeCalendarProject(project);
  expect(sanitized.ok).toBe(true);
  if (!sanitized.ok) return;
  expect(sanitized.project.weatherEvents[0].status).toBe("active");
  expect(sanitized.project.weatherEvents[0].lastTriggeredAtMinutes).toBeUndefined();
  expect(sanitized.project.weatherEvents[0].archiveAfterTrigger).toBe(false);
  expect(sanitized.project.weatherEvents[0].disableAfterTrigger).toBe(false);
});

it("conserve les weatherOverrides valides et nettoie invalides", () => {
  const project: any = createDefaultCalendarProject();
  project.weatherOverrides = [
    { id: "o1", absoluteDay: 2, dailyRainTotal: 3, windDirection: "N", trendKind: "wet" },
    { id: "", absoluteDay: 3 },
    { id: "o3", absoluteDay: 1.2, windSpeed: -4 }
  ];
  const sanitized = sanitizeCalendarProject(project);
  expect(sanitized.ok).toBe(true);
  if (!sanitized.ok) return;
  expect(sanitized.project.weatherOverrides?.length).toBe(1);
  expect(sanitized.project.weatherOverrides?.[0].id).toBe("o1");
});

describe("calendarImportExport phase17 integrity", () => {
  it("roundtrip keeps current complete project structures", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "month-1", dayOfMonth: 1 }, end: { monthId: "month-2", dayOfMonth: 30 } }];
    project.weatherOverrides = [{ id: "ov1", absoluteDay: 2, temperature: 8, dailyRainTotal: 4, windSpeed: 6, rain: 1 }];
    project.weatherEvents = [{ id: "we1", name: "W", enabled: true, requireAllConditions: true, conditions: [{ metric: "temperature", operator: "gte", value: 0 }] }];

    const reimported = importCalendarProject(exportCalendarProject(project), project);
    expect(reimported.ok).toBe(true);
    if (!reimported.ok) return;
    expect(reimported.project.weatherOverrides).toEqual(project.weatherOverrides);
    expect(reimported.project.weatherEvents[0].id).toBe("we1");
  });

  it("sanitizes invalid numerics and keeps project saveable", () => {
    const project = createDefaultCalendarProject();
    const payload: any = {
      ...project,
      weatherOverrides: [{ id: "o1", absoluteDay: 1, windSpeed: -5, rain: -2, dailyRainTotal: -1 }],
      weatherEvents: [{ id: "w1", name: "W", enabled: true, requireAllConditions: true, durationHours: Number.POSITIVE_INFINITY, cooldownHours: Number.NaN, conditions: [{ metric: "temperature", operator: "gte", value: 1 }] }]
    };

    const sanitized = sanitizeCalendarProject(payload);
    expect(sanitized.ok).toBe(true);
    if (!sanitized.ok) return;
    expect(sanitized.project.weatherOverrides?.[0].windSpeed).toBe(0);
    expect(sanitized.project.weatherOverrides?.[0].rain).toBe(0);
    expect(sanitized.project.weatherOverrides?.[0].dailyRainTotal).toBe(0);
    expect(sanitized.project.weatherEvents[0].durationHours).toBeUndefined();
    expect(sanitized.project.weatherEvents[0].cooldownHours).toBeUndefined();
    const memory = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, v),
      removeItem: (k: string) => memory.delete(k)
    });
    expect(saveCalendarProject(sanitized.project).ok).toBe(true);
    vi.unstubAllGlobals();
  });

  it("keeps import stable with invalid month reference in events", () => {
    const project = createDefaultCalendarProject();
    const payload: any = {
      ...project,
      events: [{
        id: "e1",
        name: "Bad month",
        date: { year: 1000, monthId: "missing-month", dayOfMonth: 1, hour: 10, minute: 0 },
        visibility: "players",
        status: "active",
        recurrence: { type: "none" },
        notifyOnTrigger: true,
        deleteAfterTrigger: false,
        archiveAfterTrigger: false
      }]
    };

    const imported = importCalendarProject(JSON.stringify(payload), project);
    expect(imported.ok).toBe(true);
  });
});