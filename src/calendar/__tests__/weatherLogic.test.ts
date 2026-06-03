import { describe, expect, it } from "vitest";
import type { CalendarProject, Season } from "../../domain/types";
import { generateWeatherForTime, getCurrentWeather, getDailyWeatherForecast, getForecastWeatherForTime, getHourlyWeatherForecast } from "../weatherLogic";
import { getDailyWeatherSummary } from "../weatherDaily";

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
  it("override peut forcer la météo courante", () => {
    const project = buildProject();
    project.seasons = [{ id:"s1", name:"S", start:{monthId:"m1",dayOfMonth:1}, end:{monthId:"m2",dayOfMonth:30} }];
   project.weatherOverrides = [{ id:"o1", absoluteDay: 4, temperature: 99, windSpeed: 42, rain: 7, state: "storm", windDirection: "NE" } as any];
    const w = generateWeatherForTime(project, 4, 12)!;
    expect(w.temperature).toBe(99);
    expect(w.windSpeed).toBe(42);
    expect(w.rain).toBe(7);
    expect(w.state).toBe("storm");
    expect(w.windDirection).toBe("NE");
    expect(w.dailyMinTemperature).toBeDefined();
  });




  it("override partiel force seulement rain", () => {
    const project = buildProject();
    project.seasons = [{ id:"s1", name:"S", start:{monthId:"m1",dayOfMonth:1}, end:{monthId:"m2",dayOfMonth:30} }];
    const base = generateWeatherForTime(project, 5, 12)!;
    project.weatherOverrides = [{ id:"o2", absoluteDay: 5, rain: 11 } as any];
    const w = generateWeatherForTime(project, 5, 12)!;
    expect(w.rain).toBe(11);
    expect(w.temperature).toBe(base.temperature);
    expect(w.windSpeed).toBe(base.windSpeed);
  });
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
    project.weatherBiomeProfiles = {
      temperate: {
        temperature: { min: -20, average: -10, max: -5 },
        windSpeed: { min: 0, average: 3, max: 10 },
        rain: { min: 0, average: 1, max: 5 },
        dailyRain: { min: 0, average: 2, max: 8 },
        traits: { stability: 0.6, precipitationChance: 0.35, fogChance: 0.1, stormChance: 0.1, dayNightAmplitude: 5, windVariability: 0.3 },
        stateWeights: {}
      }
    };
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

  it("inclut les champs journaliers depuis getDailyWeatherSummary", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const weather = generateWeatherForTime(project, 4, 12);
    expect(weather).toBeDefined();
    if (!weather) return;
    expect(weather.dailyMinTemperature).toBeDefined();
    expect(weather.dailyMaxTemperature).toBeDefined();
    expect(weather.dailyRainTotal).toBeDefined();
    expect(weather.dominantState).toBeDefined();
  });

  it("generateWeatherForTime ajoute trendKind au snapshot", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const weather = generateWeatherForTime(project, 4, 12);
    expect(weather?.trendKind).toBeDefined();
  });

  it("temperature horaire reste entre min/max journaliers", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const weather = generateWeatherForTime(project, 4, 12);
    expect(weather).toBeDefined();
    if (!weather) return;
    expect(weather.dailyMinTemperature).toBeDefined();
    expect(weather.dailyMaxTemperature).toBeDefined();
    if (weather.dailyMinTemperature === undefined || weather.dailyMaxTemperature === undefined) return;
    expect(weather.temperature).toBeGreaterThanOrEqual(weather.dailyMinTemperature);
    expect(weather.temperature).toBeLessThanOrEqual(weather.dailyMaxTemperature);
  });

  it("à 5h la température est plus proche du min", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const weather = generateWeatherForTime(project, 4, 5);
    expect(weather).toBeDefined();
    if (!weather || weather.dailyMinTemperature === undefined || weather.dailyMaxTemperature === undefined) return;
    const distMin = Math.abs(weather.temperature - weather.dailyMinTemperature);
    const distMax = Math.abs(weather.temperature - weather.dailyMaxTemperature);
    expect(distMin).toBeLessThanOrEqual(distMax);
  });

  it("à 15h la température est plus proche du max", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const weather = generateWeatherForTime(project, 4, 15);
    expect(weather).toBeDefined();
    if (!weather || weather.dailyMinTemperature === undefined || weather.dailyMaxTemperature === undefined) return;
    const distMin = Math.abs(weather.temperature - weather.dailyMinTemperature);
    const distMax = Math.abs(weather.temperature - weather.dailyMaxTemperature);
    expect(distMax).toBeLessThanOrEqual(distMin);
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

  it("getForecastWeatherForTime conserve trendKind et dominantState", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const real = generateWeatherForTime(project, 8, 12);
    const forecast = getForecastWeatherForTime(project, 8, 12, 24);
    expect(real).toBeDefined();
    expect(forecast).toBeDefined();
    if (!real || !forecast) return;
    expect(forecast.trendKind).toBe(real.trendKind);
    expect(forecast.dominantState).toBe(real.dominantState);
  });

  it("getForecastWeatherForTime retourne les champs journaliers enrichis", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const forecast = getForecastWeatherForTime(project, 8, 12, 24);
    expect(forecast).toBeDefined();
    if (!forecast) return;
    expect(forecast.dailyMinTemperature).toBeDefined();
    expect(forecast.dailyMaxTemperature).toBeDefined();
    expect(forecast.dailyRainTotal).toBeDefined();
    expect(forecast.dominantState).toBeDefined();
    expect((forecast.dailyMinTemperature ?? 0)).toBeLessThanOrEqual(forecast.dailyMaxTemperature ?? 0);
    expect((forecast.dailyRainTotal ?? 0)).toBeGreaterThanOrEqual(0);
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

  it("getDailyWeatherForecast retourne des entrées enrichies avec trendKind", () => {
    const project = buildProject();
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];
    const forecast = getDailyWeatherForecast(project, 5);
    expect(forecast[0]?.weather.trendKind).toBeDefined();
    expect(forecast[0]?.weather.dailyMinTemperature).toBeDefined();
    expect(forecast[0]?.weather.dailyMaxTemperature).toBeDefined();
    expect(forecast[0]?.weather.dailyRainTotal).toBeDefined();
    expect(forecast[0]?.weather.dominantState).toBeDefined();
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
  
  it("generateWeatherForTime utilise la pluie horaire issue du plan journalier", () => {
    const project = buildProject();
    project.weatherSettings.seed = "rain-plan";
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];

    const morning = generateWeatherForTime(project, 6, 8);
    const afternoon = generateWeatherForTime(project, 6, 16);
    expect(morning).toBeDefined();
    expect(afternoon).toBeDefined();
    if (!morning || !afternoon) return;
    expect(morning.dailyRainTotal).toBeDefined();
    expect(afternoon.dailyRainTotal).toBeDefined();
    expect(morning.dailyRainTotal).toBe(afternoon.dailyRainTotal);
    expect(typeof morning.rain).toBe("number");
    expect(typeof afternoon.rain).toBe("number");
  });

  it("la somme des pluies horaires sur 24h reste proche du cumul journalier", () => {
    const project = buildProject();
    project.weatherSettings.seed = "sum-rain";
    project.seasons = [{
      id: "s1",
      name: "Saison pluvieuse",
      start: { monthId: "m1", dayOfMonth: 1 },
      end: { monthId: "m2", dayOfMonth: 30 },
      weatherProfile: {
        temperature: { min: 8, max: 18, average: 12 },
        windSpeed: { min: 3, max: 26, average: 12 },
        rain: { min: 0, max: 18, average: 9 }
      }
    }];

    const absoluteDay = 9;
    const snapshots = Array.from({ length: 24 }, (_, hour) => generateWeatherForTime(project, absoluteDay, hour)).filter(
      (entry): entry is NonNullable<typeof entry> => Boolean(entry)
    );
    expect(snapshots).toHaveLength(24);

    const rainSum = snapshots.reduce((sum, weather) => sum + weather.rain, 0);
    const dailyRainTotal = snapshots[0]?.dailyRainTotal;

    expect(dailyRainTotal).toBeDefined();
    expect(Math.abs(rainSum - (dailyRainTotal ?? 0))).toBeLessThanOrEqual(0.5);
  });

  it("generateWeatherForTime utilise le vent horaire issu du plan journalier", () => {
    const project = buildProject();
    project.weatherSettings.seed = "wind-plan";
    project.seasons = [{
      id: "s1",
      name: "Vent",
      start: { monthId: "m1", dayOfMonth: 1 },
      end: { monthId: "m2", dayOfMonth: 30 },
      weatherProfile: {
        temperature: { min: 5, max: 16, average: 10 },
        windSpeed: { min: 2, max: 40, average: 18 },
        rain: { min: 0, max: 8, average: 2 }
      }
    }];

    const day = 14;
    const snapshots = Array.from({ length: 24 }, (_, hour) => generateWeatherForTime(project, day, hour)).filter(
      (entry): entry is NonNullable<typeof entry> => Boolean(entry)
    );
    expect(snapshots).toHaveLength(24);
    expect(snapshots.every((entry) => entry.windSpeed >= 0)).toBe(true);
    expect(snapshots.every((entry) => ["N", "NE", "E", "SE", "S", "SW", "W", "NW"].includes(entry.windDirection))).toBe(true);
  });

  it("sur 24h les directions restent localement cohérentes", () => {
    const project = buildProject();
    project.weatherSettings.seed = "wind-direction";
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];

    const day = 15;
    const snapshots = Array.from({ length: 24 }, (_, hour) => generateWeatherForTime(project, day, hour)).filter(
      (entry): entry is NonNullable<typeof entry> => Boolean(entry)
    );
    const idx = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    let coherentTransitions = 0;
    for (let i = 1; i < snapshots.length; i++) {
      const a = idx.indexOf(snapshots[i - 1].windDirection);
      const b = idx.indexOf(snapshots[i].windDirection);
      const diff = Math.abs(a - b);
      const circular = Math.min(diff, 8 - diff);
      if (circular <= 2) coherentTransitions++;
    }
    expect(coherentTransitions).toBeGreaterThanOrEqual(18);
  });

  it("le max horaire reste dans une limite raisonnable proche du max journalier", () => {
    const project = buildProject();
    project.weatherSettings.seed = "wind-max";
    project.seasons = [{ id: "s1", name: "S", start: { monthId: "m1", dayOfMonth: 1 }, end: { monthId: "m2", dayOfMonth: 30 } }];

    const day = 11;
    const snapshots = Array.from({ length: 24 }, (_, hour) => generateWeatherForTime(project, day, hour)).filter(
      (entry): entry is NonNullable<typeof entry> => Boolean(entry)
    );
    expect(snapshots).toHaveLength(24);

    const hourlyMax = Math.max(...snapshots.map((entry) => entry.windSpeed));
    const dailySummary = getDailyWeatherSummary(project, day);
    expect(dailySummary).toBeDefined();
    if (!dailySummary) return;
    expect(hourlyMax).toBeLessThanOrEqual(dailySummary.maxWindSpeed * 1.35);
  });

  it("generateWeatherForTime utilise l'état horaire enrichi", () => {
    const project = buildProject();
    project.weatherSettings.seed = "state-enriched";
    project.seasons = [{
      id: "s1",
      name: "S",
      start: { monthId: "m1", dayOfMonth: 1 },
      end: { monthId: "m2", dayOfMonth: 30 },
      weatherProfile: {
        temperature: { min: 6, max: 18, average: 11 },
        windSpeed: { min: 1, max: 26, average: 12 },
        rain: { min: 0, max: 12, average: 5 }
      }
    }];

    const day = 18;
    const snapshots = Array.from({ length: 24 }, (_, hour) => generateWeatherForTime(project, day, hour)).filter(
      (entry): entry is NonNullable<typeof entry> => Boolean(entry)
    );
    expect(snapshots).toHaveLength(24);
    expect(snapshots.some((entry) => entry.dominantState !== undefined)).toBe(true);
  });

  it("jour dominé storm/heavyRain n'affiche pas uniquement clear hors épisodes", () => {
    const project = buildProject();
    project.weatherSettings.seed = "state-dominant";
    project.seasons = [{
      id: "s1",
      name: "Pluvieux",
      start: { monthId: "m1", dayOfMonth: 1 },
      end: { monthId: "m2", dayOfMonth: 30 },
      weatherProfile: {
        temperature: { min: 8, max: 16, average: 11 },
        windSpeed: { min: 4, max: 50, average: 22 },
        rain: { min: 0, max: 20, average: 10 }
      }
    }];

    const day = 20;
    const snapshots = Array.from({ length: 24 }, (_, hour) => generateWeatherForTime(project, day, hour)).filter(
      (entry): entry is NonNullable<typeof entry> => Boolean(entry)
    );
    expect(snapshots).toHaveLength(24);

    const dominant = snapshots[0].dominantState;
    if (dominant !== "storm" && dominant !== "heavyRain" && dominant !== "tempest") return;

    const dryHours = snapshots.filter((entry) => entry.rain < 0.5);
    if (dryHours.length === 0) return;
    expect(dryHours.some((entry) => entry.state !== "clear")).toBe(true);
  });
});