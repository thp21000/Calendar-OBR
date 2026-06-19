import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import type { CalendarEvent, CalendarProject, WeatherEvent } from "../../domain/types";
import { absoluteDayToCalendarDate } from "../dateEngine";
import { processAutomaticEventNotifications } from "../automaticEventNotifications";

const weatherEvent = (patch: Partial<WeatherEvent> = {}): WeatherEvent => ({
  id: "auto-rain",
  name: "Automatic rain",
  summary: "Rain starts",
  playerDescription: "Rain for players",
  visibility: "players",
  visibilityMode: "auto",
  notifyOnTrigger: true,
  status: "active",
  enabled: true,
  requireAllConditions: true,
  conditions: [{ type: "timeOfDay", startHour: 10, endHour: 10 }],
  ...patch
});

const projectWithEvent = (event: WeatherEvent): CalendarProject => ({
  ...createDefaultCalendarProject(),
  currentTime: { absoluteDay: 0, hour: 9, minute: 0 },
  weatherEvents: [event],
  uiSettings: {
    ...createDefaultCalendarProject().uiSettings,
    playerView: {
      ...createDefaultCalendarProject().uiSettings.playerView!,
      today: { ...createDefaultCalendarProject().uiSettings.playerView!.today, showWeatherEvents: true }
    }
  }
});

const datedEvent = (project: CalendarProject, absoluteDay: number, patch: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: "festival",
  name: "Festival",
  date: absoluteDayToCalendarDate({ absoluteDay, hour: 0, minute: 0 }, project.calendarSystem),
  recurrence: { type: "none" },
  summary: "Festival summary",
  playerDescription: "Festival for players",
  visibility: "players",
  notifyOnTrigger: true,
  deleteAfterTrigger: false,
  archiveAfterTrigger: false,
  status: "active",
  allDay: true,
  ...patch
});

describe("processAutomaticEventNotifications", () => {
  it("notifies GM and players once when an automatic weather event becomes public-active", () => {
    const previous = projectWithEvent(weatherEvent());
    const next = { ...previous, currentTime: { absoluteDay: 0, hour: 10, minute: 0 } };

    const first = processAutomaticEventNotifications(previous, next);
    const second = processAutomaticEventNotifications(next, first.project);

    expect(first.effects.map((effect) => `${effect.channel}:${effect.type}:${effect.event.id}`)).toEqual([
      "gm:weather:auto-rain",
      "players:weather:auto-rain"
    ]);
    expect(first.project.automaticNotificationState?.weatherEventActivations["auto-rain"]).toBe("auto-rain:600");
    expect(second.effects).toEqual([]);
  });

  it("does not notify players for gmOnly or smart-hidden weather events", () => {
    const hiddenByLimit = weatherEvent({ id: "hidden", displayPriority: 0 });
    const visibleCompetitor = weatherEvent({ id: "visible", name: "Visible", displayPriority: 100 });
    const previous = {
      ...projectWithEvent(hiddenByLimit),
      weatherEvents: [hiddenByLimit, visibleCompetitor],
      eventDisplaySettings: {
        weatherFamilyArbitrationEnabled: false,
        weatherDisplayLimitEnabled: true,
        maxVisibleWeatherEvents: 1,
        weatherAntiRepeatEnabled: false,
        weatherAntiRepeatWindowHours: 48,
        lunarPhaseArbitrationEnabled: false,
        lunarDisplayLimitEnabled: false,
        maxVisibleLunarEventsPerPhase: 1,
        lunarAntiRepeatEnabled: false,
        lunarAntiRepeatWindowHours: 48
      }
    };
    const next = { ...previous, currentTime: { absoluteDay: 0, hour: 10, minute: 0 } };

    const result = processAutomaticEventNotifications(previous, next);

    expect(result.effects.filter((effect) => effect.channel === "gm").map((effect) => effect.event.id).sort()).toEqual(["hidden", "visible"]);
    expect(result.effects.filter((effect) => effect.channel === "players").map((effect) => effect.event.id)).toEqual(["visible"]);
  });

it("notifies players once when a public dated event becomes visible for the new day", () => {
    const base = createDefaultCalendarProject();
    const event = datedEvent(base, 1);
    const previous = { ...base, currentTime: { absoluteDay: 0, hour: 23, minute: 55 }, events: [event], weatherEvents: [] };
    const next = { ...previous, currentTime: { absoluteDay: 1, hour: 0, minute: 0 } };

    const first = processAutomaticEventNotifications(previous, next);
    const second = processAutomaticEventNotifications(next, first.project);
    const sameDay = processAutomaticEventNotifications(first.project, { ...first.project, currentTime: { absoluteDay: 1, hour: 12, minute: 0 } });

    expect(first.effects.map((effect) => `${effect.channel}:${effect.type}:${effect.event.id}`)).toContain("players:event:festival");
    expect(first.project.datedEventNotificationState?.notifiedEventDateKeys["festival:1"]).toBe(true);
    expect(second.effects.filter((effect) => effect.type === "event")).toEqual([]);
    expect(sameDay.effects.filter((effect) => effect.type === "event")).toEqual([]);
  });

  it("does not notify players for private dated events", () => {
    const base = createDefaultCalendarProject();
    const event = datedEvent(base, 1, { id: "secret", visibility: "gm" });
    const previous = { ...base, currentTime: { absoluteDay: 0, hour: 23, minute: 55 }, events: [event], weatherEvents: [] };
    const next = { ...previous, currentTime: { absoluteDay: 1, hour: 0, minute: 0 } };

    const result = processAutomaticEventNotifications(previous, next);

    expect(result.effects.filter((effect) => effect.type === "event")).toEqual([]);
  });

  it("does not notify dated events when player day events are hidden", () => {
    const base = createDefaultCalendarProject();
    const event = datedEvent(base, 1);
    const previous = {
      ...base,
      currentTime: { absoluteDay: 0, hour: 23, minute: 55 },
      events: [event],
      weatherEvents: [],
      uiSettings: {
        ...base.uiSettings,
        playerView: {
          ...base.uiSettings.playerView!,
          today: { ...base.uiSettings.playerView!.today, showEvents: false }
        }
      }
    };
    const next = { ...previous, currentTime: { absoluteDay: 1, hour: 0, minute: 0 } };

    const result = processAutomaticEventNotifications(previous, next);

    expect(result.effects.filter((effect) => effect.type === "event")).toEqual([]);
  });
});