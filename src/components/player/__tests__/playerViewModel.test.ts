import { describe, expect, it } from "vitest";
import type { CalendarProject } from "../../../domain/types";
import type { PublicCalendarTodaySnapshot } from "../../../obr/publicSnapshot";
import { buildPlayerViewModelFromProject, buildPlayerViewModelFromSnapshot } from "../playerViewModel";

const baseProject = (): CalendarProject => ({
  schemaVersion: 1,
  appVersion: "0.1.0",
  id: "player-project",
  name: "Player Project",
  locale: "fr",
  units: { temperature: "celsius", windSpeed: "kmh", rain: "mm" },
  currentTime: { absoluteDay: 0, hour: 8, minute: 0 },
  calendarSystem: {
    eraName: "CE",
    startYear: 1000,
    firstWeekdayOffset: 0,
    weekdays: [{ id: "w1", name: "Lundi", order: 1 }],
    months: [{ id: "m1", name: "Janvier", order: 1, days: 30 }]
  },
  events: [],
  seasons: [],
  moons: [],
  moonEvents: [],
  dayNotes: [],
  weatherSettings: {},
  weatherEvents: [],
  uiSettings: { activeTab: "player", compactMode: false }
});

describe("playerViewModel", () => {
  it("construit la prévisualisation projet sans données MJ privées", () => {
    const project: CalendarProject = {
      ...baseProject(),
      events: [
        {
          id: "public-event",
          name: "Fête publique",
          date: { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 10, minute: 0 },
          recurrence: { type: "none" },
          summary: "Résumé public",
          gmDescription: "secret MJ",
          playerDescription: "description joueur",
          visibility: "players",
          notifyOnTrigger: true,
          deleteAfterTrigger: false,
          archiveAfterTrigger: false,
          status: "active"
        },
        {
          id: "gm-event",
          name: "Secret MJ",
          date: { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 11, minute: 0 },
          recurrence: { type: "none" },
          summary: "Résumé secret",
          gmDescription: "secret MJ",
          visibility: "gm",
          notifyOnTrigger: true,
          deleteAfterTrigger: false,
          archiveAfterTrigger: false,
          status: "active"
        }
      ],
      dayNotes: [
        { id: "player-note", date: { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 0, minute: 0 }, playerNote: "note joueur", gmNote: "note MJ", visibility: "players", updatedAt: 1 },
        { id: "gm-note", date: { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 0, minute: 0 }, gmNote: "note MJ", visibility: "gm", updatedAt: 1 }
      ]
    };

    const model = buildPlayerViewModelFromProject(project);
    const serialized = JSON.stringify(model);

    expect(model.events.map((event) => event.id)).toEqual(["public-event"]);
    expect(model.dayNotes).toEqual([{ id: "player-note", playerNote: "note joueur" }]);
    expect(serialized).not.toContain("Secret MJ");
    expect(serialized).not.toContain("secret MJ");
    expect(serialized).not.toContain("note MJ");
  });

  it("conserve les valeurs météo déjà converties du snapshot public", () => {
    const project: CalendarProject = { ...baseProject(), locale: "en", units: { temperature: "fahrenheit", windSpeed: "mph", rain: "inch" } };
    const snapshot: PublicCalendarTodaySnapshot = {
      schemaVersion: 1,
      revision: 1,
      updatedAt: 1,
      calendarName: "Snapshot Calendar",
      locale: "en",
      currentTime: project.currentTime,
      formattedDate: "Monday 1 January 1000, 08:00",
      weatherBiome: { name: "Forest", icon: "🌲", description: "Woods" },
      moons: [],
      eventsToday: [],
      weatherEventsToday: [],
      moonEventsToday: [],
      dayNotesToday: [],
      weather: {
        temperature: 68,
        windSpeed: 31,
        windDirection: "NE",
        rain: 1,
        state: "clear",
        dailyRainTotal: 2,
        units: { temperature: "°F", windSpeed: "mph", rain: "in/h", rainTotal: "in" }
      }
    };

    const model = buildPlayerViewModelFromSnapshot(project, snapshot);

    expect(model.weather?.temperature).toBe("68 °F");
    expect(model.weather?.wind).toBe("NE · 31 mph");
    expect(model.weather?.rain).toBe("1 in/h");
    expect(model.weather?.dailyRainTotal).toBe("2 in");
  });
});
