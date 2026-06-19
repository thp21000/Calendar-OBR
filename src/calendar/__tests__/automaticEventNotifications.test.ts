import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import type { CalendarProject, WeatherEvent } from "../../domain/types";
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
});
