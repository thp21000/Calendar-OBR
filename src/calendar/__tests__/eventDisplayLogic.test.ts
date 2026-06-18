import { describe, expect, it } from "vitest";
import { DEFAULT_EVENT_DISPLAY_HISTORY, DEFAULT_EVENT_DISPLAY_SETTINGS, selectVisibleLunarEvents, selectVisibleWeatherEvents } from "../eventDisplayLogic";
import { createDefaultWeatherEvent } from "../weatherEventsLogic";
import { createDefaultMoonEvent } from "../moonEventsLogic";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";

describe("eventDisplayLogic", () => {
  it("keeps one weather event per family when family arbitration is enabled", () => {
    const base = createDefaultWeatherEvent("fr");
    const result = selectVisibleWeatherEvents({
      activeEvents: [
        { ...base, id: "minor", name: "Minor", displayFamilyId: "rain", displayPriority: 20 },
        { ...base, id: "major", name: "Major", displayFamilyId: "rain", displayPriority: 80 }
      ],
      settings: { ...DEFAULT_EVENT_DISPLAY_SETTINGS, weatherFamilyArbitrationEnabled: true },
      history: DEFAULT_EVENT_DISPLAY_HISTORY,
      absoluteMinutes: 120,
      seed: "test"
    });
    expect(result.visibleEvents.map((event) => event.id)).toEqual(["major"]);
    expect(result.hiddenEvents.map((event) => event.id)).toEqual(["minor"]);
    expect(result.hiddenReasons.minor).toBe("family");
  });

  it("keeps ignoreDisplayLimit weather events visible before applying the limit", () => {
    const base = createDefaultWeatherEvent("fr");
    const result = selectVisibleWeatherEvents({
      activeEvents: [
        { ...base, id: "critical", name: "Critical", displayPriority: 100, ignoreDisplayLimit: true },
        { ...base, id: "standard", name: "Standard", displayPriority: 80 },
        { ...base, id: "ambient", name: "Ambient", displayPriority: 10 }
      ],
      settings: { ...DEFAULT_EVENT_DISPLAY_SETTINGS, weatherDisplayLimitEnabled: true, maxVisibleWeatherEvents: 1 },
      history: DEFAULT_EVENT_DISPLAY_HISTORY,
      absoluteMinutes: 120,
      seed: "test"
    });
    expect(result.visibleEvents.map((event) => event.id)).toEqual(["critical", "standard"]);
    expect(result.hiddenEvents.map((event) => event.id)).toEqual(["ambient"]);
  });

  it("limits lunar events per phase after phase/family arbitration", () => {
    const project = createDefaultCalendarProject();
    const base = createDefaultMoonEvent(project);
    const result = selectVisibleLunarEvents({
      activeEvents: [
        { ...base, id: "a", name: "A", phaseId: "full", displayPriority: 70 },
        { ...base, id: "b", name: "B", phaseId: "full", displayPriority: 20 },
        { ...base, id: "c", name: "C", phaseId: "new", displayPriority: 20 }
      ],
      settings: { ...DEFAULT_EVENT_DISPLAY_SETTINGS, lunarDisplayLimitEnabled: true, maxVisibleLunarEventsPerPhase: 1 },
      history: DEFAULT_EVENT_DISPLAY_HISTORY,
      absoluteMinutes: 120,
      seed: "test"
    });
    expect(result.visibleEvents.map((event) => event.id)).toEqual(["a", "c"]);
    expect(result.hiddenEvents.map((event) => event.id)).toEqual(["b"]);
  });
});
