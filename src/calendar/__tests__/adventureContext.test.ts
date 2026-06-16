import { describe, expect, it } from "vitest";
import { areCalendarEventConditionsMet, getEventsForDay } from "../eventsLogic";
import { DEFAULT_ADVENTURE_CONTEXTS, isAdventureContextConditionMet, normalizeAdventureContext, setPrimaryAdventureContext, setSecondaryAdventureContexts } from "../adventureContext";
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
  conditions: [{ type: "adventureContext", mode: "any", contextIds, includePrimary: true, includeSecondary: true }],
  requireAllConditions: true,
  enabled: true,
  status: "active"
});

describe("adventure context", () => {
  it("initializes missing adventureContext with all default contexts", () => {
    const state = normalizeAdventureContext(undefined);
    expect(state.primaryContextId).toBeNull();
    expect(state.secondaryContextIds).toEqual([]);
    expect(state.availableContexts).toHaveLength(DEFAULT_ADVENTURE_CONTEXTS.length);
    expect(state.availableContexts.map((context) => context.id)).toContain("road");
  });

  it("preserves custom contexts and adds missing defaults", () => {
    const state = normalizeAdventureContext({
      primaryContextId: "custom-context",
      secondaryContextIds: ["road"],
      availableContexts: [{ id: "custom-context", label: { fr: "Custom", en: "Custom" }, icon: "⭐", category: "activity", enabled: true }]
    });
    expect(state.primaryContextId).toBe("custom-context");
    expect(state.availableContexts.some((context) => context.id === "custom-context")).toBe(true);
    expect(state.availableContexts).toHaveLength(DEFAULT_ADVENTURE_CONTEXTS.length + 1);
  });

  it("selects a primary context and multiple secondary contexts", () => {
    let project = createDefaultCalendarProject();
    project = setPrimaryAdventureContext(project, "road");
    project = setSecondaryAdventureContexts(project, ["travel", "hexploration"]);
    expect(project.adventureContext?.primaryContextId).toBe("road");
    expect(project.adventureContext?.secondaryContextIds).toEqual(["travel", "hexploration"]);
  });

  it("supports allContexts, primaryOnly, secondaryOnly and legacy include flags", () => {
    let project = setPrimaryAdventureContext(createDefaultCalendarProject(), "road");
    project = setSecondaryAdventureContexts(project, ["travel", "hexploration"]);
    expect(isAdventureContextConditionMet(project, { type: "adventureContext", mode: "any", target: "allContexts", contextIds: ["road"] })).toBe(true);
    expect(isAdventureContextConditionMet(project, { type: "adventureContext", mode: "any", target: "allContexts", contextIds: ["travel"] })).toBe(true);
    expect(isAdventureContextConditionMet(project, { type: "adventureContext", mode: "any", target: "primaryOnly", contextIds: ["travel"] })).toBe(false);
    expect(isAdventureContextConditionMet(project, { type: "adventureContext", mode: "any", target: "secondaryOnly", contextIds: ["road"] })).toBe(false);
    expect(isAdventureContextConditionMet(project, { type: "adventureContext", mode: "any", contextIds: ["road"], includePrimary: true, includeSecondary: false })).toBe(true);
    expect(isAdventureContextConditionMet(project, { type: "adventureContext", mode: "any", contextIds: ["travel"], includePrimary: false, includeSecondary: true })).toBe(true);
    expect(isAdventureContextConditionMet(project, { type: "adventureContext", mode: "none", contextIds: ["marsh"] })).toBe(true);
    });

  it("supports primaryAndAnySecondary target", () => {
    const ids = ["camp", "woods", "rest"];
    expect(isAdventureContextConditionMet(setPrimaryAdventureContext(createDefaultCalendarProject(), "camp"), { type: "adventureContext", mode: "any", target: "primaryAndAnySecondary", contextIds: ids })).toBe(false);
    expect(isAdventureContextConditionMet(setSecondaryAdventureContexts(createDefaultCalendarProject(), ["camp"]), { type: "adventureContext", mode: "any", target: "primaryAndAnySecondary", contextIds: ids })).toBe(false);
    expect(isAdventureContextConditionMet(setSecondaryAdventureContexts(setPrimaryAdventureContext(createDefaultCalendarProject(), "camp"), ["road"]), { type: "adventureContext", mode: "any", target: "primaryAndAnySecondary", contextIds: ids })).toBe(false);
    expect(isAdventureContextConditionMet(setSecondaryAdventureContexts(setPrimaryAdventureContext(createDefaultCalendarProject(), "camp"), ["woods"]), { type: "adventureContext", mode: "any", target: "primaryAndAnySecondary", contextIds: ids })).toBe(true);
    expect(isAdventureContextConditionMet(setSecondaryAdventureContexts(setPrimaryAdventureContext(createDefaultCalendarProject(), "woods"), ["rest"]), { type: "adventureContext", mode: "none", target: "primaryAndAnySecondary", contextIds: ids })).toBe(true);
    expect(isAdventureContextConditionMet(setSecondaryAdventureContexts(setPrimaryAdventureContext(createDefaultCalendarProject(), "road"), ["camp", "woods"]), { type: "adventureContext", mode: "any", target: "primaryAndAnySecondary", contextIds: ids })).toBe(false);
    expect(isAdventureContextConditionMet(setSecondaryAdventureContexts(setPrimaryAdventureContext(createDefaultCalendarProject(), "camp"), ["woods", "rest"]), { type: "adventureContext", mode: "any", target: "primaryAndAnySecondary", contextIds: ids })).toBe(true);
  });

  it("filters weather events by adventure context", () => {
    const project = setPrimaryAdventureContext(createDefaultCalendarProject(), "road");
    expect(isWeatherEventTriggered(weather, weatherEvent(["road"]), { project, time: project.currentTime })).toBe(true);
    expect(isWeatherEventTriggered(weather, weatherEvent(["marsh"]), { project, time: project.currentTime })).toBe(false);
  });

  it("keeps dated events without conditions visible and filters conditioned events", () => {
    let project = setPrimaryAdventureContext(createDefaultCalendarProject(), "road");
    project = { ...project, events: [event(), event([{ type: "adventureContext", mode: "any", contextIds: ["road"] }]), { ...event([{ type: "adventureContext", mode: "any", contextIds: ["marsh"] }]), id: "event-3", name: "Hidden" }] };
    expect(areCalendarEventConditionsMet(project, project.events[0])).toBe(true);
    expect(getEventsForDay(project, { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 0, minute: 0 }).map((item) => item.name)).toEqual(["Visible event", "Visible event"]);
  });

  it("preserves adventure context through export/import and configuration files", () => {
    const source = setSecondaryAdventureContexts(setPrimaryAdventureContext(createDefaultCalendarProject(), "woods"), ["exploration"]);
    const sanitized = sanitizeCalendarProject(JSON.parse(exportCalendarProject(source)));
    expect(sanitized.ok && sanitized.project.adventureContext?.primaryContextId).toBe("woods");
    const config = buildCalendarConfigurationFile(source);
    const applied = applyCalendarConfigurationFile(createDefaultCalendarProject(), config);
    expect(applied.ok && applied.project.adventureContext?.secondaryContextIds).toEqual(["exploration"]);
  });
});
