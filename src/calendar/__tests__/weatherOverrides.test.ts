import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { applyWeatherOverrideToDailySummary, getWeatherOverrideForDay, getWeatherOverrideForTime } from "../weatherOverrides";

describe("weatherOverrides", () => {
  it("récupère l'override du jour", () => {
    const p = createDefaultCalendarProject();
    p.weatherOverrides = [{ id: "o1", absoluteDay: 3, dailyRainTotal: 4 }];
    expect(getWeatherOverrideForDay(p, 3)?.id).toBe("o1");
  });

  it("retourne undefined si aucun override", () => {
    const p = createDefaultCalendarProject();
    p.weatherOverrides = [];
    expect(getWeatherOverrideForDay(p, 3)).toBeUndefined();
  });

  it("applique seulement les champs présents et protège bornes", () => {
    const base: any = { absoluteDay: 1, minTemperature: 2, maxTemperature: 10, averageTemperature: 6, rainTotal24h: 3, maxWindSpeed: 20, dominantWindDirection: "N", dominantState: "clear", trendKind: "stable" };
    const next = applyWeatherOverrideToDailySummary(base, { id: "o", absoluteDay: 1, dailyRainTotal: -5, windSpeed: -3, dominantState: "storm" as any });
    expect(next?.rainTotal24h).toBe(0);
    expect(next?.maxWindSpeed).toBe(0);
    expect(next?.dominantState).toBe("storm");
    expect(next?.minTemperature).toBe(2);
  });

  it("corrige min/max inversés et garde partial", () => {
    const base: any = { absoluteDay: 1, minTemperature: 2, maxTemperature: 10, averageTemperature: 6, rainTotal24h: 3, maxWindSpeed: 20, dominantWindDirection: "N", dominantState: "clear", trendKind: "stable" };
    const next = applyWeatherOverrideToDailySummary(base, { id: "o", absoluteDay: 1, dailyMinTemperature: 12, dailyMaxTemperature: 4, rain: 8 } as any)!;
    expect(next.minTemperature).toBeLessThanOrEqual(next.maxTemperature);
    expect(next.maxWindSpeed).toBe(base.maxWindSpeed);
    expect(next.rainTotal24h).toBe(base.rainTotal24h);
  });
});

it("considère une météo de scène sans fin horaire comme active et persistante", () => {
  const project = createDefaultCalendarProject();
  project.weatherOverrides = [{
    id: "persistent-scene",
    absoluteDay: 0,
    source: "sceneWeather",
    sourceId: "storm-scene",
    sceneId: "scene-a",
    temperature: 7,
    state: "storm"
  }];

  expect(getWeatherOverrideForTime(project, 0, 8)?.id).toBe("persistent-scene");
  expect(getWeatherOverrideForTime(project, 3, 18)?.id).toBe("persistent-scene");
});

it("conserve la priorité du plus récent entre météo de scène persistante et override manuel", () => {
  const project = createDefaultCalendarProject();
  project.weatherOverrides = [
    { id: "scene", absoluteDay: 0, source: "sceneWeather", temperature: 7 },
    { id: "manual", absoluteDay: 3, source: "manual", temperature: 99 }
  ];

  expect(getWeatherOverrideForTime(project, 3, 12)?.id).toBe("manual");
  expect(getWeatherOverrideForTime(project, 4, 12)?.id).toBe("scene");
});

it("varie les métriques de scène par palier déterministe de 5 minutes", () => {
  const project = createDefaultCalendarProject();
  project.weatherOverrides = [{
    id: "scene-variation",
    absoluteDay: 0,
    source: "sceneWeather",
    sourceId: "storm-scene",
    sceneId: "a",
    temperature: 10,
    rain: 5,
    dailyRainTotal: 30,
    windSpeed: 40,
    state: "storm",
    dominantState: "storm",
    trendKind: "stormy"
  }];

  const atStart = getWeatherOverrideForTime(project, 0, 8, 0)!;
  const sameStep = getWeatherOverrideForTime(project, 0, 8, 4)!;
  const nextStep = getWeatherOverrideForTime(project, 0, 8, 5)!;

  expect(sameStep.temperature).toBe(atStart.temperature);
  expect(sameStep.rain).toBe(atStart.rain);
  expect(sameStep.windSpeed).toBe(atStart.windSpeed);
  expect(nextStep.state).toBe("storm");
  expect(nextStep.dominantState).toBe("storm");
  expect(nextStep.trendKind).toBe("stormy");
  expect(nextStep.temperature).toBeGreaterThanOrEqual(8.5);
  expect(nextStep.temperature).toBeLessThanOrEqual(11.5);
  expect(nextStep.rain).toBeGreaterThanOrEqual(4);
  expect(nextStep.rain).toBeLessThanOrEqual(6);
  expect(nextStep.dailyRainTotal).toBeGreaterThanOrEqual(25.5);
  expect(nextStep.dailyRainTotal).toBeLessThanOrEqual(34.5);
  expect(nextStep.windSpeed).toBeGreaterThanOrEqual(34);
  expect(nextStep.windSpeed).toBeLessThanOrEqual(46);
  expect(`${nextStep.temperature}|${nextStep.rain}|${nextStep.windSpeed}`).not.toBe(`${atStart.temperature}|${atStart.rain}|${atStart.windSpeed}`);
});

it("interpole les overrides de météo de scène pendant la transition", () => {
  const project = createDefaultCalendarProject();
  project.weatherOverrides = [{
    id: "scene-transition",
    absoluteDay: 0,
    startMinuteOfDay: 60,
    endMinuteOfDay: 180,
    source: "sceneWeather",
    temperature: 20,
    rain: 10,
    windSpeed: 30,
    state: "storm",
    transitionStartAtMinutes: 60,
    transitionDurationMinutes: 60,
    transitionFrom: { temperature: 10, rain: 0, windSpeed: 10 }
  }];

  const early = getWeatherOverrideForTime(project, 0, 1, 15);
  expect(early?.temperature).toBeGreaterThanOrEqual(12.1);
  expect(early?.temperature).toBeLessThanOrEqual(12.9);
  expect(early?.rain).toBeGreaterThanOrEqual(2.3);
  expect(early?.rain).toBeLessThanOrEqual(2.7);
  expect(early?.windSpeed).toBeGreaterThanOrEqual(14.4);
  expect(early?.windSpeed).toBeLessThanOrEqual(15.6);
  expect(early?.state).toBeUndefined();

  const late = getWeatherOverrideForTime(project, 0, 1, 45);
  expect(late?.temperature).toBeGreaterThanOrEqual(16.4);
  expect(late?.temperature).toBeLessThanOrEqual(18.6);
  expect(late?.state).toBe("storm");
});