import { describe, expect, it } from "vitest";
import type { CalendarProject, WeatherEvent, WeatherSnapshot } from "../../domain/types";
import {
  addWeatherCondition,
  addWeatherEvent,
  createDefaultWeatherEvent,
  deleteWeatherCondition,
  deleteWeatherEvent,
  getTriggeredWeatherEvents,
  isWeatherConditionMet,
  isWeatherEventTriggered,
  updateWeatherCondition,
  updateWeatherEvent
} from "../weatherEventsLogic";

const weather: WeatherSnapshot = {
  temperature: 36,
  windSpeed: 82,
  windDirection: "NE",
  rain: 12
};

const buildProject = (weatherEvents: WeatherEvent[]): CalendarProject => ({
  schemaVersion: 1,
  appVersion: "0.1.0",
  id: "project-weather-events",
  name: "Weather Events",
  locale: "fr",
  units: { temperature: "celsius", windSpeed: "kmh", rain: "mm" },
  currentTime: { absoluteDay: 0, hour: 8, minute: 0 },
  calendarSystem: {
    eraName: "CE",
    startYear: 1000,
    firstWeekdayOffset: 0,
    weekdays: [{ id: "w1", name: "W1", order: 1 }],
    months: [{ id: "m1", name: "M1", order: 1, days: 30 }]
  },
  events: [],
  seasons: [],
  moons: [],
  weatherSettings: {},
  weatherEvents,
  uiSettings: { activeTab: "today", compactMode: false }
});

describe("weatherEventsLogic", () => {
  it("condition temperature gte vraie", () => {
    expect(isWeatherConditionMet(weather, { metric: "temperature", operator: "gte", value: 35 })).toBe(true);
  });

  it("condition temperature gte fausse", () => {
    expect(isWeatherConditionMet(weather, { metric: "temperature", operator: "gte", value: 40 })).toBe(false);
  });

  it("condition temperature lte vraie", () => {
    expect(isWeatherConditionMet({ ...weather, temperature: -2 }, { metric: "temperature", operator: "lte", value: 0 })).toBe(true);
  });

  it("condition windSpeed gte vraie", () => {
    expect(isWeatherConditionMet(weather, { metric: "windSpeed", operator: "gte", value: 80 })).toBe(true);
  });

  it("condition rain gte vraie", () => {
    expect(isWeatherConditionMet(weather, { metric: "rain", operator: "gte", value: 10 })).toBe(true);
  });

  it("événement désactivé non déclenché", () => {
    const event: WeatherEvent = {
      id: "e1", name: "Tempête", conditions: [{ metric: "windSpeed", operator: "gte", value: 80 }], requireAllConditions: true, enabled: false
    };
    expect(isWeatherEventTriggered(weather, event)).toBe(false);
  });

  it("événement sans condition non déclenché", () => {
    const event: WeatherEvent = { id: "e1", name: "Vide", conditions: [], requireAllConditions: true, enabled: true };
    expect(isWeatherEventTriggered(weather, event)).toBe(false);
  });

  it("requireAllConditions true : toutes vraies requises", () => {
    const event: WeatherEvent = {
      id: "e1",
      name: "Canicule + Vent",
      conditions: [
        { metric: "temperature", operator: "gte", value: 35 },
        { metric: "windSpeed", operator: "gte", value: 80 }
      ],
      requireAllConditions: true,
      enabled: true
    };
    expect(isWeatherEventTriggered(weather, event)).toBe(true);
    expect(
      isWeatherEventTriggered({ ...weather, windSpeed: 60 }, event)
    ).toBe(false);
  });

  it("requireAllConditions false : une seule vraie suffit", () => {
    const event: WeatherEvent = {
      id: "e1",
      name: "Chaud ou Pluie",
      conditions: [
        { metric: "temperature", operator: "gte", value: 40 },
        { metric: "rain", operator: "gte", value: 10 }
      ],
      requireAllConditions: false,
      enabled: true
    };
    expect(isWeatherEventTriggered(weather, event)).toBe(true);
  });

  it("getTriggeredWeatherEvents retourne seulement les déclenchés", () => {
    const triggered: WeatherEvent = {
      id: "t1", name: "Tempête", conditions: [{ metric: "windSpeed", operator: "gte", value: 80 }], requireAllConditions: true, enabled: true
    };
    const notTriggered: WeatherEvent = {
      id: "t2", name: "Gel", conditions: [{ metric: "temperature", operator: "lte", value: 0 }], requireAllConditions: true, enabled: true
    };
    const disabled: WeatherEvent = {
      id: "t3", name: "Pluie", conditions: [{ metric: "rain", operator: "gte", value: 10 }], requireAllConditions: true, enabled: false
    };
    const results = getTriggeredWeatherEvents(buildProject([triggered, notTriggered, disabled]), weather);
    expect(results.map((event) => event.id)).toEqual(["t1"]);
  });

  it("compat ancienne donnée : enabled absent = actif", () => {
    const oldEvent = {
      id: "old1",
      name: "Canicule",
      conditions: [{ metric: "temperature", operator: "gte", value: 35 }],
      requireAllConditions: true
    } as unknown as WeatherEvent;
    expect(isWeatherEventTriggered(weather, oldEvent)).toBe(true);
  });

  it("compat ancienne donnée : requireAllConditions absent = true", () => {
    const oldEvent = {
      id: "old2",
      name: "Canicule + Tempête",
      conditions: [
        { metric: "temperature", operator: "gte", value: 35 },
        { metric: "windSpeed", operator: "gte", value: 90 }
      ],
      enabled: true
    } as unknown as WeatherEvent;
    expect(isWeatherEventTriggered(weather, oldEvent)).toBe(false);
  });
  
  it("createDefaultWeatherEvent crée un événement valide", () => {
    const event = createDefaultWeatherEvent("fr");
    expect(event.id.startsWith("weather-event-")).toBe(true);
    expect(event.name).toBe("Nouvelle alerte météo");
    expect(event.enabled).toBe(true);
    expect(event.requireAllConditions).toBe(true);
    expect(event.conditions).toHaveLength(1);
  });

  it("addWeatherEvent ajoute un événement", () => {
    const project = buildProject([]);
    const added = addWeatherEvent(project, createDefaultWeatherEvent("en"));
    expect(added.weatherEvents).toHaveLength(1);
  });

  it("updateWeatherEvent modifie seulement l’événement ciblé", () => {
    const e1 = { ...createDefaultWeatherEvent("fr"), id: "e1" };
    const e2 = { ...createDefaultWeatherEvent("fr"), id: "e2", name: "B" };
    const project = buildProject([e1, e2]);
    const updated = updateWeatherEvent(project, "e1", { name: "A+" });
    expect(updated.weatherEvents.find((event) => event.id === "e1")?.name).toBe("A+");
    expect(updated.weatherEvents.find((event) => event.id === "e2")?.name).toBe("B");
  });

  it("deleteWeatherEvent supprime seulement l’événement ciblé", () => {
    const e1 = { ...createDefaultWeatherEvent("fr"), id: "e1" };
    const e2 = { ...createDefaultWeatherEvent("fr"), id: "e2" };
    const project = buildProject([e1, e2]);
    const updated = deleteWeatherEvent(project, "e1");
    expect(updated.weatherEvents.map((event) => event.id)).toEqual(["e2"]);
  });

  it("addWeatherCondition ajoute une condition", () => {
    const e1 = { ...createDefaultWeatherEvent("fr"), id: "e1" };
    const project = buildProject([e1]);
    const updated = addWeatherCondition(project, "e1");
    expect(updated.weatherEvents[0]?.conditions).toHaveLength(2);
  });

  it("updateWeatherCondition modifie seulement la condition ciblée", () => {
    const e1 = { ...createDefaultWeatherEvent("fr"), id: "e1" };
    e1.conditions.push({ metric: "windSpeed", operator: "gte", value: 80 });
    const project = buildProject([e1]);
    const updated = updateWeatherCondition(project, "e1", 1, { value: 90 });
    expect(updated.weatherEvents[0]?.conditions[0]?.value).toBe(35);
    expect(updated.weatherEvents[0]?.conditions[1]?.value).toBe(90);
  });

  it("deleteWeatherCondition supprime seulement la condition ciblée", () => {
    const e1 = { ...createDefaultWeatherEvent("fr"), id: "e1" };
    e1.conditions.push({ metric: "windSpeed", operator: "gte", value: 80 });
    const project = buildProject([e1]);
    const updated = deleteWeatherCondition(project, "e1", 0);
    expect(updated.weatherEvents[0]?.conditions).toHaveLength(1);
    expect(updated.weatherEvents[0]?.conditions[0]?.metric).toBe("windSpeed");
  });
});
