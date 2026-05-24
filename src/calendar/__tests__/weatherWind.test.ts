import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { getHourlyWindForDay } from "../weatherWind";
import type { DailyWeatherSummary } from "../weatherDaily";

const buildSummary = (overrides: Partial<DailyWeatherSummary> = {}): DailyWeatherSummary => ({
  absoluteDay: 12,
  minTemperature: 5,
  maxTemperature: 17,
  averageTemperature: 10,
  rainTotal24h: 1,
  maxWindSpeed: 24,
  dominantWindDirection: "NE",
  dominantState: "cloudy",
  ...overrides
});

describe("weatherWind", () => {
  it("retourne 24 valeurs", () => {
    const project = createDefaultCalendarProject();
    const hours = getHourlyWindForDay(project, 12, buildSummary());
    expect(hours).toHaveLength(24);
  });

  it("chaque vitesse est >= 0", () => {
    const project = createDefaultCalendarProject();
    const hours = getHourlyWindForDay(project, 12, buildSummary());
    expect(hours.every((entry) => entry.windSpeed >= 0)).toBe(true);
  });

  it("chaque direction est valide", () => {
    const project = createDefaultCalendarProject();
    const allowed = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const hours = getHourlyWindForDay(project, 12, buildSummary());
    expect(hours.every((entry) => allowed.includes(entry.windDirection))).toBe(true);
  });

  it("est déterministe pour même projet/jour/résumé", () => {
    const project = createDefaultCalendarProject();
    project.weatherSettings.seed = "wind-stable";
    const summary = buildSummary({ dominantState: "strongWind", maxWindSpeed: 38, dominantWindDirection: "W" });
    expect(getHourlyWindForDay(project, 77, summary)).toEqual(getHourlyWindForDay(project, 77, summary));
  });

  it("la direction dominante apparaît plusieurs fois", () => {
    const project = createDefaultCalendarProject();
    const summary = buildSummary({ dominantWindDirection: "S" });
    const hours = getHourlyWindForDay(project, 22, summary);
    const dominantCount = hours.filter((entry) => entry.windDirection === "S").length;
    expect(dominantCount).toBeGreaterThanOrEqual(8);
  });

  it("strongWind/storm/tempest tendent vers des vents plus forts qu'un clear comparable", () => {
    const project = createDefaultCalendarProject();
    project.weatherSettings.seed = "wind-compare";

    const clear = getHourlyWindForDay(project, 50, buildSummary({ dominantState: "clear", maxWindSpeed: 30 }));
    const storm = getHourlyWindForDay(project, 50, buildSummary({ dominantState: "storm", maxWindSpeed: 30 }));

    const clearAvg = clear.reduce((sum, entry) => sum + entry.windSpeed, 0) / clear.length;
    const stormAvg = storm.reduce((sum, entry) => sum + entry.windSpeed, 0) / storm.length;
    const clearMax = Math.max(...clear.map((entry) => entry.windSpeed));
    const stormMax = Math.max(...storm.map((entry) => entry.windSpeed));

    expect(stormAvg >= clearAvg || stormMax > clearMax).toBe(true);
  });

  it("deux jours différents peuvent produire des répartitions différentes", () => {
    const project = createDefaultCalendarProject();
    project.weatherSettings.seed = "wind-days";
    const summary = buildSummary({ dominantState: "tempest", maxWindSpeed: 42, dominantWindDirection: "NW" });
    expect(getHourlyWindForDay(project, 120, summary)).not.toEqual(getHourlyWindForDay(project, 121, summary));
  });
});
