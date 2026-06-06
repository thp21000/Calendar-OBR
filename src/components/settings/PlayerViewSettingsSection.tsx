import type { CSSProperties, ReactNode } from "react";
import { normalizePlayerViewSettings } from "../../calendar/playerViewSettings";
import type { CalendarProject, PlayerForecastDetailLevel, PlayerViewSettings, PlayerViewTab, PlayerWeatherDetailLevel } from "../../domain/types";
import { t } from "../../i18n/messages";
import { CollapsibleSection } from "../CollapsibleSection";

export const PlayerViewSettingsSection = ({ project, onProjectUpdate, inputStyle }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; inputStyle: CSSProperties }) => {
  const settings = normalizePlayerViewSettings(project.uiSettings.playerView);
  const update = (next: PlayerViewSettings) => onProjectUpdate({ ...project, uiSettings: { ...project.uiSettings, playerView: normalizePlayerViewSettings(next) } });
  const setTabEnabled = (tab: PlayerViewTab, enabled: boolean) => update({ ...settings, enabledTabs: { ...settings.enabledTabs, [tab]: enabled } });
  const setDefaultTab = (defaultTab: PlayerViewTab) => update({ ...settings, defaultTab });
  const setToday = <K extends keyof PlayerViewSettings["today"]>(key: K, value: PlayerViewSettings["today"][K]) => update({ ...settings, today: { ...settings.today, [key]: value } });
  const setMonth = <K extends keyof PlayerViewSettings["month"]>(key: K, value: PlayerViewSettings["month"][K]) => update({ ...settings, month: { ...settings.month, [key]: value } });
  const oneTabOnly = settings.enabledTabs.today !== settings.enabledTabs.month;

  return <div style={{ display: "grid", gap: 8 }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#e5e7eb" }}>{t(project.locale, "playerSettings.title")}</div>
      <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.4 }}>{t(project.locale, "playerSettings.description")}</div>
    </div>
    <div style={blockStyle}>
      <div style={blockTitleStyle}>{t(project.locale, "playerSettings.general")}</div>
      <CheckRow label={t(project.locale, "playerSettings.enableTodayTab")} checked={settings.enabledTabs.today} disabled={oneTabOnly && settings.enabledTabs.today} onChange={(checked) => setTabEnabled("today", checked)} />
      <CheckRow label={t(project.locale, "playerSettings.enableMonthTab")} checked={settings.enabledTabs.month} disabled={oneTabOnly && settings.enabledTabs.month} onChange={(checked) => setTabEnabled("month", checked)} />
      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{t(project.locale, "playerSettings.atLeastOneTab")}</div>
      <Field label={t(project.locale, "playerSettings.defaultTab")}>
        <select value={settings.defaultTab} onChange={(event) => setDefaultTab(event.target.value as PlayerViewTab)} style={inputStyle}>
          {settings.enabledTabs.today ? <option value="today">{t(project.locale, "player.tab.today")}</option> : null}
          {settings.enabledTabs.month ? <option value="month">{t(project.locale, "player.tab.month")}</option> : null}
        </select>
      </Field>
    </div>

    <CollapsibleSection title={t(project.locale, "playerSettings.todayTab")} storageKey="calendar-obr.settings.playerView.today">
      <div style={gridStyle}>
        <CheckRow label={t(project.locale, "playerSettings.showHeader")} checked={settings.today.showHeader} onChange={(checked) => setToday("showHeader", checked)} />
        <CheckRow label={t(project.locale, "playerSettings.showDate")} checked={settings.today.showDate} onChange={(checked) => setToday("showDate", checked)} />
        <CheckRow label={t(project.locale, "playerSettings.showSeason")} checked={settings.today.showSeason} onChange={(checked) => setToday("showSeason", checked)} />
        <CheckRow label={t(project.locale, "playerSettings.showWeather")} checked={settings.today.showWeather} onChange={(checked) => setToday("showWeather", checked)} />
        <CheckRow label={t(project.locale, "playerSettings.showBiome")} checked={settings.today.showBiome} onChange={(checked) => setToday("showBiome", checked)} />
        <CheckRow label={t(project.locale, "playerSettings.showMoons")} checked={settings.today.showMoons} onChange={(checked) => setToday("showMoons", checked)} />
        <CheckRow label={t(project.locale, "playerSettings.showEvents")} checked={settings.today.showEvents} onChange={(checked) => setToday("showEvents", checked)} />
        <CheckRow label={t(project.locale, "playerSettings.showWeatherEvents")} checked={settings.today.showWeatherEvents} onChange={(checked) => setToday("showWeatherEvents", checked)} />
        <CheckRow label={t(project.locale, "playerSettings.showMoonEvents")} checked={settings.today.showMoonEvents} onChange={(checked) => setToday("showMoonEvents", checked)} />
        <CheckRow label={t(project.locale, "playerSettings.showDayNotes")} checked={settings.today.showDayNotes} onChange={(checked) => setToday("showDayNotes", checked)} />
        <CheckRow label={t(project.locale, "playerSettings.showHourlyForecast")} checked={settings.today.showHourlyForecast} onChange={(checked) => setToday("showHourlyForecast", checked)} />
      </div>
      <DetailSelect label={t(project.locale, "playerSettings.weatherDetailLevel")} value={settings.today.weatherDetailLevel} inputStyle={inputStyle} locale={project.locale} onChange={(value) => setToday("weatherDetailLevel", value)} />
      <DetailSelect label={t(project.locale, "playerSettings.forecastDetailLevel")} value={settings.today.forecastDetailLevel} inputStyle={inputStyle} locale={project.locale} onChange={(value) => setToday("forecastDetailLevel", value)} />
    </CollapsibleSection>

    <CollapsibleSection title={t(project.locale, "playerSettings.monthTab")} storageKey="calendar-obr.settings.playerView.month">
      <div style={gridStyle}>
        <CheckRow label={t(project.locale, "playerSettings.showMonthGrid")} checked={settings.month.showMonthGrid} onChange={(checked) => setMonth("showMonthGrid", checked)} />
        <CheckRow label={t(project.locale, "playerSettings.showEvents")} checked={settings.month.showPublicEvents} onChange={(checked) => setMonth("showPublicEvents", checked)} />
        <CheckRow label={t(project.locale, "playerSettings.showWeatherEvents")} checked={settings.month.showWeatherEvents} onChange={(checked) => setMonth("showWeatherEvents", checked)} />
        <CheckRow label={t(project.locale, "playerSettings.showMoonEvents")} checked={settings.month.showMoonEvents} onChange={(checked) => setMonth("showMoonEvents", checked)} />
        <CheckRow label={t(project.locale, "playerSettings.showDayNotes")} checked={settings.month.showDayNotes} onChange={(checked) => setMonth("showDayNotes", checked)} />
        <CheckRow label={t(project.locale, "playerSettings.showWeatherSummary")} checked={settings.month.showWeatherSummary} onChange={(checked) => setMonth("showWeatherSummary", checked)} />
        <CheckRow label={t(project.locale, "playerSettings.showFiveDayForecast")} checked={settings.month.showFiveDayForecast} onChange={(checked) => setMonth("showFiveDayForecast", checked)} />
      </div>
      <DetailSelect label={t(project.locale, "playerSettings.weatherDetailLevel")} value={settings.month.weatherDetailLevel} inputStyle={inputStyle} locale={project.locale} onChange={(value) => setMonth("weatherDetailLevel", value)} />
      <DetailSelect label={t(project.locale, "playerSettings.forecastDetailLevel")} value={settings.month.forecastDetailLevel} inputStyle={inputStyle} locale={project.locale} onChange={(value) => setMonth("forecastDetailLevel", value)} />
    </CollapsibleSection>
  </div>;
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => <label style={{ display: "block" }}><div style={{ fontSize: 12, color: "#cbd5e1" }}>{label}</div>{children}</label>;
const CheckRow = ({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) => (
  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: disabled ? "#6b7280" : "#cbd5e1", marginBottom: 6 }}>
    <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
    {label}
  </label>
);
const DetailSelect = ({ label, value, inputStyle, locale, onChange }: { label: string; value: PlayerWeatherDetailLevel | PlayerForecastDetailLevel; inputStyle: CSSProperties; locale: CalendarProject["locale"]; onChange: (value: PlayerWeatherDetailLevel | PlayerForecastDetailLevel) => void }) => (
  <Field label={label}>
    <select value={value} onChange={(event) => onChange(event.target.value as PlayerWeatherDetailLevel | PlayerForecastDetailLevel)} style={inputStyle}>
      <option value="precise">{t(locale, "playerSettings.detailPrecise")}</option>
      <option value="broad">{t(locale, "playerSettings.detailBroad")}</option>
      <option value="narrative">{t(locale, "playerSettings.detailNarrative")}</option>
    </select>
  </Field>
);
const blockStyle: CSSProperties = { border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#10131a" };
const blockTitleStyle: CSSProperties = { fontSize: 12, fontWeight: 700, color: "#e5e7eb", marginBottom: 6 };
const gridStyle: CSSProperties = { display: "grid", gap: 2, marginBottom: 8 };
