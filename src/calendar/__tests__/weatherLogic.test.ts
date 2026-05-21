import { describe, expect, it } from "vitest";
import type { CalendarProject, Season } from "../../domain/types";
import { generateWeatherForTime, getCurrentWeather, getDailyWeatherForecast, getForecastWeatherForTime, getHourlyWeatherForecast } from "../weatherLogic";

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

  it("generateWeatherForTime retourne bien un state", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const weather = generateWeatherForTime(project, 4, 12)!;
    expect(weather.state).toBeDefined();
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
    expect(forecast[0]?.weather).toEqual(
      getForecastWeatherForTime(project, project.currentTime.absoluteDay, project.currentTime.hour + 1, 1)
    );
  });

  it("gère le passage de 23:00 à 00:00 le jour suivant", () => {
    const project = buildProject();
    project.currentTime = { absoluteDay: 10, hour: 22, minute: 0 };
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const forecast = getHourlyWeatherForecast(project, 5);

    expect(forecast).toHaveLength(5);
    expect(forecast[0]?.weather).toEqual(getForecastWeatherForTime(project, 10, 23, 1));
    expect(forecast[1]?.weather).toEqual(getForecastWeatherForTime(project, 11, 0, 2));
    expect(forecast[2]?.weather).toEqual(getForecastWeatherForTime(project, 11, 1, 3));
    expect(forecast[3]?.weather).toEqual(getForecastWeatherForTime(project, 11, 2, 4));
    expect(forecast[4]?.weather).toEqual(getForecastWeatherForTime(project, 11, 3, 5));
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
    expect(forecast[0]?.weather).toEqual(getForecastWeatherForTime(project, project.currentTime.absoluteDay + 1, 12, 24));
  });

  it("les entrées de prévision journalière utilisent l'heure fixe 12", () => {
    const project = buildProject();
    project.currentTime = { absoluteDay: 10, hour: 23, minute: 0 };
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const forecast = getDailyWeatherForecast(project, 5);

    expect(forecast[0]?.weather).toEqual(getForecastWeatherForTime(project, 11, 12, 24));
    expect(forecast[1]?.weather).toEqual(getForecastWeatherForTime(project, 12, 12, 48));
    expect(forecast[4]?.weather).toEqual(getForecastWeatherForTime(project, 15, 12, 120));
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

  it("getCurrentWeather reste identique quel que soit le forecastMode", () => {
    const projectFine = buildProject();
    projectFine.weatherSettings = { seed: "abc", forecastMode: "fine" };
    projectFine.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];

    const projectWide = buildProject();
    projectWide.weatherSettings = { seed: "abc", forecastMode: "wide" };
    projectWide.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];

    expect(getCurrentWeather(projectFine)).toEqual(getCurrentWeather(projectWide));
  });

  it("les prévisions horaires utilisent le mode de prévision (fine vs wide)", () => {
    const fine = buildProject();
    fine.weatherSettings = { seed: "abc", forecastMode: "fine" };
    fine.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];

    const wide = buildProject();
    wide.weatherSettings = { seed: "abc", forecastMode: "wide" };
    wide.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];

    expect(getHourlyWeatherForecast(fine, 5)).not.toEqual(getHourlyWeatherForecast(wide, 5));
  });

  it("les prévisions journalières utilisent le mode de prévision (fine vs wide)", () => {
    const fine = buildProject();
    fine.weatherSettings = { seed: "abc", forecastMode: "fine" };
    fine.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];

    const wide = buildProject();
    wide.weatherSettings = { seed: "abc", forecastMode: "wide" };
    wide.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];

    expect(getDailyWeatherForecast(fine, 5)).not.toEqual(getDailyWeatherForecast(wide, 5));
  });

  it("les prévisions wide restent déterministes", () => {
    const project = buildProject();
    project.weatherSettings = { seed: "abc", forecastMode: "wide" };
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    expect(getHourlyWeatherForecast(project, 5)).toEqual(getHourlyWeatherForecast(project, 5));
    expect(getDailyWeatherForecast(project, 5)).toEqual(getDailyWeatherForecast(project, 5));
  });

  it("les prévisions ne produisent pas de vent/pluie négatifs", () => {
    const project = buildProject();
    project.weatherSettings = { seed: "abc", forecastMode: "wide" };
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const hourly = getHourlyWeatherForecast(project, 5);
    const daily = getDailyWeatherForecast(project, 5);
    for (const entry of [...hourly, ...daily]) {
      expect(entry.weather.windSpeed).toBeGreaterThanOrEqual(0);
      expect(entry.weather.rain).toBeGreaterThanOrEqual(0);
    }
  });
});