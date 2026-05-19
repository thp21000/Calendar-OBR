import { describe, expect, it } from "vitest";
import {
  addCalendarEvent,
  createCalendarEvent,
  deleteCalendarEvent,
  eventOccursOnDay,
  getEventsForCurrentDay,
  getEventsForDay,
  sortEventsByDate,
  updateCalendarEvent
} from "../eventsLogic";
import type { CalendarDate, CalendarEvent, CalendarProject } from "../../domain/types";

const buildProject = (): CalendarProject => ({
  schemaVersion: 1,
  appVersion: "0.1.0",
  id: "project-1",
  name: "Test Calendar",
  locale: "fr",
  units: { temperature: "celsius", windSpeed: "kmh", rain: "mm" },
  currentTime: { absoluteDay: 0, hour: 10, minute: 0 },
  calendarSystem: {
    eraName: "CE",
    startYear: 1000,
    firstWeekdayOffset: 0,
    weekdays: [
      { id: "w1", name: "W1", shortName: "W1", order: 1 },
      { id: "w2", name: "W2", shortName: "W2", order: 2 }
    ],
    months: [
      { id: "m1", name: "M1", shortName: "M1", order: 1, days: 30 },
      { id: "m2", name: "M2", shortName: "M2", order: 2, days: 30 }
    ]
  },
  events: [],
  seasons: [],
  moons: [],
  weatherSettings: {},
  weatherEvents: [],
  uiSettings: { activeTab: "today", compactMode: false }
});

const makeEvent = (id: string, date: CalendarDate): CalendarEvent => ({
  id,
  name: id,
  date,
  recurrence: { type: "none" },
  summary: "",
  visibility: "gm",
  notifyOnTrigger: true,
  deleteAfterTrigger: false,
  archiveAfterTrigger: false,
  status: "active",
  allDay: false
});

describe("eventsLogic", () => {
  it("createCalendarEvent crée un événement valide avec les valeurs par défaut", () => {
    const date: CalendarDate = { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 14, minute: 5 };

    const event = createCalendarEvent({ name: "Marché", date });

    expect(event.id).toContain("event-");
    expect(event.name).toBe("Marché");
    expect(event.date).toEqual(date);
    expect(event.recurrence).toEqual({ type: "none" });
    expect(event.summary).toBe("");
    expect(event.visibility).toBe("gm");
    expect(event.notifyOnTrigger).toBe(true);
    expect(event.deleteAfterTrigger).toBe(false);
    expect(event.archiveAfterTrigger).toBe(false);
    expect(event.status).toBe("active");
    expect(event.allDay).toBe(false);
  });

  it("addCalendarEvent ajoute un événement", () => {
    const project = buildProject();
    const event = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 8, minute: 0 });

    const updated = addCalendarEvent(project, event);

    expect(updated.events).toHaveLength(1);
    expect(updated.events[0].id).toBe("e1");
    expect(project.events).toHaveLength(0);
  });

  it("updateCalendarEvent modifie un événement existant", () => {
    const event = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 8, minute: 0 });
    const project = { ...buildProject(), events: [event] };

    const updated = updateCalendarEvent(project, "e1", { name: "Nouveau nom", summary: "Desc" });

    expect(updated.events[0].name).toBe("Nouveau nom");
    expect(updated.events[0].summary).toBe("Desc");
  });

  it("deleteCalendarEvent supprime un événement", () => {
    const e1 = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 8, minute: 0 });
    const e2 = makeEvent("e2", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 8, minute: 0 });
    const project = { ...buildProject(), events: [e1, e2] };

    const updated = deleteCalendarEvent(project, "e1");

    expect(updated.events).toHaveLength(1);
    expect(updated.events[0].id).toBe("e2");
  });

  it("eventOccursOnDay retourne true pour le bon jour", () => {
    const event = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 12, minute: 0 });

    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 0, minute: 0 })).toBe(true);
  });

  it("eventOccursOnDay retourne false pour un autre jour", () => {
    const event = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 12, minute: 0 });

    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 4, hour: 0, minute: 0 })).toBe(false);
  });

  it("getEventsForDay retourne seulement les événements du jour demandé", () => {
    const target = { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 0, minute: 0 };
    const e1 = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 15, minute: 0 });
    const e2 = makeEvent("e2", { year: 1000, monthId: "m1", dayOfMonth: 4, hour: 9, minute: 0 });
    const e3 = makeEvent("e3", { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 8, minute: 30 });
    const project = { ...buildProject(), events: [e1, e2, e3] };

    const result = getEventsForDay(project, target);

    expect(result.map((event) => event.id)).toEqual(["e3", "e1"]);
  });

  it("getEventsForCurrentDay retourne les événements du jour actuel", () => {
    const project = buildProject();
    project.currentTime = { absoluteDay: 1, hour: 10, minute: 0 };
    const e1 = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 11, minute: 0 });
    const e2 = makeEvent("e2", { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 11, minute: 0 });
    project.events = [e1, e2];

    const result = getEventsForCurrentDay(project);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("e1");
  });

  it("sortEventsByDate trie correctement plusieurs événements", () => {
    const project = buildProject();
    const events = [
      makeEvent("e1", { year: 1001, monthId: "m1", dayOfMonth: 1, hour: 9, minute: 0 }),
      makeEvent("e2", { year: 1000, monthId: "m2", dayOfMonth: 1, hour: 9, minute: 0 }),
      makeEvent("e3", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 9, minute: 0 }),
      makeEvent("e4", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 8, minute: 59 })
    ];

    const sorted = sortEventsByDate(events, project);

    expect(sorted.map((event) => event.id)).toEqual(["e4", "e3", "e2", "e1"]);
  });

  it("un projet sans événement retourne une liste vide", () => {
    const project = buildProject();

    expect(getEventsForDay(project, { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 0, minute: 0 })).toEqual([]);
    expect(getEventsForCurrentDay(project)).toEqual([]);
  });
});
