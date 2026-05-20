import { describe, expect, it } from "vitest";
import { formatEventRecurrence, formatEventTimeShort } from "../formatEvent";
import type { CalendarEvent, CalendarProject } from "../../domain/types";

const project: CalendarProject = {
  schemaVersion: 1,
  appVersion: "0.1.0",
  id: "p1",
  name: "Test",
  locale: "fr",
  units: { temperature: "celsius", windSpeed: "kmh", rain: "mm" },
  currentTime: { absoluteDay: 0, hour: 0, minute: 0 },
  calendarSystem: {
    eraName: "CE",
    startYear: 1000,
    weekdays: [{ id: "w1", name: "Lundi", order: 1 }],
    months: [{ id: "m1", name: "Janvier", order: 1, days: 30 }]
  },
  events: [],
  seasons: [],
  moons: [],
  weatherSettings: {},
  weatherEvents: [],
  uiSettings: { activeTab: "today", compactMode: false }
};

const baseEvent: CalendarEvent = {
  id: "e1",
  name: "Event",
  date: { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 12, minute: 15 },
  recurrence: { type: "none" },
  summary: "",
  visibility: "gm",
  notifyOnTrigger: true,
  deleteAfterTrigger: false,
  archiveAfterTrigger: false,
  status: "active",
  allDay: false
};

describe("formatEventTimeShort", () => {
  it("affiche Toute la journée pour un événement allDay", () => {
    expect(formatEventTimeShort(project, { ...baseEvent, allDay: true })).toBe("Toute la journée");
  });

  it("affiche HH:mm pour un événement simple", () => {
    expect(formatEventTimeShort(project, baseEvent)).toBe("12:15");
  });

  it("affiche plage horaire pour fin le même jour", () => {
    expect(
      formatEventTimeShort(project, {
        ...baseEvent,
        endDate: { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 14, minute: 0 }
      })
    ).toBe("12:15 → 14:00");
  });
});

describe("formatEventRecurrence", () => {
  it("none -> Aucune", () => {
    expect(formatEventRecurrence(project, baseEvent)).toBe("Aucune");
  });
  it("everyXDays 1 -> Tous les 1 jours", () => {
    expect(formatEventRecurrence(project, { ...baseEvent, recurrence: { type: "everyXDays", interval: 1 } })).toBe("Tous les 1 jours");
  });
  it("everyXDays 3 -> Tous les 3 jours", () => {
    expect(formatEventRecurrence(project, { ...baseEvent, recurrence: { type: "everyXDays", interval: 3 } })).toBe("Tous les 3 jours");
  });
  it("everyXMonths 1 -> Tous les 1 mois", () => {
    expect(formatEventRecurrence(project, { ...baseEvent, recurrence: { type: "everyXMonths", interval: 1 } })).toBe("Tous les 1 mois");
  });
  it("yearly 1 -> Tous les 1 ans", () => {
    expect(formatEventRecurrence(project, { ...baseEvent, recurrence: { type: "yearly", interval: 1 } })).toBe("Tous les 1 ans");
  });
  it("yearly 2 -> Tous les 2 ans", () => {
    expect(formatEventRecurrence(project, { ...baseEvent, recurrence: { type: "yearly", interval: 2 } })).toBe("Tous les 2 ans");
  });
});