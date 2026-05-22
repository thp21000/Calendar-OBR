import { describe, expect, it } from "vitest";
import {
  addCalendarEvent,
  createCalendarEvent,
  deleteCalendarEvent,
  eventOccursOnDay,
  getEventsForCurrentDay,
  getPlayerVisibleEventsForDay,
  getEventsForDay,
  sortEventsByDate,
  updateCalendarEvent,
  isImageUrl,
  isEventEndBeforeStart,
  normalizeEventDateRange,
  getTriggeredEventsBetween,
  getCompletedEventsBetween,
  applyEventCompletionActions,
  getEventTimeBucket,
  duplicateCalendarEvent,
  revealCalendarEvent,
  getReminderEventsBetween
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

  it("isImageUrl détecte les extensions image supportées", () => {
    expect(isImageUrl("https://a/icon.png")).toBe(true);
    expect(isImageUrl("https://a/icon.jpg")).toBe(true);
    expect(isImageUrl("https://a/icon.jpeg")).toBe(true);
    expect(isImageUrl("https://a/icon.gif")).toBe(true);
    expect(isImageUrl("https://a/icon.webp")).toBe(true);
    expect(isImageUrl("https://a/icon.svg")).toBe(true);
  });

  it("isImageUrl retourne true avec paramètres URL", () => {
    expect(isImageUrl("https://site.com/icon.png?token=abc")).toBe(true);
  });

  it("isImageUrl retourne false pour emoji ou texte", () => {
    expect(isImageUrl("🔥")).toBe(false);
    expect(isImageUrl("sword")).toBe(false);
  });

  it("createCalendarEvent peut créer un événement allDay", () => {
    const date: CalendarDate = { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 9, minute: 0 };
    const event = createCalendarEvent({ name: "Fête", date, allDay: true });
    expect(event.allDay).toBe(true);
  });

  it("createCalendarEvent peut créer un événement avec endDate", () => {
    const date: CalendarDate = { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 9, minute: 0 };
    const endDate: CalendarDate = { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 10, minute: 0 };
    const event = createCalendarEvent({ name: "Réunion", date, endDate });
    expect(event.endDate).toEqual(endDate);
  });

  it("normalizeEventDateRange corrige une fin avant le début", () => {
    const project = buildProject();
    const startDate: CalendarDate = { year: 1000, monthId: "m1", dayOfMonth: 5, hour: 12, minute: 0 };
    const endDate: CalendarDate = { year: 1000, monthId: "m1", dayOfMonth: 5, hour: 10, minute: 0 };

    expect(isEventEndBeforeStart(project, startDate, endDate)).toBe(true);
    expect(normalizeEventDateRange(project, startDate, endDate)).toEqual(startDate);
  });
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

  it("updateCalendarEvent garde le même id et ne crée pas de nouvel événement", () => {
    const event = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 8, minute: 0 });
    const project = { ...buildProject(), events: [event] };

    const updated = updateCalendarEvent(project, "e1", {
      name: "Nom modifié",
      summary: "Résumé modifié",
      date: { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 10, minute: 30 }
    });

    expect(updated.events).toHaveLength(1);
    expect(updated.events[0].id).toBe("e1");
    expect(updated.events[0].name).toBe("Nom modifié");
    expect(updated.events[0].summary).toBe("Résumé modifié");
    expect(updated.events[0].date.dayOfMonth).toBe(2);
  });

  it("deleteCalendarEvent supprime un événement", () => {
    const e1 = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 8, minute: 0 });
    const e2 = makeEvent("e2", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 8, minute: 0 });
    const project = { ...buildProject(), events: [e1, e2] };

    const updated = deleteCalendarEvent(project, "e1");

    expect(updated.events).toHaveLength(1);
    expect(updated.events[0].id).toBe("e2");
  });

  it("duplicateCalendarEvent crée un nouvel id et garde le contenu utile", () => {
    const source = {
      ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 9, minute: 0 }),
      name: "Rituel",
      summary: "Résumé",
      visibility: "revealOnTrigger" as const,
      status: "archived" as const,
      endDate: { year: 1000, monthId: "m1", dayOfMonth: 4, hour: 9, minute: 0 }
    };
    const project = { ...buildProject(), events: [source] };

    const updated = duplicateCalendarEvent(project, "e1");

    expect(updated.events).toHaveLength(2);
    const copy = updated.events.find((event) => event.id !== "e1");
    expect(copy).toBeDefined();
    expect(copy?.id).not.toBe("e1");
    expect(copy?.name).toBe("Rituel (copie)");
    expect(copy?.date).toEqual(source.date);
    expect(copy?.endDate).toEqual(source.endDate);
    expect(copy?.summary).toBe(source.summary);
    expect(copy?.visibility).toBe(source.visibility);
    expect(copy?.status).toBe("active");
  });

  it("revealCalendarEvent passe revealOnTrigger en triggered", () => {
    const hidden = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 8, minute: 0 }), visibility: "revealOnTrigger" as const, status: "active" as const };
    const project = { ...buildProject(), events: [hidden] };

    const updated = revealCalendarEvent(project, "e1");

    expect(updated.events[0].status).toBe("triggered");
  });

  it("revealCalendarEvent ne modifie pas un événement gm", () => {
    const gmEvent = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 8, minute: 0 }), visibility: "gm" as const, status: "active" as const };
    const project = { ...buildProject(), events: [gmEvent] };

    const updated = revealCalendarEvent(project, "e1");

    expect(updated.events[0].status).toBe("active");
  });

  it("revealCalendarEvent ne modifie pas un revealOnTrigger archivé", () => {
    const archivedReveal = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 8, minute: 0 }), visibility: "revealOnTrigger" as const, status: "archived" as const };
    const project = { ...buildProject(), events: [archivedReveal] };

    const updated = revealCalendarEvent(project, "e1");

    expect(updated.events[0].status).toBe("archived");
  });

  it("revealCalendarEvent ne modifie pas un revealOnTrigger désactivé", () => {
    const disabledReveal = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 8, minute: 0 }), visibility: "revealOnTrigger" as const, status: "disabled" as const };
    const project = { ...buildProject(), events: [disabledReveal] };

    const updated = revealCalendarEvent(project, "e1");

    expect(updated.events[0].status).toBe("disabled");
  });

  it("revealCalendarEvent ne modifie pas un événement players", () => {
    const playersEvent = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 8, minute: 0 }), visibility: "players" as const, status: "active" as const };
    const project = { ...buildProject(), events: [playersEvent] };

    const updated = revealCalendarEvent(project, "e1");

    expect(updated.events[0].status).toBe("active");
  });

  it("eventOccursOnDay retourne true pour le bon jour", () => {
    const event = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 12, minute: 0 });

    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 0, minute: 0 }, buildProject())).toBe(true);
  });

  it("eventOccursOnDay retourne false pour un autre jour", () => {
    const event = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 12, minute: 0 });

    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 4, hour: 0, minute: 0 }, buildProject())).toBe(false);
  });

  it("événement sans endDate apparaît seulement le jour de début", () => {
    const project = buildProject();
    const event = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 4, hour: 12, minute: 0 });
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 4, hour: 0, minute: 0 }, project)).toBe(true);
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 5, hour: 0, minute: 0 }, project)).toBe(false);
  });

  it("événement avec endDate même jour apparaît seulement ce jour", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 4, hour: 10, minute: 0 }), endDate: { year: 1000, monthId: "m1", dayOfMonth: 4, hour: 12, minute: 0 } };
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 4, hour: 0, minute: 0 }, project)).toBe(true);
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 5, hour: 0, minute: 0 }, project)).toBe(false);
  });

  it("événement multi-jours apparaît du début à la fin inclus", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 4, hour: 12, minute: 0 }), endDate: { year: 1000, monthId: "m1", dayOfMonth: 6, hour: 18, minute: 0 } };
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 4, hour: 0, minute: 0 }, project)).toBe(true);
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 5, hour: 0, minute: 0 }, project)).toBe(true);
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 6, hour: 0, minute: 0 }, project)).toBe(true);
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 0, minute: 0 }, project)).toBe(false);
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 7, hour: 0, minute: 0 }, project)).toBe(false);
  });

  it("événement 23:00 à 01:00 lendemain apparaît sur les deux jours", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 4, hour: 23, minute: 0 }), endDate: { year: 1000, monthId: "m1", dayOfMonth: 5, hour: 1, minute: 0 } };
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 4, hour: 0, minute: 0 }, project)).toBe(true);
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 5, hour: 0, minute: 0 }, project)).toBe(true);
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

  it("getEventsForDay n'inclut pas les événements archived et disabled", () => {
    const target = { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 0, minute: 0 };
    const active = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 10, minute: 0 });
    const triggered = { ...makeEvent("e2", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 11, minute: 0 }), status: "triggered" as const };
    const archived = { ...makeEvent("e3", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 12, minute: 0 }), status: "archived" as const };
    const disabled = { ...makeEvent("e4", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 13, minute: 0 }), status: "disabled" as const };
    const project = { ...buildProject(), events: [active, triggered, archived, disabled] };

    expect(getEventsForDay(project, target).map((event) => event.id)).toEqual(["e1", "e2"]);
  });

  it("getPlayerVisibleEventsForDay filtre selon visibilité joueur", () => {
    const target = { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 0, minute: 0 };
    const playersEvent = { ...makeEvent("players", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 8, minute: 0 }), visibility: "players" as const };
    const gmEvent = { ...makeEvent("gm", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 9, minute: 0 }), visibility: "gm" as const };
    const revealHidden = { ...makeEvent("reveal-hidden", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 10, minute: 0 }), visibility: "revealOnTrigger" as const, status: "active" as const };
    const revealShown = { ...makeEvent("reveal-shown", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 11, minute: 0 }), visibility: "revealOnTrigger" as const, status: "triggered" as const };
    const archivedPlayers = { ...makeEvent("archived", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 12, minute: 0 }), visibility: "players" as const, status: "archived" as const };

    const project = { ...buildProject(), events: [playersEvent, gmEvent, revealHidden, revealShown, archivedPlayers] };
    expect(getPlayerVisibleEventsForDay(project, target).map((event) => event.id)).toEqual(["players", "reveal-shown"]);
  });

  it("getEventTimeBucket: non récurrent avant aujourd'hui => past", () => {
    const project = buildProject();
    project.currentTime = { absoluteDay: 5, hour: 10, minute: 0 };
    const event = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 9, minute: 0 });
    expect(getEventTimeBucket(project, event)).toBe("past");
  });

  it("getEventTimeBucket: non récurrent aujourd'hui => today", () => {
    const project = buildProject();
    project.currentTime = { absoluteDay: 2, hour: 10, minute: 0 };
    const event = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 9, minute: 0 });
    expect(getEventTimeBucket(project, event)).toBe("today");
  });

  it("getEventTimeBucket: non récurrent après aujourd'hui => future", () => {
    const project = buildProject();
    project.currentTime = { absoluteDay: 1, hour: 10, minute: 0 };
    const event = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 9, minute: 0 });
    expect(getEventTimeBucket(project, event)).toBe("future");
  });

  it("getEventTimeBucket: multi-jours couvrant aujourd'hui => today", () => {
    const project = buildProject();
    project.currentTime = { absoluteDay: 2, hour: 10, minute: 0 };
    const event = {
      ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 9, minute: 0 }),
      endDate: { year: 1000, monthId: "m1", dayOfMonth: 4, hour: 9, minute: 0 }
    };
    expect(getEventTimeBucket(project, event)).toBe("today");
  });

  it("getEventTimeBucket: récurrent actif tombant aujourd'hui => today", () => {
    const project = buildProject();
    project.currentTime = { absoluteDay: 2, hour: 10, minute: 0 };
    const event = {
      ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 9, minute: 0 }),
      recurrence: { type: "everyXDays" as const, interval: 2 }
    };
    expect(getEventTimeBucket(project, event)).toBe("today");
  });

  it("getEventTimeBucket: récurrent actif ne tombant pas aujourd'hui => future", () => {
    const project = buildProject();
    project.currentTime = { absoluteDay: 1, hour: 10, minute: 0 };
    const event = {
      ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 9, minute: 0 }),
      recurrence: { type: "everyXDays" as const, interval: 2 }
    };
    expect(getEventTimeBucket(project, event)).toBe("future");
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

  it("événement endDate traverse changement de mois", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 30, hour: 12, minute: 0 }), endDate: { year: 1000, monthId: "m2", dayOfMonth: 2, hour: 10, minute: 0 } };
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 30, hour: 0, minute: 0 }, project)).toBe(true);
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m2", dayOfMonth: 1, hour: 0, minute: 0 }, project)).toBe(true);
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m2", dayOfMonth: 2, hour: 0, minute: 0 }, project)).toBe(true);
  });

  it("événement endDate traverse changement d'année", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m2", dayOfMonth: 30, hour: 12, minute: 0 }), endDate: { year: 1001, monthId: "m1", dayOfMonth: 2, hour: 10, minute: 0 } };
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m2", dayOfMonth: 30, hour: 0, minute: 0 }, project)).toBe(true);
    expect(eventOccursOnDay(event, { year: 1001, monthId: "m1", dayOfMonth: 1, hour: 0, minute: 0 }, project)).toBe(true);
  });

  it("everyXDays: occurrences selon intervalle", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 9, minute: 0 }), recurrence: { type: "everyXDays" as const, interval: 3 } };
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 0, minute: 0 }, project)).toBe(true);
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 4, hour: 0, minute: 0 }, project)).toBe(true);
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 0, minute: 0 }, project)).toBe(false);
    expect(eventOccursOnDay(event, { year: 999, monthId: "m2", dayOfMonth: 30, hour: 0, minute: 0 }, project)).toBe(false);
  });

  it("everyXDays: interval <= 0 retourne false", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 9, minute: 0 }), recurrence: { type: "everyXDays" as const, interval: 0 } };
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 0, minute: 0 }, project)).toBe(false);
  });

  it("everyXDays multi-jours: couvre chaque occurrence sur sa durée", () => {
    const project = buildProject();
    const event = {
      ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 9, minute: 0 }),
      endDate: { year: 1000, monthId: "m1", dayOfMonth: 3, hour: 9, minute: 0 },
      recurrence: { type: "everyXDays" as const, interval: 7 }
    };
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 0, minute: 0 }, project)).toBe(true);
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 8, hour: 0, minute: 0 }, project)).toBe(true);
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 9, hour: 0, minute: 0 }, project)).toBe(true);
  });

  it("everyXMonths: mois de départ, mois cible, mois intermédiaire", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 10, hour: 9, minute: 0 }), recurrence: { type: "everyXMonths" as const, interval: 2 } };
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 10, hour: 0, minute: 0 }, project)).toBe(true);
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m2", dayOfMonth: 10, hour: 0, minute: 0 }, project)).toBe(false);
    expect(eventOccursOnDay(event, { year: 1001, monthId: "m1", dayOfMonth: 10, hour: 0, minute: 0 }, project)).toBe(true);
  });

  it("everyXMonths: clamp au dernier jour du mois cible", () => {
    const project = buildProject();
    project.calendarSystem.months = [
      { id: "m1", name: "M1", order: 1, days: 31 },
      { id: "m2", name: "M2", order: 2, days: 30 }
    ];
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 31, hour: 9, minute: 0 }), recurrence: { type: "everyXMonths" as const, interval: 1 } };
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m2", dayOfMonth: 30, hour: 0, minute: 0 }, project)).toBe(true);
  });

  it("everyXMonths: interval <= 0 retourne false", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 10, hour: 9, minute: 0 }), recurrence: { type: "everyXMonths" as const, interval: 0 } };
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 10, hour: 0, minute: 0 }, project)).toBe(false);
  });

  it("yearly: année de départ, après intervalle, année intermédiaire", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 12, hour: 9, minute: 0 }), recurrence: { type: "yearly" as const, interval: 2 } };
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 12, hour: 0, minute: 0 }, project)).toBe(true);
    expect(eventOccursOnDay(event, { year: 1001, monthId: "m1", dayOfMonth: 12, hour: 0, minute: 0 }, project)).toBe(false);
    expect(eventOccursOnDay(event, { year: 1002, monthId: "m1", dayOfMonth: 12, hour: 0, minute: 0 }, project)).toBe(true);
  });

  it("yearly: clamp du jour au dernier jour valide", () => {
    const project = buildProject();
    project.calendarSystem.months = [
      { id: "m1", name: "M1", order: 1, days: 31 },
      { id: "m2", name: "M2", order: 2, days: 30 }
    ];
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 31, hour: 9, minute: 0 }), recurrence: { type: "yearly" as const, interval: 1 } };
    expect(eventOccursOnDay(event, { year: 1001, monthId: "m1", dayOfMonth: 31, hour: 0, minute: 0 }, project)).toBe(true);
  });

  it("yearly: interval <= 0 retourne false", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 12, hour: 9, minute: 0 }), recurrence: { type: "yearly" as const, interval: 0 } };
    expect(eventOccursOnDay(event, { year: 1000, monthId: "m1", dayOfMonth: 12, hour: 0, minute: 0 }, project)).toBe(false);
  });

  it("getTriggeredEventsBetween: simple event entre from exclu et to inclus", () => {
    const project = buildProject();
    const event = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 12, minute: 15 });
    project.events = [event];
    const triggered = getTriggeredEventsBetween(project, { absoluteDay: 0, hour: 12, minute: 0 }, { absoluteDay: 0, hour: 13, minute: 0 });
    expect(triggered.map((e) => e.id)).toEqual(["e1"]);
  });

  it("getTriggeredEventsBetween: bornes from exclusif et to inclusif", () => {
    const project = buildProject();
    const atFrom = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 12, minute: 0 });
    const atTo = makeEvent("e2", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 13, minute: 0 });
    project.events = [atFrom, atTo];
    const triggered = getTriggeredEventsBetween(project, { absoluteDay: 0, hour: 12, minute: 0 }, { absoluteDay: 0, hour: 13, minute: 0 });
    expect(triggered.map((e) => e.id)).toEqual(["e2"]);
  });

  it("getTriggeredEventsBetween: ignore notifyOnTrigger false / archived / disabled", () => {
    const project = buildProject();
    const base = { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 12, minute: 15 };
    const noNotify = { ...makeEvent("e1", base), notifyOnTrigger: false };
    const archived = { ...makeEvent("e2", base), status: "archived" as const };
    const disabled = { ...makeEvent("e3", base), status: "disabled" as const };
    project.events = [noNotify, archived, disabled];
    const triggered = getTriggeredEventsBetween(project, { absoluteDay: 0, hour: 12, minute: 0 }, { absoluteDay: 0, hour: 13, minute: 0 });
    expect(triggered).toEqual([]);
  });

  it("getTriggeredEventsBetween: déclenche une occurrence everyXDays", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 10, minute: 0 }), recurrence: { type: "everyXDays" as const, interval: 2 } };
    project.events = [event];
    const triggered = getTriggeredEventsBetween(project, { absoluteDay: 1, hour: 9, minute: 0 }, { absoluteDay: 2, hour: 10, minute: 0 });
    expect(triggered.map((e) => e.id)).toEqual(["e1"]);
  });

  it("getTriggeredEventsBetween: déclenche une occurrence everyXMonths", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 10, hour: 8, minute: 0 }), recurrence: { type: "everyXMonths" as const, interval: 1 } };
    project.events = [event];
    const from = { absoluteDay: 35, hour: 0, minute: 0 }; // around m2
    const to = { absoluteDay: 40, hour: 23, minute: 59 };
    const triggered = getTriggeredEventsBetween(project, from, to);
    expect(triggered.map((e) => e.id)).toEqual(["e1"]);
  });

  it("getTriggeredEventsBetween: déclenche une occurrence yearly", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 5, hour: 9, minute: 0 }), recurrence: { type: "yearly" as const, interval: 1 } };
    project.events = [event];
    const from = { absoluteDay: 60, hour: 0, minute: 0 };
    const to = { absoluteDay: 65, hour: 23, minute: 59 };
    const triggered = getTriggeredEventsBetween(project, from, to);
    expect(triggered.map((e) => e.id)).toEqual(["e1"]);
  });
  
  it("getTriggeredEventsBetween: all-day déclenché à 00:00", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 0, minute: 0 }), allDay: true };
    project.events = [event];
    const triggered = getTriggeredEventsBetween(project, { absoluteDay: 0, hour: 23, minute: 55 }, { absoluteDay: 1, hour: 0, minute: 0 });
    expect(triggered.map((e) => e.id)).toEqual(["e1"]);
  });

  it("getTriggeredEventsBetween: ancien all-day mal stocké est normalisé à 00:00", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 12, minute: 15 }), allDay: true };
    project.events = [event];
    const triggered = getTriggeredEventsBetween(project, { absoluteDay: 0, hour: 23, minute: 55 }, { absoluteDay: 1, hour: 0, minute: 0 });
    expect(triggered.map((e) => e.id)).toEqual(["e1"]);
  });

  it("getTriggeredEventsBetween: all-day déjà commencé ne se redéclenche pas", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 0, minute: 0 }), allDay: true };
    project.events = [event];
    const triggered = getTriggeredEventsBetween(project, { absoluteDay: 1, hour: 0, minute: 30 }, { absoluteDay: 1, hour: 0, minute: 35 });
    expect(triggered).toEqual([]);
  });

  it("getTriggeredEventsBetween: yearly all-day déclenché à minuit", () => {
    const project = buildProject();
    const event = {
      ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 16, minute: 45 }),
      allDay: true,
      recurrence: { type: "yearly" as const, interval: 1 }
    };
    project.events = [event];
    // année suivante, jour 2 du mois m1 => absoluteDay 60+1 = 61
    const triggered = getTriggeredEventsBetween(project, { absoluteDay: 60, hour: 23, minute: 55 }, { absoluteDay: 61, hour: 0, minute: 0 });
    expect(triggered.map((e) => e.id)).toEqual(["e1"]);
  });
  
  it("un projet sans événement retourne une liste vide", () => {
    const project = buildProject();

    expect(getEventsForDay(project, { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 0, minute: 0 })).toEqual([]);
    expect(getEventsForCurrentDay(project)).toEqual([]);
  });
});

it("getReminderEventsBetween: événement sans rappel = aucun", () => {
    const e = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 13, minute: 0 });
    const project = { ...buildProject(), events: [e] };
    const result = getReminderEventsBetween(project, { absoluteDay: 0, hour: 11, minute: 59 }, { absoluteDay: 0, hour: 12, minute: 1 });
    expect(result).toEqual([]);
  });

  it("getReminderEventsBetween: rappel 60 min détecté", () => {
    const e = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 13, minute: 0 }), reminderEnabled: true, reminderMinutesBefore: 60 };
    const project = { ...buildProject(), events: [e] };
    const result = getReminderEventsBetween(project, { absoluteDay: 0, hour: 11, minute: 59 }, { absoluteDay: 0, hour: 12, minute: 0 });
    expect(result.map((x)=>x.id)).toEqual(["e1"]);
  });

  it("getReminderEventsBetween: fenêtre hors rappel = aucun", () => {
    const e = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 13, minute: 0 }), reminderEnabled: true, reminderMinutesBefore: 60 };
    const project = { ...buildProject(), events: [e] };
    const result = getReminderEventsBetween(project, { absoluteDay: 0, hour: 12, minute: 1 }, { absoluteDay: 0, hour: 12, minute: 59 });
    expect(result).toEqual([]);
  });

  it("getReminderEventsBetween: archived/disabled ignorés", () => {
    const a = { ...makeEvent("a", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 13, minute: 0 }), reminderEnabled: true, reminderMinutesBefore: 60, status: "archived" as const };
    const d = { ...makeEvent("d", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 13, minute: 0 }), reminderEnabled: true, reminderMinutesBefore: 60, status: "disabled" as const };
    const project = { ...buildProject(), events: [a,d] };
    const result = getReminderEventsBetween(project, { absoluteDay: 0, hour: 11, minute: 59 }, { absoluteDay: 0, hour: 12, minute: 0 });
    expect(result).toEqual([]);
  });

it("getCompletedEventsBetween: événement normal sans endDate terminé au début", () => {
    const project = buildProject();
    project.events = [makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 12, minute: 0 })];
    const completed = getCompletedEventsBetween(project, { absoluteDay: 0, hour: 11, minute: 55 }, { absoluteDay: 0, hour: 12, minute: 0 });
    expect(completed.map((e) => e.id)).toEqual(["e1"]);
  });

  it("getCompletedEventsBetween: événement avec endDate terminé à l'heure de fin", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 12, minute: 0 }), endDate: { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 14, minute: 0 } };
    project.events = [event];
    expect(getCompletedEventsBetween(project, { absoluteDay: 0, hour: 11, minute: 55 }, { absoluteDay: 0, hour: 12, minute: 0 })).toEqual([]);
    expect(getCompletedEventsBetween(project, { absoluteDay: 0, hour: 13, minute: 55 }, { absoluteDay: 0, hour: 14, minute: 0 }).map((e) => e.id)).toEqual(["e1"]);
  });

  it("getCompletedEventsBetween: all-day sans endDate terminé au début du jour suivant", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 0, minute: 0 }), allDay: true };
    project.events = [event];
    expect(getCompletedEventsBetween(project, { absoluteDay: 0, hour: 23, minute: 55 }, { absoluteDay: 1, hour: 0, minute: 0 })).toEqual([]);
    expect(getCompletedEventsBetween(project, { absoluteDay: 1, hour: 23, minute: 55 }, { absoluteDay: 2, hour: 0, minute: 0 }).map((e) => e.id)).toEqual(["e1"]);
  });

  it("getCompletedEventsBetween: all-day multi-jours terminé au lendemain de endDate", () => {
    const project = buildProject();
    const event = {
      ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 0, minute: 0 }),
      allDay: true,
      endDate: { year: 1000, monthId: "m1", dayOfMonth: 4, hour: 18, minute: 0 }
    };
    project.events = [event];
    expect(getCompletedEventsBetween(project, { absoluteDay: 2, hour: 23, minute: 55 }, { absoluteDay: 3, hour: 0, minute: 0 })).toEqual([]);
    expect(getCompletedEventsBetween(project, { absoluteDay: 3, hour: 23, minute: 55 }, { absoluteDay: 4, hour: 0, minute: 0 }).map((e) => e.id)).toEqual(["e1"]);
  });

  it("applyEventCompletionActions: deleteAfterTrigger supprime seulement à la fin", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 12, minute: 0 }), endDate: { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 14, minute: 0 }, deleteAfterTrigger: true };
    const withEvent = { ...project, events: [event] };
    const beforeEnd = getCompletedEventsBetween(withEvent, { absoluteDay: 0, hour: 11, minute: 55 }, { absoluteDay: 0, hour: 12, minute: 0 });
    expect(applyEventCompletionActions(withEvent, beforeEnd).events).toHaveLength(1);
    const atEnd = getCompletedEventsBetween(withEvent, { absoluteDay: 0, hour: 13, minute: 55 }, { absoluteDay: 0, hour: 14, minute: 0 });
    expect(applyEventCompletionActions(withEvent, atEnd).events).toHaveLength(0);
  });

  it("applyEventCompletionActions: archiveAfterTrigger archive seulement à la fin", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 12, minute: 0 }), endDate: { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 14, minute: 0 }, archiveAfterTrigger: true };
    const withEvent = { ...project, events: [event] };
    const beforeEnd = getCompletedEventsBetween(withEvent, { absoluteDay: 0, hour: 11, minute: 55 }, { absoluteDay: 0, hour: 12, minute: 0 });
    expect(applyEventCompletionActions(withEvent, beforeEnd).events[0].status).toBe("active");
    const atEnd = getCompletedEventsBetween(withEvent, { absoluteDay: 0, hour: 13, minute: 55 }, { absoluteDay: 0, hour: 14, minute: 0 });
    expect(applyEventCompletionActions(withEvent, atEnd).events[0].status).toBe("archived");
  });

  it("applyEventCompletionActions: événement non récurrent terminé devient triggered sans delete/archive", () => {
    const project = buildProject();
    const event = makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 12, minute: 0 });
    const withEvent = { ...project, events: [event] };
    const completed = getCompletedEventsBetween(withEvent, { absoluteDay: 0, hour: 11, minute: 55 }, { absoluteDay: 0, hour: 12, minute: 0 });
    const nextProject = applyEventCompletionActions(withEvent, completed);
    expect(nextProject.events[0].status).toBe("triggered");
  });

  it("applyEventCompletionActions: si delete et archive sont vrais, delete gagne", () => {
    const project = buildProject();
    const event = {
      ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 12, minute: 0 }),
      deleteAfterTrigger: true,
      archiveAfterTrigger: true
    };
    const withEvent = { ...project, events: [event] };
    const completed = getCompletedEventsBetween(withEvent, { absoluteDay: 0, hour: 11, minute: 55 }, { absoluteDay: 0, hour: 12, minute: 0 });
    expect(applyEventCompletionActions(withEvent, completed).events).toEqual([]);
  });

  it("événement déclenché mais pas terminé n'est pas supprimé", () => {
    const project = buildProject();
    const event = { ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 2, hour: 0, minute: 0 }), allDay: true, deleteAfterTrigger: true };
    const withEvent = { ...project, events: [event] };
    const completedOnStart = getCompletedEventsBetween(withEvent, { absoluteDay: 0, hour: 23, minute: 55 }, { absoluteDay: 1, hour: 0, minute: 0 });
    expect(completedOnStart).toEqual([]);
    expect(applyEventCompletionActions(withEvent, completedOnStart).events).toHaveLength(1);
  });

  it("événement récurrent reste actif après une occurrence sans suppression/archivage", () => {
    const project = buildProject();
    const event = {
      ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 12, minute: 0 }),
      recurrence: { type: "everyXDays" as const, interval: 1 }
    };
    const withEvent = { ...project, events: [event] };
    const completed = getCompletedEventsBetween(withEvent, { absoluteDay: 0, hour: 11, minute: 55 }, { absoluteDay: 0, hour: 12, minute: 0 });
    const nextProject = applyEventCompletionActions(withEvent, completed);
    expect(nextProject.events).toHaveLength(1);
    expect(nextProject.events[0].status).toBe("active");
  });

  it("getCompletedEventsBetween: occurrence récurrente avec endDate conserve la durée (ex: 10:00→12:00 chaque jour)", () => {
    const project = buildProject();
    const event = {
      ...makeEvent("e1", { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 10, minute: 0 }),
      endDate: { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 12, minute: 0 },
      recurrence: { type: "everyXDays" as const, interval: 1 }
    };
    const withEvent = { ...project, events: [event] };
    expect(getCompletedEventsBetween(withEvent, { absoluteDay: 1, hour: 11, minute: 55 }, { absoluteDay: 1, hour: 12, minute: 0 }).map((e) => e.id)).toEqual(["e1"]);
    expect(getCompletedEventsBetween(withEvent, { absoluteDay: 1, hour: 9, minute: 55 }, { absoluteDay: 1, hour: 10, minute: 0 })).toEqual([]);
  });

  it("un projet sans événement retourne une liste vide", () => {
    const project = buildProject();

    expect(getEventsForDay(project, { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 0, minute: 0 })).toEqual([]);
    expect(getEventsForCurrentDay(project)).toEqual([]);
  });