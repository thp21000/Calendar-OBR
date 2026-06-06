import { describe, expect, it } from "vitest";
import { DEFAULT_PLAYER_VIEW_SETTINGS, normalizePlayerViewSettings } from "../playerViewSettings";

describe("playerViewSettings", () => {
  it("complète les champs manquants avec les valeurs par défaut", () => {
    const settings = normalizePlayerViewSettings({ today: { showWeather: false } });
    expect(settings.today.showWeather).toBe(false);
    expect(settings.today.showHeader).toBe(DEFAULT_PLAYER_VIEW_SETTINGS.today.showHeader);
    expect(settings.month.showMonthGrid).toBe(DEFAULT_PLAYER_VIEW_SETTINGS.month.showMonthGrid);
  });

  it("réactive Aujourd’hui si les deux onglets sont désactivés", () => {
    const settings = normalizePlayerViewSettings({ enabledTabs: { today: false, month: false } });
    expect(settings.enabledTabs).toEqual({ today: true, month: false });
    expect(settings.defaultTab).toBe("today");
  });

  it("corrige l’onglet par défaut s’il pointe vers un onglet désactivé", () => {
    const settings = normalizePlayerViewSettings({ enabledTabs: { today: false, month: true }, defaultTab: "today" });
    expect(settings.defaultTab).toBe("month");
  });

  it("corrige les niveaux de détail invalides", () => {
    const settings = normalizePlayerViewSettings({ today: { weatherDetailLevel: "secret" }, month: { forecastDetailLevel: "exact" } });
    expect(settings.today.weatherDetailLevel).toBe(DEFAULT_PLAYER_VIEW_SETTINGS.today.weatherDetailLevel);
    expect(settings.month.forecastDetailLevel).toBe(DEFAULT_PLAYER_VIEW_SETTINGS.month.forecastDetailLevel);
  });
});
