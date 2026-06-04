import type { CSSProperties } from "react";
import { DEFAULT_WEATHER_DOMINANCE_CONFIGS, DEFAULT_WEATHER_STATE_CONFIGS, DEFAULT_WEATHER_TREND_CONFIGS, WEATHER_TRENDS, getWeatherAdvancedSettings, getWeatherStateLabel, getWeatherTrendLabel, normalizeWeatherAdvancedSettings } from "../../calendar/weatherAdvancedSettings";
import { WEATHER_STATES } from "../../calendar/weatherStates";
import type { CalendarProject, LocaleCode, WeatherAdvancedSettings, WeatherAdvancedThresholds, WeatherDominanceConfig, WeatherState, WeatherStateConfig, WeatherTrendConfig, WeatherTrendKind } from "../../domain/types";
import { t } from "../../i18n/messages";
import { CollapsibleSection } from "../CollapsibleSection";

const cardStyle: CSSProperties = { border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827", display: "grid", gap: 6 };
const rowStyle: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 };
const helpStyle: CSSProperties = { fontSize: 12, color: "#9ca3af", marginBottom: 8 };
const metaStyle: CSSProperties = { fontSize: 11, color: "#94a3b8" };
const buttonStyle: CSSProperties = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "5px 8px", fontSize: 12, cursor: "pointer" };

const patchAdvancedSettings = (project: CalendarProject, patch: WeatherAdvancedSettings): CalendarProject => ({
  ...project,
  weatherAdvancedSettings: normalizeWeatherAdvancedSettings({
    ...(project.weatherAdvancedSettings ?? {}),
    ...patch,
    stateConfigs: { ...(project.weatherAdvancedSettings?.stateConfigs ?? {}), ...(patch.stateConfigs ?? {}) },
    trendConfigs: { ...(project.weatherAdvancedSettings?.trendConfigs ?? {}), ...(patch.trendConfigs ?? {}) },
    dominanceConfigs: { ...(project.weatherAdvancedSettings?.dominanceConfigs ?? {}), ...(patch.dominanceConfigs ?? {}) }
  })
});

const textPatch = (label: Partial<Record<LocaleCode, string>> | undefined, locale: LocaleCode, value: string) => ({ ...(label ?? {}), [locale]: value });
const numberOrUndefined = (value: string) => value === "" ? undefined : Number(value);

const ThresholdInput = ({ label, value, onChange, inputStyle }: { label: string; value: number | undefined; onChange: (value: number | undefined) => void; inputStyle: CSSProperties }) => (
  <label style={{ display: "block" }}>
    <div style={{ fontSize: 11 }}>{label}</div>
    <input type="number" value={value ?? ""} onChange={(event) => onChange(numberOrUndefined(event.target.value))} style={inputStyle} />
  </label>
);

const ThresholdGrid = ({ project, thresholds, onChange, inputStyle, includeChances = false }: { project: CalendarProject; thresholds: WeatherAdvancedThresholds; onChange: (thresholds: WeatherAdvancedThresholds) => void; inputStyle: CSSProperties; includeChances?: boolean }) => (
  <div style={rowStyle}>
    <ThresholdInput label={t(project.locale, "weatherAdvanced.minTemperature")} value={thresholds.minTemperature} onChange={(value) => onChange({ ...thresholds, minTemperature: value })} inputStyle={inputStyle} />
    <ThresholdInput label={t(project.locale, "weatherAdvanced.maxTemperature")} value={thresholds.maxTemperature} onChange={(value) => onChange({ ...thresholds, maxTemperature: value })} inputStyle={inputStyle} />
    <ThresholdInput label={t(project.locale, "weatherAdvanced.minWindSpeed")} value={thresholds.minWindSpeed} onChange={(value) => onChange({ ...thresholds, minWindSpeed: value })} inputStyle={inputStyle} />
    <ThresholdInput label={t(project.locale, "weatherAdvanced.maxWindSpeed")} value={thresholds.maxWindSpeed} onChange={(value) => onChange({ ...thresholds, maxWindSpeed: value })} inputStyle={inputStyle} />
    <ThresholdInput label={t(project.locale, includeChances ? "weatherAdvanced.minDailyRainTotal" : "weatherAdvanced.minRain")} value={thresholds.minRain ?? thresholds.minDailyRainTotal} onChange={(value) => onChange({ ...thresholds, minRain: value, minDailyRainTotal: includeChances ? value : thresholds.minDailyRainTotal })} inputStyle={inputStyle} />
    <ThresholdInput label={t(project.locale, includeChances ? "weatherAdvanced.maxDailyRainTotal" : "weatherAdvanced.maxRain")} value={thresholds.maxRain ?? thresholds.maxDailyRainTotal} onChange={(value) => onChange({ ...thresholds, maxRain: value, maxDailyRainTotal: includeChances ? value : thresholds.maxDailyRainTotal })} inputStyle={inputStyle} />
    {includeChances ? <>
      <ThresholdInput label={t(project.locale, "weatherAdvanced.minPrecipitationChance")} value={thresholds.minPrecipitationChance} onChange={(value) => onChange({ ...thresholds, minPrecipitationChance: value })} inputStyle={inputStyle} />
      <ThresholdInput label={t(project.locale, "weatherAdvanced.minStormChance")} value={thresholds.minStormChance} onChange={(value) => onChange({ ...thresholds, minStormChance: value })} inputStyle={inputStyle} />
      <ThresholdInput label={t(project.locale, "weatherAdvanced.minFogChance")} value={thresholds.minFogChance} onChange={(value) => onChange({ ...thresholds, minFogChance: value })} inputStyle={inputStyle} />
    </> : null}
  </div>
);

const StateConfigCard = ({ project, config, inputStyle, onProjectUpdate }: { project: CalendarProject; config: WeatherStateConfig; inputStyle: CSSProperties; onProjectUpdate: (project: CalendarProject) => void }) => {
  const patch = (next: Partial<WeatherStateConfig>) => onProjectUpdate(patchAdvancedSettings(project, { stateConfigs: { [config.id]: { ...config, ...next } } }));
  const reset = () => onProjectUpdate(patchAdvancedSettings(project, { stateConfigs: { [config.id]: DEFAULT_WEATHER_STATE_CONFIGS[config.id as WeatherState] ?? { id: config.id, enabled: true, custom: true } } }));
  return (
    <CollapsibleSection title={`${config.icon ?? "•"} ${getWeatherStateLabel(project, config.id as WeatherState)} · ${config.enabled ? t(project.locale, "weatherAdvanced.enabled") : t(project.locale, "weatherAdvanced.disabled")}`} storageKey={`calendar-obr.settings.weatherAdvanced.state.${config.id}`}>
      <div style={cardStyle}>
        <div style={metaStyle}>{config.custom ? t(project.locale, "weatherAdvanced.custom") : t(project.locale, "weatherAdvanced.builtin")} · {config.id}</div>
        <label><input type="checkbox" checked={config.enabled} onChange={(event) => patch({ enabled: event.target.checked })} /> {t(project.locale, "weatherAdvanced.enabled")}</label>
        <div style={rowStyle}>
          <label><div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.icon")}</div><input value={config.icon ?? ""} onChange={(event) => patch({ icon: event.target.value })} style={inputStyle} /></label>
          <label><div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.priority")}</div><input type="number" value={config.priority ?? 0} onChange={(event) => patch({ priority: Number(event.target.value) })} style={inputStyle} /></label>
          <label><div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.labelFr")}</div><input value={config.label?.fr ?? ""} onChange={(event) => patch({ label: textPatch(config.label, "fr", event.target.value) })} style={inputStyle} /></label>
          <label><div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.labelEn")}</div><input value={config.label?.en ?? ""} onChange={(event) => patch({ label: textPatch(config.label, "en", event.target.value) })} style={inputStyle} /></label>
        </div>
        <div style={{ fontWeight: 700, fontSize: 12 }}>{t(project.locale, "weatherAdvanced.thresholds")}</div>
        <ThresholdGrid project={project} thresholds={config.thresholds ?? {}} onChange={(thresholds) => patch({ thresholds })} inputStyle={inputStyle} />
        <button type="button" onClick={reset} style={buttonStyle}>{t(project.locale, "weatherAdvanced.resetDefaults")}</button>
      </div>
    </CollapsibleSection>
  );
};

const TrendConfigCard = ({ project, config, inputStyle, onProjectUpdate }: { project: CalendarProject; config: WeatherTrendConfig; inputStyle: CSSProperties; onProjectUpdate: (project: CalendarProject) => void }) => {
  const patch = (next: Partial<WeatherTrendConfig>) => onProjectUpdate(patchAdvancedSettings(project, { trendConfigs: { [config.id]: { ...config, ...next } } }));
  const reset = () => onProjectUpdate(patchAdvancedSettings(project, { trendConfigs: { [config.id]: DEFAULT_WEATHER_TREND_CONFIGS[config.id as WeatherTrendKind] ?? { id: config.id, enabled: true } } }));
  return <div style={cardStyle}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong>{config.icon ?? "•"} {getWeatherTrendLabel(project, config.id as WeatherTrendKind)}</strong><span style={metaStyle}>{config.id}</span></div>
    <label><input type="checkbox" checked={config.enabled} onChange={(event) => patch({ enabled: event.target.checked })} /> {t(project.locale, "weatherAdvanced.enabled")}</label>
    <div style={rowStyle}>
      <label><div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.icon")}</div><input value={config.icon ?? ""} onChange={(event) => patch({ icon: event.target.value })} style={inputStyle} /></label>
      <label><div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.labelFr")}</div><input value={config.label?.fr ?? ""} onChange={(event) => patch({ label: textPatch(config.label, "fr", event.target.value) })} style={inputStyle} /></label>
      <ThresholdInput label={t(project.locale, "weatherAdvanced.temperatureOffset")} value={config.temperatureOffset} onChange={(value) => patch({ temperatureOffset: value })} inputStyle={inputStyle} />
      <ThresholdInput label={t(project.locale, "weatherAdvanced.rainMultiplier")} value={config.rainMultiplier} onChange={(value) => patch({ rainMultiplier: value })} inputStyle={inputStyle} />
      <ThresholdInput label={t(project.locale, "weatherAdvanced.windMultiplier")} value={config.windMultiplier} onChange={(value) => patch({ windMultiplier: value })} inputStyle={inputStyle} />
      <ThresholdInput label={t(project.locale, "weatherAdvanced.stabilityModifier")} value={config.stabilityModifier} onChange={(value) => patch({ stabilityModifier: value })} inputStyle={inputStyle} />
      <ThresholdInput label={t(project.locale, "weatherAdvanced.stormChanceModifier")} value={config.stormChanceModifier} onChange={(value) => patch({ stormChanceModifier: value })} inputStyle={inputStyle} />
    </div>
    <button type="button" onClick={reset} style={buttonStyle}>{t(project.locale, "weatherAdvanced.resetDefaults")}</button>
  </div>;
};

const DominanceConfigCard = ({ project, config, inputStyle, onProjectUpdate }: { project: CalendarProject; config: WeatherDominanceConfig; inputStyle: CSSProperties; onProjectUpdate: (project: CalendarProject) => void }) => {
  const patch = (next: Partial<WeatherDominanceConfig>) => onProjectUpdate(patchAdvancedSettings(project, { dominanceConfigs: { [config.id]: { ...config, ...next } } }));
  const reset = () => onProjectUpdate(patchAdvancedSettings(project, { dominanceConfigs: { [config.id]: DEFAULT_WEATHER_DOMINANCE_CONFIGS[config.id] ?? { id: config.id, enabled: true, stateId: config.stateId } } }));
  return <div style={cardStyle}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong>{config.stateId}</strong><span style={metaStyle}>{config.id}</span></div>
    <label><input type="checkbox" checked={config.enabled} onChange={(event) => patch({ enabled: event.target.checked })} /> {t(project.locale, "weatherAdvanced.enabled")}</label>
    <div style={rowStyle}>
      <label><div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.state")}</div><select value={config.stateId} onChange={(event) => patch({ stateId: event.target.value })} style={inputStyle}>{WEATHER_STATES.map((state) => <option key={state} value={state}>{getWeatherStateLabel(project, state)}</option>)}</select></label>
      <ThresholdInput label={t(project.locale, "weatherAdvanced.priority")} value={config.priority} onChange={(value) => patch({ priority: value })} inputStyle={inputStyle} />
    </div>
    <div style={{ fontWeight: 700, fontSize: 12 }}>{t(project.locale, "weatherAdvanced.thresholds")}</div>
    <ThresholdGrid project={project} thresholds={config.thresholds ?? {}} onChange={(thresholds) => patch({ thresholds })} inputStyle={inputStyle} includeChances />
    <button type="button" onClick={reset} style={buttonStyle}>{t(project.locale, "weatherAdvanced.resetDefaults")}</button>
  </div>;
};

export const WeatherAdvancedConfigSection = ({ project, onProjectUpdate, inputStyle }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; inputStyle: CSSProperties }) => {
  const settings = getWeatherAdvancedSettings(project);
  return <div>
    <div style={helpStyle}>{t(project.locale, "settings.weatherAdvancedConfigHelp")}</div>
    <CollapsibleSection title={t(project.locale, "settings.weatherStates")} storageKey="calendar-obr.settings.weatherAdvanced.states">
      <div style={{ display: "grid", gap: 8 }}>{WEATHER_STATES.map((state) => <StateConfigCard key={state} project={project} config={settings.stateConfigs[state]} inputStyle={inputStyle} onProjectUpdate={onProjectUpdate} />)}</div>
    </CollapsibleSection>
    <CollapsibleSection title={t(project.locale, "settings.weatherTrends")} storageKey="calendar-obr.settings.weatherAdvanced.trends">
      <div style={{ display: "grid", gap: 8 }}>{WEATHER_TRENDS.map((trend) => <TrendConfigCard key={trend} project={project} config={settings.trendConfigs[trend]} inputStyle={inputStyle} onProjectUpdate={onProjectUpdate} />)}</div>
    </CollapsibleSection>
    <CollapsibleSection title={t(project.locale, "settings.weatherDominanceRules")} storageKey="calendar-obr.settings.weatherAdvanced.dominance">
      <div style={{ display: "grid", gap: 8 }}>{Object.values(settings.dominanceConfigs).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)).map((rule) => <DominanceConfigCard key={rule.id} project={project} config={rule} inputStyle={inputStyle} onProjectUpdate={onProjectUpdate} />)}</div>
    </CollapsibleSection>
  </div>;
};
