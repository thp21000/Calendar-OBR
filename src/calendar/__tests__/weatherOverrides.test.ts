import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { applyWeatherOverrideToDailySummary, getWeatherOverrideForDay } from "../weatherOverrides";

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
