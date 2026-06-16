import { describe, expect, it } from "vitest";
import { applyCalendarConfigurationFile, applyCalendarCustomExportFile, buildCalendarConfigurationFile, buildCalendarCustomExportFile, readCalendarConfigurationFileFromText, readCalendarImportFileFromText, validateCalendarConfigurationFile } from "../calendarConfigurationFile";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import type { CalendarEvent, DayNote } from "../../domain/types";

const campaignEvent = (id = "campaign-event"): CalendarEvent => ({
  id,
  name: "Campaign event",
  date: { year: 1000, monthId: "month-1", dayOfMonth: 2, hour: 9, minute: 0 },
  recurrence: { type: "none" },
  summary: "Private campaign progress",
  visibility: "gm",
  notifyOnTrigger: false,
  deleteAfterTrigger: false,
  archiveAfterTrigger: false,
  status: "active"
});

const dayNote = (): DayNote => ({
  id: "note-1",
  date: { year: 1000, monthId: "month-1", dayOfMonth: 2, hour: 0, minute: 0 },
  gmNote: "Secret note",
  visibility: "gm",
  updatedAt: 1
});

describe("calendarConfigurationFile", () => {
  it("exports reusable configuration sections", () => {
    const project = createDefaultCalendarProject();
    project.weatherEvents = [{ id: "weather-event", name: "Fog", conditions: [], requireAllConditions: true, enabled: true }];
    project.weatherAdvancedSettings = { stateConfigs: { fog: { icon: "🌫️" } } };

    const file = buildCalendarConfigurationFile(project, { exportedAt: "2026-01-01T00:00:00.000Z" });

    expect(file.kind).toBe("calendar-obr.configuration");
    expect(file.schemaVersion).toBe(1);
    expect(file.configuration.calendarSystem.months).toEqual(project.calendarSystem.months);
    expect(file.configuration.seasons).toEqual(project.seasons);
    expect(file.configuration.moons).toEqual(project.moons);
    expect(file.configuration.weatherEvents).toEqual(project.weatherEvents);
    expect(file.configuration.weatherAdvancedSettings).toEqual(project.weatherAdvancedSettings);
    expect(file.configuration.uiSettings.playerView).toEqual(project.uiSettings.playerView);
  });

  it("does not export campaign events or current time", () => {
    const project = createDefaultCalendarProject();
    project.currentTime = { absoluteDay: 42, hour: 22, minute: 30 };
    project.events = [campaignEvent()];
    project.dayNotes = [dayNote()];

    const text = JSON.stringify(buildCalendarConfigurationFile(project));

    expect(text).not.toContain("campaign-event");
    expect(text).not.toContain("absoluteDay");
    expect(text).not.toContain("Secret note");
  });

  it("imports configuration without changing current time or campaign events", () => {
    const source = createDefaultCalendarProject();
    source.calendarSystem.months = [{ id: "m-custom", name: "Custom", order: 1, days: 12 }];
    source.seasons = [{ id: "summer", name: "Summer", start: { monthId: "m-custom", dayOfMonth: 1 }, end: { monthId: "m-custom", dayOfMonth: 12 } }];
    source.moons = [{ id: "red-moon", name: "Red Moon", cycleLengthDays: 13 }];
    source.weatherBiome = { currentBiomeId: "desert" };
    source.weatherEvents = [{ id: "heat", name: "Heat", conditions: [], requireAllConditions: true, enabled: true }];
    source.uiSettings.playerView = { ...source.uiSettings.playerView!, defaultTab: "month" };

    const target = createDefaultCalendarProject();
    target.currentTime = { absoluteDay: 99, hour: 23, minute: 45 };
    target.events = [campaignEvent()];
    target.dayNotes = [dayNote()];

    const result = applyCalendarConfigurationFile(target, buildCalendarConfigurationFile(source));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.calendarSystem.months[0].id).toBe("m-custom");
    expect(result.project.seasons[0].id).toBe("summer");
    expect(result.project.moons[0].id).toBe("red-moon");
    expect(result.project.weatherBiome?.currentBiomeId).toBe("desert");
    expect(result.project.weatherEvents[0].id).toBe("heat");
    expect(result.project.uiSettings.playerView?.defaultTab).toBe("month");
    expect(result.project.currentTime).toEqual(target.currentTime);
    expect(result.project.events).toEqual(target.events);
    expect(result.project.dayNotes).toEqual(target.dayNotes);
  });

  it("rejects invalid configuration files with a clear error", () => {
    const validation = validateCalendarConfigurationFile({ kind: "calendar-obr.project", schemaVersion: 1 });

    expect(validation.ok).toBe(false);
    if (validation.ok) return;
    expect(validation.error).toContain("Invalid configuration file");
  });

  it("does not modify the project when edited JSON is invalid", () => {
    const project = createDefaultCalendarProject();
    const parsed = readCalendarConfigurationFileFromText("{not-json");

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(project).toEqual(createDefaultCalendarProject());
  });
});

describe("calendar custom import/export", () => {
  it("exports a custom file with only selected sections", () => {
    const project = createDefaultCalendarProject();
    project.seasons = [{ id: "winter", name: "Winter", start: { monthId: "month-1", dayOfMonth: 1 }, end: { monthId: "month-1", dayOfMonth: 10 } }];
    const file = buildCalendarCustomExportFile(project, ["seasons"]);

    expect(file.kind).toBe("calendar-obr.custom-export");
    expect(file.sections.seasons).toEqual(project.seasons);
    expect(file.sections.calendarSystem).toBeUndefined();
  });

  it("imports a custom file with one selected section", () => {
    const source = createDefaultCalendarProject();
    source.seasons = [{ id: "spring", name: "Spring", start: { monthId: "month-1", dayOfMonth: 1 }, end: { monthId: "month-1", dayOfMonth: 20 } }];
    const target = createDefaultCalendarProject();
    target.moons = [{ id: "kept", name: "Kept", cycleLengthDays: 9 }];
    const file = buildCalendarCustomExportFile(source, ["seasons"]);

    const result = applyCalendarCustomExportFile(target, file, ["seasons"]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.seasons[0].id).toBe("spring");
    expect(result.project.moons[0].id).toBe("kept");
  });

  it("refuses a custom import without selected sections", () => {
    const project = createDefaultCalendarProject();
    const file = buildCalendarCustomExportFile(project, ["seasons"]);

    const result = applyCalendarCustomExportFile(project, file, []);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("No section selected");
  });

  it("detects full projects, configurations, custom exports, and unrecognized files", () => {
    const project = createDefaultCalendarProject();

    expect(readCalendarImportFileFromText(JSON.stringify(project))).toMatchObject({ ok: true, importFile: { type: "project", requiresFullProjectConfirmation: true } });
    expect(readCalendarImportFileFromText(JSON.stringify(buildCalendarConfigurationFile(project)))).toMatchObject({ ok: true, importFile: { type: "configuration" } });
    expect(readCalendarImportFileFromText(JSON.stringify(buildCalendarCustomExportFile(project, ["seasons"])))).toMatchObject({ ok: true, importFile: { type: "custom" } });
    expect(readCalendarImportFileFromText(JSON.stringify({ kind: "unknown" }))).toMatchObject({ ok: false });
  });

  it("keeps current time, events, and notes when those sections are not selected", () => {
    const source = createDefaultCalendarProject();
    source.currentTime = { absoluteDay: 1, hour: 1, minute: 1 };
    source.events = [campaignEvent("source-event")];
    source.dayNotes = [dayNote()];
    source.seasons = [{ id: "imported", name: "Imported", start: { monthId: "month-1", dayOfMonth: 1 }, end: { monthId: "month-1", dayOfMonth: 2 } }];
    const target = createDefaultCalendarProject();
    target.currentTime = { absoluteDay: 77, hour: 7, minute: 7 };
    target.events = [campaignEvent("target-event")];
    target.dayNotes = [dayNote()];

    const result = applyCalendarCustomExportFile(target, buildCalendarCustomExportFile(source, ["seasons", "currentTime", "campaignEvents", "dayNotes"]), ["seasons"]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.seasons[0].id).toBe("imported");
    expect(result.project.currentTime).toEqual(target.currentTime);
    expect(result.project.events).toEqual(target.events);
    expect(result.project.dayNotes).toEqual(target.dayNotes);
  });
});