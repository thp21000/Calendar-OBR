import { describe, expect, it } from "vitest";
import type { CalendarProject, WeatherEvent, WeatherSnapshot } from "../../domain/types";
import {
  addWeatherCondition,
  addWeatherEvent,
  createDefaultWeatherEvent,
  deleteWeatherCondition,
  deleteWeatherEvent,
  getTriggeredWeatherEvents,
  getNewlyTriggeredWeatherEventsBetween,
  getActiveWeatherEventsWithDuration,
  getPlayerVisibleWeatherEvents,
  applyWeatherEventTriggerActions,
  isWeatherConditionMet,
  isWeatherEventTriggered,
  isWithinCooldownWindow,
  isWithinDurationWindow,
  toAbsoluteMinutes,
  updateWeatherCondition,
  updateWeatherEvent
} from "../weatherEventsLogic";
import { generateWeatherForTime } from "../weatherLogic";

const weather: WeatherSnapshot = {
  temperature: 36,
  windSpeed: 82,
  windDirection: "NE",
  rain: 12,
  state: "heavyRain"
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

  it("condition numérique legacy sans type reste valide", () => {
    expect(isWeatherConditionMet(weather, { metric: "temperature", operator: "gte", value: 35 })).toBe(true);
  });

  it("condition numérique type metric valide", () => {
    expect(isWeatherConditionMet(weather, { type: "metric", metric: "temperature", operator: "gte", value: 35 })).toBe(true);
  });

  it("condition état météo match", () => {
    expect(isWeatherConditionMet(weather, { type: "state", state: "heavyRain" })).toBe(true);
  });

  it("condition état météo non match", () => {
    expect(isWeatherConditionMet(weather, { type: "state", state: "storm" })).toBe(false);
  });

  it("condition saison match", () => {
    const project = buildProject([]);
    project.seasons = [{ id: "s1", name: "S1", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m1", dayOfMonth: 30 } }];
    expect(isWeatherConditionMet(weather, { type: "season", seasonId: "s1" }, { project, time: { absoluteDay: 0, hour: 10, minute: 0 } })).toBe(true);
  });
  it("condition saison non match", () => {
    const project = buildProject([]);
    project.seasons = [{ id: "s1", name: "S1", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m1", dayOfMonth: 30 } }];
    expect(isWeatherConditionMet(weather, { type: "season", seasonId: "s2" }, { project, time: { absoluteDay: 0, hour: 10, minute: 0 } })).toBe(false);
  });
  it("condition période horaire simple", () => {
    expect(isWeatherConditionMet(weather, { type: "timeOfDay", startHour: 8, endHour: 18 }, { time: { absoluteDay: 0, hour: 10, minute: 0 } })).toBe(true);
    expect(isWeatherConditionMet(weather, { type: "timeOfDay", startHour: 8, endHour: 18 }, { time: { absoluteDay: 0, hour: 22, minute: 0 } })).toBe(false);
  });
  it("condition période horaire traversant minuit", () => {
    expect(isWeatherConditionMet(weather, { type: "timeOfDay", startHour: 22, endHour: 6 }, { time: { absoluteDay: 0, hour: 23, minute: 0 } })).toBe(true);
    expect(isWeatherConditionMet(weather, { type: "timeOfDay", startHour: 22, endHour: 6 }, { time: { absoluteDay: 0, hour: 4, minute: 0 } })).toBe(true);
    expect(isWeatherConditionMet(weather, { type: "timeOfDay", startHour: 22, endHour: 6 }, { time: { absoluteDay: 0, hour: 12, minute: 0 } })).toBe(false);
  });
  it("condition phase lunaire match", () => {
    const project = buildProject([]);
    project.moons = [{ id: "m1", name: "Moon", cycleLengthDays: 29.5, cycleOffsetDays: 0 }];
    expect(isWeatherConditionMet(weather, { type: "moonPhase", moonId: "m1", phaseId: "new" }, { project, time: { absoluteDay: 0, hour: 10, minute: 0 } })).toBe(true);
  });
  it("condition phase lunaire non match", () => {
    const project = buildProject([]);
    project.moons = [{ id: "m1", name: "Moon", cycleLengthDays: 29.5, cycleOffsetDays: 0 }];
    expect(isWeatherConditionMet(weather, { type: "moonPhase", moonId: "m1", phaseId: "full" }, { project, time: { absoluteDay: 0, hour: 10, minute: 0 } })).toBe(false);
  });
  it("condition phase lunaire lune absente = faux", () => {
    const project = buildProject([]);
    expect(isWeatherConditionMet(weather, { type: "moonPhase", moonId: "missing", phaseId: "full" }, { project, time: { absoluteDay: 0, hour: 10, minute: 0 } })).toBe(false);
  });

  it("condition metric dailyRainTotal gte vraie", () => {
    expect(isWeatherConditionMet({ ...weather, dailyRainTotal: 10 }, { type: "metric", metric: "dailyRainTotal", operator: "gte", value: 8 })).toBe(true);
  });

  it("condition metric dailyRainTotal false si undefined", () => {
    expect(isWeatherConditionMet({ ...weather, dailyRainTotal: undefined }, { type: "metric", metric: "dailyRainTotal", operator: "gte", value: 8 })).toBe(false);
  });

  it("condition metric dailyMinTemperature lte vraie", () => {
    expect(isWeatherConditionMet({ ...weather, dailyMinTemperature: -2 }, { type: "metric", metric: "dailyMinTemperature", operator: "lte", value: 0 })).toBe(true);
  });

  it("condition metric dailyMaxTemperature gte vraie", () => {
    expect(isWeatherConditionMet({ ...weather, dailyMaxTemperature: 38 }, { type: "metric", metric: "dailyMaxTemperature", operator: "gte", value: 35 })).toBe(true);
  });

  it("condition dominantState match", () => {
    expect(isWeatherConditionMet({ ...weather, dominantState: "storm" }, { type: "dominantState", state: "storm" })).toBe(true);
  });

  it("condition dominantState false si undefined", () => {
    expect(isWeatherConditionMet({ ...weather, dominantState: undefined }, { type: "dominantState", state: "storm" })).toBe(false);
  });

  it("condition windDirection match", () => {
    expect(isWeatherConditionMet({ ...weather, windDirection: "N" }, { type: "windDirection", direction: "N" })).toBe(true);
  });

  it("condition state vérifie état horaire et non dominant", () => {
    expect(isWeatherConditionMet({ ...weather, state: "clear", dominantState: "storm" }, { type: "state", state: "storm" })).toBe(false);
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

  it("requireAllConditions true avec métrique + état", () => {
    const event: WeatherEvent = {
      id: "combo-all",
      name: "Pluie forte chaude",
      conditions: [
        { type: "metric", metric: "temperature", operator: "gte", value: 35 },
        { type: "state", state: "heavyRain" }
      ],
      requireAllConditions: true,
      enabled: true
    };
    expect(isWeatherEventTriggered(weather, event)).toBe(true);
    expect(isWeatherEventTriggered({ ...weather, state: "storm" }, event)).toBe(false);
  });

  it("requireAny avec métrique + état", () => {
    const event: WeatherEvent = {
      id: "combo-any",
      name: "Canicule ou orage",
      conditions: [
        { type: "metric", metric: "temperature", operator: "gte", value: 40 },
        { type: "state", state: "storm" }
      ],
      requireAllConditions: false,
      enabled: true
    };
    expect(isWeatherEventTriggered(weather, event)).toBe(false);
    expect(isWeatherEventTriggered({ ...weather, state: "storm" }, event)).toBe(true);
  });
  it("requireAll météo + saison", () => {
    const project = buildProject([]);
    project.seasons = [{ id: "s1", name: "S1", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m1", dayOfMonth: 30 } }];
    const event: WeatherEvent = { id: "a", name: "A", enabled: true, requireAllConditions: true, conditions: [{ metric: "temperature", operator: "gte", value: 35 }, { type: "season", seasonId: "s1" }] };
    expect(isWeatherEventTriggered(weather, event, { project, time: { absoluteDay: 0, hour: 10, minute: 0 } })).toBe(true);
  });
  it("requireAny état + période", () => {
    const event: WeatherEvent = { id: "a", name: "A", enabled: true, requireAllConditions: false, conditions: [{ type: "state", state: "storm" }, { type: "timeOfDay", startHour: 22, endHour: 6 }] };
    expect(isWeatherEventTriggered(weather, event, { time: { absoluteDay: 0, hour: 23, minute: 0 } })).toBe(true);
  });
  it("requireAll météo + phase lunaire", () => {
    const project = buildProject([]);
    project.moons = [{ id: "m1", name: "Moon", cycleLengthDays: 29.5, cycleOffsetDays: 0 }];
    const event: WeatherEvent = { id: "a", name: "A", enabled: true, requireAllConditions: true, conditions: [{ metric: "temperature", operator: "gte", value: 35 }, { type: "moonPhase", moonId: "m1", phaseId: "new" }] };
    expect(isWeatherEventTriggered(weather, event, { project, time: { absoluteDay: 0, hour: 10, minute: 0 } })).toBe(true);
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
    const first = updated.weatherEvents[0]?.conditions[0];
    const second = updated.weatherEvents[0]?.conditions[1];
    expect(first?.type === "metric" || first?.type === undefined ? first.value : undefined).toBe(35);
    expect(second?.type === "metric" || second?.type === undefined ? second.value : undefined).toBe(90);
  });

  it("deleteWeatherCondition supprime seulement la condition ciblée", () => {
    const e1 = { ...createDefaultWeatherEvent("fr"), id: "e1" };
    e1.conditions.push({ metric: "windSpeed", operator: "gte", value: 80 });
    const project = buildProject([e1]);
    const updated = deleteWeatherCondition(project, "e1", 0);
    expect(updated.weatherEvents[0]?.conditions).toHaveLength(1);
    const remaining = updated.weatherEvents[0]?.conditions[0];
    expect(remaining?.type === "metric" || remaining?.type === undefined ? remaining.metric : undefined).toBe("windSpeed");
  });

  it("convertit metric -> season", () => {
    const e1 = { ...createDefaultWeatherEvent("fr"), id: "e1" };
    const project = buildProject([e1]);
    const updated = updateWeatherCondition(project, "e1", 0, { type: "season", seasonId: "winter" });
    expect(updated.weatherEvents[0]?.conditions[0]).toEqual({ type: "season", seasonId: "winter" });
  });

  it("convertit metric -> timeOfDay", () => {
    const e1 = { ...createDefaultWeatherEvent("fr"), id: "e1" };
    const project = buildProject([e1]);
    const updated = updateWeatherCondition(project, "e1", 0, { type: "timeOfDay", startHour: 22, endHour: 6 });
    expect(updated.weatherEvents[0]?.conditions[0]).toEqual({ type: "timeOfDay", startHour: 22, endHour: 6 });
  });
  it("convertit metric -> moonPhase", () => {
    const e1 = { ...createDefaultWeatherEvent("fr"), id: "e1" };
    const updated = updateWeatherCondition(buildProject([e1]), "e1", 0, { type: "moonPhase", moonId: "moon-1", phaseId: "full" });
    expect(updated.weatherEvents[0]?.conditions[0]).toEqual({ type: "moonPhase", moonId: "moon-1", phaseId: "full" });
  });
  it("convertit moonPhase -> metric", () => {
    const e1 = { ...createDefaultWeatherEvent("fr"), id: "e1", conditions: [{ type: "moonPhase", moonId: "moon-1", phaseId: "full" as const }] };
    const updated = updateWeatherCondition(buildProject([e1 as unknown as WeatherEvent]), "e1", 0, { type: "metric", metric: "rain", operator: "gte", value: 1 });
    expect(updated.weatherEvents[0]?.conditions[0]).toEqual({ type: "metric", metric: "rain", operator: "gte", value: 1 });
  });
  
  it("retourne un événement nouvellement actif entre fromTime et toTime", () => {
    const project = buildProject([]);
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m1", dayOfMonth: 30 } }];
    const fromTime = { absoluteDay: 0, hour: 10, minute: 0 };
    const toTime = { absoluteDay: 0, hour: 11, minute: 0 };
    const fromWeather = generateWeatherForTime(project, fromTime.absoluteDay, fromTime.hour)!;
    const toWeather = generateWeatherForTime(project, toTime.absoluteDay, toTime.hour)!;
    const operator = toWeather.windSpeed >= fromWeather.windSpeed ? ("gte" as const) : ("lte" as const);
    const threshold = (fromWeather.windSpeed + toWeather.windSpeed) / 2;
    const event = {
      ...createDefaultWeatherEvent("fr"),
      id: "new",
      conditions: [{ metric: "windSpeed" as const, operator, value: threshold }]
    };
    const result = getNewlyTriggeredWeatherEventsBetween({ ...project, weatherEvents: [event] }, fromTime, toTime);
    expect(result.map((e) => e.id)).toEqual(["new"]);
  });

  it("ne retourne pas un événement déjà actif au départ", () => {
    const project = buildProject([]);
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m1", dayOfMonth: 30 } }];
    const fromTime = { absoluteDay: 0, hour: 10, minute: 0 };
    const toTime = { absoluteDay: 0, hour: 11, minute: 0 };
    const fromWeather = generateWeatherForTime(project, fromTime.absoluteDay, fromTime.hour)!;
    const event = { ...createDefaultWeatherEvent("fr"), id: "already", conditions: [{ metric: "windSpeed" as const, operator: "gte" as const, value: fromWeather.windSpeed - 1 }] };
    const result = getNewlyTriggeredWeatherEventsBetween({ ...project, weatherEvents: [event] }, fromTime, toTime);
    expect(result).toEqual([]);
  });

  it("retourne vide si aucun événement n'est actif à l'arrivée", () => {
    const project = buildProject([]);
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m1", dayOfMonth: 30 } }];
    const fromTime = { absoluteDay: 0, hour: 10, minute: 0 };
    const toTime = { absoluteDay: 0, hour: 11, minute: 0 };
    const toWeather = generateWeatherForTime(project, toTime.absoluteDay, toTime.hour)!;
    const event = { ...createDefaultWeatherEvent("fr"), id: "none", conditions: [{ metric: "temperature" as const, operator: "gte" as const, value: toWeather.temperature + 100 }] };
    const result = getNewlyTriggeredWeatherEventsBetween({ ...project, weatherEvents: [event] }, fromTime, toTime);
    expect(result).toEqual([]);
  });

  it("retourne vide si aucune météo n'existe", () => {
    const project = buildProject([]);
    const result = getNewlyTriggeredWeatherEventsBetween(project, { absoluteDay: 0, hour: 10, minute: 0 }, { absoluteDay: 0, hour: 11, minute: 0 });
    expect(result).toEqual([]);
  });

  it("fonctionne lors d'un passage au jour suivant", () => {
    const project = buildProject([]);
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m1", dayOfMonth: 30 } }];
    const fromTime = { absoluteDay: 0, hour: 23, minute: 0 };
    const toTime = { absoluteDay: 1, hour: 0, minute: 0 };
    const fromWeather = generateWeatherForTime(project, fromTime.absoluteDay, fromTime.hour)!;
    const toWeather = generateWeatherForTime(project, toTime.absoluteDay, toTime.hour)!;
    const candidates = [
      { metric: "rain" as const, from: fromWeather.rain, to: toWeather.rain },
      { metric: "windSpeed" as const, from: fromWeather.windSpeed, to: toWeather.windSpeed },
      { metric: "temperature" as const, from: fromWeather.temperature, to: toWeather.temperature }
    ];
    const selected = candidates.find((c) => c.from !== c.to);
    if (!selected) {
      expect(getNewlyTriggeredWeatherEventsBetween({ ...project, weatherEvents: [] }, fromTime, toTime)).toEqual([]);
      return;
    }
    const operator = selected.to >= selected.from ? ("gte" as const) : ("lte" as const);
    const threshold = (selected.from + selected.to) / 2;
    const event = { ...createDefaultWeatherEvent("fr"), id: "cross-day", conditions: [{ metric: selected.metric, operator, value: threshold }] };
    const result = getNewlyTriggeredWeatherEventsBetween({ ...project, weatherEvents: [event] }, fromTime, toTime);
    expect(result.map((e) => e.id)).toEqual(["cross-day"]);
  });

  it("sans durée/cooldown : comportement inchangé", () => {
    const project = buildProject([]);
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m1", dayOfMonth: 30 } }];
    const fromTime = { absoluteDay: 0, hour: 10, minute: 0 };
    const toTime = { absoluteDay: 0, hour: 11, minute: 0 };
    const fromWeather = generateWeatherForTime(project, fromTime.absoluteDay, fromTime.hour)!;
    const toWeather = generateWeatherForTime(project, toTime.absoluteDay, toTime.hour)!;
    const operator = toWeather.windSpeed >= fromWeather.windSpeed ? ("gte" as const) : ("lte" as const);
    const threshold = (fromWeather.windSpeed + toWeather.windSpeed) / 2;
    const event = { ...createDefaultWeatherEvent("fr"), id: "legacy", conditions: [{ metric: "windSpeed" as const, operator, value: threshold }] };
    const result = getNewlyTriggeredWeatherEventsBetween({ ...project, weatherEvents: [event] }, fromTime, toTime, {});
    expect(result.map((e) => e.id)).toEqual(["legacy"]);
  });

  it("cooldown empêche un redéclenchement immédiat", () => {
    const project = buildProject([{ ...createDefaultWeatherEvent("fr"), id: "cool", cooldownHours: 3, conditions: [{ metric: "temperature", operator: "lte", value: 999 }] }]);
    const toTime = { absoluteDay: 0, hour: 12, minute: 0 };
    const result = getNewlyTriggeredWeatherEventsBetween(project, { absoluteDay: 0, hour: 11, minute: 0 }, toTime, { cool: toAbsoluteMinutes({ absoluteDay: 0, hour: 10, minute: 0 }) });
    expect(result).toEqual([]);
  });

  it("cooldown expiré permet un nouveau déclenchement", () => {
    const project = buildProject([]);
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m1", dayOfMonth: 30 } }];
    const fromTime = { absoluteDay: 0, hour: 10, minute: 0 };
    const toTime = { absoluteDay: 0, hour: 11, minute: 0 };
    const fromWeather = generateWeatherForTime(project, fromTime.absoluteDay, fromTime.hour)!;
    const toWeather = generateWeatherForTime(project, toTime.absoluteDay, toTime.hour)!;
    const operator = toWeather.windSpeed >= fromWeather.windSpeed ? ("gte" as const) : ("lte" as const);
    const threshold = (fromWeather.windSpeed + toWeather.windSpeed) / 2;
    const event = { ...createDefaultWeatherEvent("fr"), id: "cool-ok", cooldownHours: 1, conditions: [{ metric: "windSpeed" as const, operator, value: threshold }] };
    const result = getNewlyTriggeredWeatherEventsBetween({ ...project, weatherEvents: [event] }, fromTime, toTime, {
      "cool-ok": toAbsoluteMinutes({ absoluteDay: 0, hour: 8, minute: 0 })
    });
    expect(result.map((e) => e.id)).toEqual(["cool-ok"]);
  });

  it("durée active empêche une nouvelle notification", () => {
    const project = buildProject([{ ...createDefaultWeatherEvent("fr"), id: "dur", durationHours: 2, conditions: [{ metric: "temperature", operator: "lte", value: 999 }] }]);
    const toTime = { absoluteDay: 0, hour: 12, minute: 0 };
    const result = getNewlyTriggeredWeatherEventsBetween(project, { absoluteDay: 0, hour: 11, minute: 0 }, toTime, { dur: toAbsoluteMinutes({ absoluteDay: 0, hour: 11, minute: 0 }) });
    expect(result).toEqual([]);
  });

  it("helpers durée/cooldown fonctionnent", () => {
    expect(isWithinDurationWindow(60, 119, 1)).toBe(true);
    expect(isWithinDurationWindow(60, 120, 1)).toBe(false);
    expect(isWithinCooldownWindow(60, 119, 1)).toBe(true);
    expect(isWithinCooldownWindow(60, 120, 1)).toBe(false);
  });

  it("reste actif pendant durationHours même si la météo ne matche plus", () => {
    const project = buildProject([
      { ...createDefaultWeatherEvent("fr"), id: "dur-active", durationHours: 2, conditions: [{ metric: "temperature", operator: "gte", value: 35 }] }
    ]);
    const active = getActiveWeatherEventsWithDuration(
      project,
      { ...weather, temperature: 5 },
      { absoluteDay: 0, hour: 12, minute: 0 },
      { "dur-active": toAbsoluteMinutes({ absoluteDay: 0, hour: 11, minute: 0 }) }
    );
    expect(active.map((e) => e.id)).toEqual(["dur-active"]);
  });

  it("n'est plus actif après expiration de durationHours", () => {
    const project = buildProject([
      { ...createDefaultWeatherEvent("fr"), id: "dur-expired", durationHours: 1, conditions: [{ metric: "temperature", operator: "gte", value: 35 }] }
    ]);
    const active = getActiveWeatherEventsWithDuration(
      project,
      { ...weather, temperature: 5 },
      { absoluteDay: 0, hour: 12, minute: 0 },
      { "dur-expired": toAbsoluteMinutes({ absoluteDay: 0, hour: 10, minute: 0 }) }
    );
    expect(active).toEqual([]);
  });
  it("createDefaultWeatherEvent initialise visibilité gm et notifyOnTrigger true", () => {
    const created = createDefaultWeatherEvent("fr");
    expect(created.visibility).toBe("gm");
    expect(created.notifyOnTrigger).toBe(true);
  });

  it("visibility absent est traité comme gm (non visible joueur)", () => {
    const project = buildProject([{ ...createDefaultWeatherEvent("fr"), id: "w1", visibility: undefined }]);
    const visible = getPlayerVisibleWeatherEvents(project, weather, project.currentTime);
    expect(visible).toEqual([]);
  });

  it("notifyOnTrigger absent est traité comme true", () => {
    const event = { ...createDefaultWeatherEvent("fr"), notifyOnTrigger: undefined };
    expect(event.notifyOnTrigger !== false).toBe(true);
  });

  it("visibility players actif est visible joueur", () => {
    const event = { ...createDefaultWeatherEvent("fr"), id: "p", visibility: "players" as const, conditions: [{ metric: "temperature" as const, operator: "gte" as const, value: 30 }] };
    const project = buildProject([event]);
    const visible = getPlayerVisibleWeatherEvents(project, weather, project.currentTime);
    expect(visible.map((e) => e.id)).toContain("p");
  });

  it("visibility revealOnTrigger actif est visible joueur", () => {
    const event = { ...createDefaultWeatherEvent("fr"), id: "r", visibility: "revealOnTrigger" as const, conditions: [{ metric: "temperature" as const, operator: "gte" as const, value: 30 }] };
    const project = buildProject([event]);
    const visible = getPlayerVisibleWeatherEvents(project, weather, project.currentTime);
    expect(visible.map((e) => e.id)).toContain("r");
  });

  it("événement disabled jamais visible joueur", () => {
    const event = { ...createDefaultWeatherEvent("fr"), id: "d", enabled: false, visibility: "players" as const, conditions: [{ metric: "temperature" as const, operator: "gte" as const, value: 30 }] };
    const project = buildProject([event]);
    expect(getPlayerVisibleWeatherEvents(project, weather, project.currentTime)).toEqual([]);
  });

  it("retour public météo n'expose pas les champs MJ/internes", () => {
    const event = {
      ...createDefaultWeatherEvent("fr"),
      id: "desc",
      visibility: "players" as const,
      playerDescription: "public",
      gmDescription: "secret",
      durationHours: 2,
      cooldownHours: 4,
      notifyOnTrigger: false,
      conditions: [{ metric: "temperature" as const, operator: "gte" as const, value: 30 }]
    };
    const project = buildProject([event]);
    const visible = getPlayerVisibleWeatherEvents(project, weather, project.currentTime);
    expect(visible[0]?.playerDescription).toBe("public");
    const serialized = JSON.stringify(visible);
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("conditions");
    expect(serialized).not.toContain("durationHours");
    expect(serialized).not.toContain("cooldownHours");
    expect(serialized).not.toContain("visibility");
    expect(serialized).not.toContain("notifyOnTrigger");
  });

  it("createDefaultWeatherEvent crée status active", () => {
    const created = createDefaultWeatherEvent("fr");
    expect(created.status).toBe("active");
  });

  it("status archived ne se déclenche pas", () => {
    const event = { ...createDefaultWeatherEvent("fr"), status: "archived" as const, conditions: [{ metric: "temperature" as const, operator: "gte" as const, value: 0 }] };
    expect(isWeatherEventTriggered(weather, event)).toBe(false);
  });

  it("status disabled ne se déclenche pas", () => {
    const event = { ...createDefaultWeatherEvent("fr"), status: "disabled" as const, conditions: [{ metric: "temperature" as const, operator: "gte" as const, value: 0 }] };
    expect(isWeatherEventTriggered(weather, event)).toBe(false);
  });

  it("applyWeatherEventTriggerActions met status triggered et lastTriggeredAtMinutes", () => {
    const event = { ...createDefaultWeatherEvent("fr"), id: "a1" };
    const project = buildProject([event]);
    const next = applyWeatherEventTriggerActions(project, [event], { absoluteDay: 0, hour: 10, minute: 0 }, weather);
    expect(next.weatherEvents[0].status).toBe("triggered");
    expect(next.weatherEvents[0].lastTriggeredAtMinutes).toBe(toAbsoluteMinutes({ absoluteDay: 0, hour: 10, minute: 0 }));
  });

  it("applyWeatherEventTriggerActions ajoute une entrée d'historique", () => {
    const event = { ...createDefaultWeatherEvent("fr"), id: "h1" };
    const project = buildProject([event]);
    const next = applyWeatherEventTriggerActions(project, [event], { absoluteDay: 0, hour: 10, minute: 0 }, weather);
    expect(next.weatherEvents[0].triggerHistory?.length).toBe(1);
    expect(next.weatherEvents[0].triggerHistory?.[0].triggeredAtMinutes).toBe(toAbsoluteMinutes({ absoluteDay: 0, hour: 10, minute: 0 }));
    expect(next.weatherEvents[0].triggerHistory?.[0].weatherState).toBe(weather.state);
  });

  it("applyWeatherEventTriggerActions limite l'historique à 10", () => {
    const event = { ...createDefaultWeatherEvent("fr"), id: "h2", triggerHistory: Array.from({ length: 10 }, (_, i) => ({ id: `x-${i}`, triggeredAtMinutes: i })) };
    const project = buildProject([event as any]);
    const next = applyWeatherEventTriggerActions(project, [event as any], { absoluteDay: 0, hour: 10, minute: 0 }, weather);
    expect(next.weatherEvents[0].triggerHistory?.length).toBe(10);
  });

  it("archiveAfterTrigger met status archived", () => {
    const event = { ...createDefaultWeatherEvent("fr"), id: "a2", archiveAfterTrigger: true };
    const project = buildProject([event]);
    const next = applyWeatherEventTriggerActions(project, [event], { absoluteDay: 0, hour: 10, minute: 0 });
    expect(next.weatherEvents[0].status).toBe("archived");
  });

  it("disableAfterTrigger met status disabled", () => {
    const event = { ...createDefaultWeatherEvent("fr"), id: "a3", disableAfterTrigger: true };
    const project = buildProject([event]);
    const next = applyWeatherEventTriggerActions(project, [event], { absoluteDay: 0, hour: 10, minute: 0 });
    expect(next.weatherEvents[0].status).toBe("disabled");
  });
});