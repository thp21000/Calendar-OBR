import { describe, expect, it } from "vitest";
import type { CalendarProject, Season } from "../../domain/types";
import { generateWeatherForTime, getCurrentWeather, getDailyWeatherForecast, getHourlyWeatherForecast } from "../weatherLogic";

const buildProject = (): CalendarProject => ({
  schemaVersion: 1,
  appVersion: "0.1.0",
  id: "project-weather",
  name: "Weather",
  locale: "fr",
  units: { temperature: "celsius", windSpeed: "kmh", rain: "mm" },
  currentTime: { absoluteDay: 0, hour: 8, minute: 0 },
  calendarSystem: {
    eraName: "CE",
    startYear: 1000,
    firstWeekdayOffset: 0,
    weekdays: [{ id: "w1", name: "W1", order: 1 }],
    months: [
      { id: "m1", name: "M1", order: 1, days: 30 },
      { id: "m2", name: "M2", order: 2, days: 30 }
    ]
  },
  events: [],
  seasons: [],
  moons: [],
  weatherSettings: { seed: "abc" },
  weatherEvents: [],
  uiSettings: { activeTab: "today", compactMode: false }
});

describe("weatherLogic", () => {
  it("retourne undefined si aucune saison", () => {
    expect(getCurrentWeather(buildProject())).toBeUndefined();
  });

  it("retourne une météo si une saison existe", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    expect(getCurrentWeather(project)).toBeDefined();
  });

  it("utilise le profil météo de la saison et accepte températures négatives", () => {
    const project = buildProject();
    const season: Season = {
      id: "s1",
      name: "Hiver",
      start: { monthId: "m1", dayOfMonth: 1 },
      end: { monthId: "m2", dayOfMonth: 30 },
      weatherProfile: {
        temperature: { min: -20, max: -5, average: -10 },
        windSpeed: { min: 0, max: 10, average: 3 },
        rain: { min: 0, max: 5, average: 1 }
      }
    };
    project.seasons = [season];
    const weather = getCurrentWeather(project)!;
    expect(weather.temperature).toBeLessThanOrEqual(-5);
    expect(weather.temperature).toBeGreaterThanOrEqual(-20);
  });

  it("ne produit pas de vent/pluie négatifs", () => {
    const project = buildProject();
    project.seasons = [{
      id: "s1",
      name: "S",
      start: { monthId: "m1", dayOfMonth: 1 },
      end: { monthId: "m2", dayOfMonth: 30 },
      weatherProfile: {
        temperature: { min: 0, max: 10, average: 5 },
        windSpeed: { min: -10, max: -1, average: -2 },
        rain: { min: -3, max: -1, average: -2 }
      }
    }];
    const weather = getCurrentWeather(project)!;
    expect(weather.windSpeed).toBeGreaterThanOrEqual(0);
    expect(weather.rain).toBeGreaterThanOrEqual(0);
  });

  it("retourne le même résultat pour même projet/jour/heure", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const a = generateWeatherForTime(project, 4, 12);
    const b = generateWeatherForTime(project, 4, 12);
    expect(a).toEqual(b);
  });

  it("retourne un résultat potentiellement différent pour une autre heure", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const a = generateWeatherForTime(project, 4, 12)!;
    const b = generateWeatherForTime(project, 4, 13)!;
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it("direction du vent autorisée", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const weather = getCurrentWeather(project)!;
    expect(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]).toContain(weather.windDirection);
  });
  
  it("getHourlyWeatherForecast retourne 5 entrées si saison existe", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const forecast = getHourlyWeatherForecast(project, 5);
    expect(forecast).toHaveLength(5);
  });

  it("la première entrée de forecast correspond à +1 h", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const forecast = getHourlyWeatherForecast(project, 5);
    expect(forecast[0]?.offsetHours).toBe(1);
    expect(forecast[0]?.weather).toEqual(generateWeatherForTime(project, project.currentTime.absoluteDay, project.currentTime.hour + 1));
  });

  it("gère le passage de 23:00 à 00:00 le jour suivant", () => {
    const project = buildProject();
    project.currentTime = { absoluteDay: 10, hour: 22, minute: 0 };
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const forecast = getHourlyWeatherForecast(project, 5);

    expect(forecast).toHaveLength(5);
    expect(forecast[0]?.weather).toEqual(generateWeatherForTime(project, 10, 23));
    expect(forecast[1]?.weather).toEqual(generateWeatherForTime(project, 11, 0));
    expect(forecast[2]?.weather).toEqual(generateWeatherForTime(project, 11, 1));
    expect(forecast[3]?.weather).toEqual(generateWeatherForTime(project, 11, 2));
    expect(forecast[4]?.weather).toEqual(generateWeatherForTime(project, 11, 3));
  });

  it("retourne un tableau vide en forecast si aucune saison n'existe", () => {
    const project = buildProject();
    expect(getHourlyWeatherForecast(project, 5)).toEqual([]);
  });

  it("forecast déterministe pour même projet et même heure", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const a = getHourlyWeatherForecast(project, 5);
    const b = getHourlyWeatherForecast(project, 5);
    expect(a).toEqual(b);
  });

  it("getDailyWeatherForecast retourne 5 entrées si saison existe", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const forecast = getDailyWeatherForecast(project, 5);
    expect(forecast).toHaveLength(5);
  });

  it("la première entrée de prévision journalière correspond à +1 jour", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const forecast = getDailyWeatherForecast(project, 5);
    expect(forecast[0]?.offsetDays).toBe(1);
    expect(forecast[0]?.weather).toEqual(generateWeatherForTime(project, project.currentTime.absoluteDay + 1, 12));
  });

  it("les entrées de prévision journalière utilisent l'heure fixe 12", () => {
    const project = buildProject();
    project.currentTime = { absoluteDay: 10, hour: 23, minute: 0 };
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const forecast = getDailyWeatherForecast(project, 5);

    expect(forecast[0]?.weather).toEqual(generateWeatherForTime(project, 11, 12));
    expect(forecast[1]?.weather).toEqual(generateWeatherForTime(project, 12, 12));
    expect(forecast[4]?.weather).toEqual(generateWeatherForTime(project, 15, 12));
  });

  it("retourne un tableau vide en prévision journalière si aucune saison n'existe", () => {
    const project = buildProject();
    expect(getDailyWeatherForecast(project, 5)).toEqual([]);
  });

  it("prévision journalière déterministe pour même projet et même heure", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const a = getDailyWeatherForecast(project, 5);
    const b = getDailyWeatherForecast(project, 5);
    expect(a).toEqual(b);
  });
});