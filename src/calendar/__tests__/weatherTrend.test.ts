import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import { getWeatherTrendForDay } from "../weatherTrend";

const build = () => {
  const p = createDefaultCalendarProject();
  p.weatherSettings.seed = "trend-seed";
  p.seasons = [{
    id: "s1",
    name: "S",
    start: { monthId: "month-1", dayOfMonth: 1 },
    end: { monthId: "month-2", dayOfMonth: 30 },
    weatherProfile: {
      temperature: { min: 2, average: 12, max: 24 },
      windSpeed: { min: 2, average: 14, max: 35 },
      rain: { min: 0, average: 3, max: 9 },
      stability: 0.5,
      precipitationChance: 0.5,
      stormChance: 0.4,
      windVariability: 0.5
    }
  }];
  return p;
};

describe("weatherTrend", () => {
  it("retourne une tendance valide", () => {
    const t = getWeatherTrendForDay(build(), 10);
    expect(["cold","warm","wet","dry","windy","calm","stormy","stable","unstable"]).toContain(t.kind);
  });

  it("est déterministe", () => {
    const p = build();
    expect(getWeatherTrendForDay(p, 12)).toEqual(getWeatherTrendForDay(p, 12));
  });

  it("jours dans le même bloc partagent start/end", () => {
    const p = build();
    const a = getWeatherTrendForDay(p, 14);
    const b = getWeatherTrendForDay(p, Math.min(a.endAbsoluteDay, 15));
    expect(a.startAbsoluteDay).toBe(b.startAbsoluteDay);
    expect(a.endAbsoluteDay).toBe(b.endAbsoluteDay);
  });

  it("saison stable => durée plutôt longue", () => {
    const p = build();
    (p.seasons[0].weatherProfile as any).stability = 0.9;
    const t = getWeatherTrendForDay(p, 20);
    expect(t.durationDays).toBeGreaterThanOrEqual(6);
  });

  it("saison instable => durée plutôt courte", () => {
    const p = build();
    (p.seasons[0].weatherProfile as any).stability = 0.1;
    const t = getWeatherTrendForDay(p, 20);
    expect(t.durationDays).toBeLessThanOrEqual(4);
  });

  it("modificateurs finis et raisonnables", () => {
    const t = getWeatherTrendForDay(build(), 10);
    [t.temperatureOffset,t.rainMultiplier,t.windMultiplier,t.stormChanceModifier,t.stabilityModifier].forEach((v) => expect(Number.isFinite(v)).toBe(true));
    expect(t.rainMultiplier).toBeGreaterThan(0.4);
    expect(t.windMultiplier).toBeGreaterThan(0.4);
  });
});
