import { describe, expect, it } from "vitest";
import { areCalendarEventConditionsMet, getEventsForDay } from "../eventsLogic";
import { DEFAULT_ADVENTURE_CONTEXTS, isAdventureContextConditionMet, normalizeAdventureContext, setActiveAdventureContexts } from "../adventureContext";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { exportCalendarProject, sanitizeCalendarProject } from "../../importExport/calendarImportExport";
import { buildCalendarConfigurationFile, applyCalendarConfigurationFile } from "../calendarConfigurationFile";
import { isWeatherEventTriggered } from "../weatherEventsLogic";
import type { CalendarEvent, WeatherEvent, WeatherSnapshot } from "../../domain/types";

const weather: WeatherSnapshot = {
  temperature: 20,
  dailyMinTemperature: 12,
  dailyMaxTemperature: 24,
  windSpeed: 10,
  windDirection: "E",
  rain: 0,
  dailyRainTotal: 0,
  state: "clear",
  dominantState: "clear",
  trendKind: "stable"
};

const event = (conditions?: CalendarEvent["conditions"]): CalendarEvent => ({
  id: "event-1",
  name: "Visible event",
  date: { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 8, minute: 0 },
  recurrence: { type: "none" },
  summary: "",
  visibility: "players",
  notifyOnTrigger: true,
  deleteAfterTrigger: false,
  archiveAfterTrigger: false,
  status: "active",
  conditions
});

const weatherEvent = (contextIds: string[]): WeatherEvent => ({
  id: "weather-event-1",
  name: "Context weather event",
  conditions: [{ type: "adventureContext", mode: "any", contextIds }],
  requireAllConditions: true,
  enabled: true,
  status: "active"
});

describe("adventure context", () => {
  it("initializes missing adventureContext with all default contexts", () => {
    const state = normalizeAdventureContext(undefined);
    expect(state.activeContextIds).toEqual([]);
    expect(state.availableContexts).toHaveLength(DEFAULT_ADVENTURE_CONTEXTS.length);
    expect(state.availableContexts.map((context) => context.id)).toContain("road");
  });

  it("preserves custom contexts, migrates legacy selections and adds missing defaults", () => {
    const state = normalizeAdventureContext({
      primaryContextId: "custom-context",
      secondaryContextIds: ["road", "road"],
      availableContexts: [{ id: "custom-context", label: { fr: "Custom", en: "Custom" }, icon: "⭐", category: "activity", enabled: true }]
    });
    expect(state.activeContextIds).toEqual(["custom-context", "road"]);
    expect(state.availableContexts.some((context) => context.id === "custom-context")).toBe(true);
    expect(state.availableContexts).toHaveLength(DEFAULT_ADVENTURE_CONTEXTS.length + 1);
  });

  it("selects multiple active contexts", () => {
    const project = setActiveAdventureContexts(createDefaultCalendarProject(), ["road", "travel", "hexploration", "road"]);
    expect(project.adventureContext?.activeContextIds).toEqual(["road", "travel", "hexploration"]);
  });

  it("evaluates any, all and none against the active context list", () => {
    const project = setActiveAdventureContexts(createDefaultCalendarProject(), ["road", "travel", "hexploration"]);
    expect(isAdventureContextConditionMet(project, { type: "adventureContext", mode: "any", contextIds: ["road"] })).toBe(true);
    expect(isAdventureContextConditionMet(project, { type: "adventureContext", mode: "any", contextIds: ["marsh", "travel"] })).toBe(true);
    expect(isAdventureContextConditionMet(project, { type: "adventureContext", mode: "all", contextIds: ["road", "travel"] })).toBe(true);
    expect(isAdventureContextConditionMet(project, { type: "adventureContext", mode: "all", contextIds: ["road", "marsh"] })).toBe(false);
    expect(isAdventureContextConditionMet(project, { type: "adventureContext", mode: "none", contextIds: ["marsh"] })).toBe(true);
    expect(isAdventureContextConditionMet(project, { type: "adventureContext", mode: "none", contextIds: ["road"] })).toBe(false);
  });

  it("ignores legacy condition scope fields and keeps primaryAndAnySecondary permissive", () => {
    const project = setActiveAdventureContexts(createDefaultCalendarProject(), ["camp"]);
    expect(isAdventureContextConditionMet(project, { type: "adventureContext", mode: "any", target: "primaryOnly", contextIds: ["camp"], includePrimary: true, includeSecondary: false })).toBe(true);
    expect(isAdventureContextConditionMet(project, { type: "adventureContext", mode: "any", target: "secondaryOnly", contextIds: ["camp"], includePrimary: false, includeSecondary: true })).toBe(true);
    expect(isAdventureContextConditionMet(project, { type: "adventureContext", mode: "all", target: "primaryAndAnySecondary", contextIds: ["camp", "woods"] })).toBe(true);
  });

  it("filters weather events by adventure context", () => {
    const project = setActiveAdventureContexts(createDefaultCalendarProject(), ["road"]);
    expect(isWeatherEventTriggered(weather, weatherEvent(["road"]), { project, time: project.currentTime })).toBe(true);
    expect(isWeatherEventTriggered(weather, weatherEvent(["marsh"]), { project, time: project.currentTime })).toBe(false);
  });

  it("keeps dated events without conditions visible and filters conditioned events", () => {
    let project = setActiveAdventureContexts(createDefaultCalendarProject(), ["road"]);
    project = { ...project, events: [event(), event([{ type: "adventureContext", mode: "any", contextIds: ["road"] }]), { ...event([{ type: "adventureContext", mode: "any", contextIds: ["marsh"] }]), id: "event-3", name: "Hidden" }] };
    expect(areCalendarEventConditionsMet(project, project.events[0])).toBe(true);
    expect(getEventsForDay(project, { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 0, minute: 0 }).map((item) => item.name)).toEqual(["Visible event", "Visible event"]);
  });

  it("preserves adventure context through export/import and configuration files", () => {
    const source = setActiveAdventureContexts(createDefaultCalendarProject(), ["woods", "exploration"]);
    const sanitized = sanitizeCalendarProject(JSON.parse(exportCalendarProject(source)));
    expect(sanitized.ok && sanitized.project.adventureContext?.activeContextIds).toEqual(["woods", "exploration"]);
    const config = buildCalendarConfigurationFile(source);
    const applied = applyCalendarConfigurationFile(createDefaultCalendarProject(), config);
    expect(applied.ok && applied.project.adventureContext?.activeContextIds).toEqual(["woods", "exploration"]);
  });
});