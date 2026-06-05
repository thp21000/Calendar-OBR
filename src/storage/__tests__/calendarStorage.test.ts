import { describe, expect, it, vi } from "vitest";
import {
  CALENDAR_STORAGE_KEY,
  createDefaultCalendarProject,
  loadCalendarProject,
  resetCalendarProject,
  saveCalendarProject
} from "../calendarStorage";

describe("calendarStorage integrity", () => {
  it("default project is valid and saveable", () => {
    const memory = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, v),
      removeItem: (k: string) => memory.delete(k)
    });

    const project = createDefaultCalendarProject();
    expect(project.id).toBeTruthy();
    expect(project.name).toBeTruthy();
    expect(project.calendarSystem.months.length).toBeGreaterThan(0);
    expect(project.calendarSystem.weekdays.length).toBeGreaterThan(0);
    expect(project.sceneWeatherProfiles?.length).toBe(26);
    expect(saveCalendarProject(project).ok).toBe(true);

    vi.unstubAllGlobals();
  });

  it("load returns default when localStorage is invalid JSON", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => "{not-json",
      setItem: vi.fn(),
      removeItem: vi.fn()
    });

    const loaded = loadCalendarProject(CALENDAR_STORAGE_KEY);
    expect(loaded).toEqual(createDefaultCalendarProject());

    vi.unstubAllGlobals();
  });

  it("loads old projects with missing scene weather profiles by adding presets", () => {
    const memory = new Map<string, string>();
    const oldProject = createDefaultCalendarProject();
    delete (oldProject as { sceneWeatherProfiles?: unknown }).sceneWeatherProfiles;
    memory.set(CALENDAR_STORAGE_KEY, JSON.stringify(oldProject));
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, v),
      removeItem: (k: string) => memory.delete(k)
    });

    const loaded = loadCalendarProject(CALENDAR_STORAGE_KEY);

    expect(loaded.sceneWeatherProfiles?.length).toBe(26);
    vi.unstubAllGlobals();
  });

  it("save refuses invalid project shape", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem,
      removeItem: vi.fn()
    });

    const project = createDefaultCalendarProject();
    project.currentTime.minute = 99;
    const result = saveCalendarProject(project);

    expect(result.ok).toBe(false);
    expect(setItem).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("saves advanced weather settings after sanitizing invalid values", () => {
    const memory = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, v),
      removeItem: (k: string) => memory.delete(k)
    });

    const project = createDefaultCalendarProject() as any;
    project.weatherAdvancedSettings = {
      stateConfigs: { blizzard: { enabled: false, priority: Number.NaN, thresholds: { minRain: 2, maxRain: "bad" } } },
      trendConfigs: { wet: { rainMultiplier: 2, windMultiplier: Number.POSITIVE_INFINITY } }
    };

    expect(saveCalendarProject(project, CALENDAR_STORAGE_KEY).ok).toBe(true);
    const persisted = JSON.parse(memory.get(CALENDAR_STORAGE_KEY) ?? "{}");

    expect(persisted.weatherAdvancedSettings.stateConfigs.blizzard.enabled).toBe(false);
    expect(persisted.weatherAdvancedSettings.stateConfigs.blizzard.priority).toBeUndefined();
    expect(persisted.weatherAdvancedSettings.stateConfigs.blizzard.thresholds).toEqual({ minRain: 2 });
    expect(persisted.weatherAdvancedSettings.trendConfigs.wet.rainMultiplier).toBe(2);
    expect(persisted.weatherAdvancedSettings.trendConfigs.wet.windMultiplier).toBeUndefined();

    vi.unstubAllGlobals();
  });

  it("loads old projects without injecting advanced weather settings", () => {
    const memory = new Map<string, string>();
    const oldProject = createDefaultCalendarProject();
    delete (oldProject as { weatherAdvancedSettings?: unknown }).weatherAdvancedSettings;
    memory.set(CALENDAR_STORAGE_KEY, JSON.stringify(oldProject));
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, v),
      removeItem: (k: string) => memory.delete(k)
    });

    const loaded = loadCalendarProject(CALENDAR_STORAGE_KEY);

    expect(loaded.weatherAdvancedSettings).toBeUndefined();
    vi.unstubAllGlobals();
  });


  it("reset creates and persists a valid default project", () => {
    const memory = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, v),
      removeItem: (k: string) => memory.delete(k)
    });

    const reset = resetCalendarProject(CALENDAR_STORAGE_KEY);
    expect(reset.id).toBe("default-calendar");
    const loaded = loadCalendarProject(CALENDAR_STORAGE_KEY);
    expect(loaded.id).toBe("default-calendar");
    expect(loaded.sceneWeatherProfiles?.length).toBe(26);

    vi.unstubAllGlobals();
  });
});
