import type { CSSProperties } from "react";
import { DEFAULT_WEATHER_DOMINANCE_CONFIGS, WEATHER_TRENDS, getWeatherAdvancedSettings, getWeatherStateLabel, getWeatherTrendLabel, sanitizeWeatherAdvancedSettings } from "../../calendar/weatherAdvancedSettings";
import { fromDisplayRain, fromDisplayTemperature, fromDisplayTemperatureDelta, fromDisplayWindSpeed, toDisplayRain, toDisplayTemperature, toDisplayTemperatureDelta, toDisplayWindSpeed } from "../../calendar/weatherUnits";
import { WEATHER_STATES } from "../../calendar/weatherStates";
import type { CalendarProject, LocaleCode, WeatherAdvancedSettings, WeatherAdvancedThresholds, WeatherDominanceConfig, WeatherState, WeatherStateConfig, WeatherTrendConfig, WeatherTrendKind } from "../../domain/types";
import { t } from "../../i18n/messages";
import { CollapsibleSection } from "../CollapsibleSection";

const cardStyle: CSSProperties = { border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827", display: "grid", gap: 6 };
const rowStyle: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 };
const trendIdentityRowStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6 };
const helpStyle: CSSProperties = { fontSize: 12, color: "#9ca3af", marginBottom: 8 };
const metaStyle: CSSProperties = { fontSize: 11, color: "#94a3b8" };
const buttonStyle: CSSProperties = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "5px 8px", fontSize: 12, cursor: "pointer" };

const dangerButtonStyle: CSSProperties = { ...buttonStyle, borderColor: "#7f1d1d", color: "#fecaca" };
const toolbarStyle: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 8 };
const badgeStyle: CSSProperties = { border: "1px solid #374151", borderRadius: 999, padding: "1px 6px", fontSize: 10, color: "#cbd5e1", whiteSpace: "nowrap" };

const applyAdvancedSettings = (project: CalendarProject, settings?: WeatherAdvancedSettings): CalendarProject => ({
  ...project,
  weatherAdvancedSettings: sanitizeWeatherAdvancedSettings(settings)
});

const patchAdvancedSettings = (project: CalendarProject, patch: WeatherAdvancedSettings): CalendarProject => applyAdvancedSettings(project, {
  ...(project.weatherAdvancedSettings ?? {}),
  ...patch,
  stateConfigs: { ...(project.weatherAdvancedSettings?.stateConfigs ?? {}), ...(patch.stateConfigs ?? {}) },
  trendConfigs: { ...(project.weatherAdvancedSettings?.trendConfigs ?? {}), ...(patch.trendConfigs ?? {}) },
  dominanceConfigs: { ...(project.weatherAdvancedSettings?.dominanceConfigs ?? {}), ...(patch.dominanceConfigs ?? {}) }
});

const removeConfigEntry = (project: CalendarProject, section: keyof WeatherAdvancedSettings, id: string): CalendarProject => {
  const nextSection = { ...((project.weatherAdvancedSettings?.[section] as Record<string, unknown> | undefined) ?? {}) };
  delete nextSection[id];
  return applyAdvancedSettings(project, { ...(project.weatherAdvancedSettings ?? {}), [section]: nextSection });
};

const resetBuiltinEntries = (project: CalendarProject, section: keyof WeatherAdvancedSettings, ids: readonly string[]): CalendarProject => {
  const nextSection = { ...((project.weatherAdvancedSettings?.[section] as Record<string, unknown> | undefined) ?? {}) };
  for (const id of ids) delete nextSection[id];
  return applyAdvancedSettings(project, { ...(project.weatherAdvancedSettings ?? {}), [section]: nextSection });
};

const textPatch = (label: Partial<Record<LocaleCode, string>> | undefined, locale: LocaleCode, value: string) => ({ ...(label ?? {}), [locale]: value });
const numberOrUndefined = (value: string) => value === "" ? undefined : Number(value);

const ThresholdInput = ({ label, value, onChange, inputStyle, toDisplay = (next: number) => next, fromDisplay = (next: number) => next }: { label: string; value: number | undefined; onChange: (value: number | undefined) => void; inputStyle: CSSProperties; toDisplay?: (value: number) => number; fromDisplay?: (value: number) => number }) => (
  <label style={{ display: "block" }}>
    <div style={{ fontSize: 11 }}>{label}</div>
    <input type="number" value={value === undefined ? "" : Math.round(toDisplay(value) * 100) / 100} onChange={(event) => { const next = numberOrUndefined(event.target.value); onChange(next === undefined ? undefined : fromDisplay(next)); }} style={inputStyle} />
  </label>
);

const ThresholdGrid = ({ project, thresholds, onChange, inputStyle, includeChances = false }: { project: CalendarProject; thresholds: WeatherAdvancedThresholds; onChange: (thresholds: WeatherAdvancedThresholds) => void; inputStyle: CSSProperties; includeChances?: boolean }) => {
  const displayTemperature = (value: number) => toDisplayTemperature(value, project.units.temperature);
  const storeTemperature = (value: number) => fromDisplayTemperature(value, project.units.temperature);
  const displayWind = (value: number) => toDisplayWindSpeed(value, project.units.windSpeed);
  const storeWind = (value: number) => fromDisplayWindSpeed(value, project.units.windSpeed);
  const displayRain = (value: number) => toDisplayRain(value, project.units.rain);
  const storeRain = (value: number) => fromDisplayRain(value, project.units.rain);
  return (
  <div style={rowStyle}>
    <ThresholdInput label={t(project.locale, "weatherAdvanced.minTemperature")} value={thresholds.minTemperature} onChange={(value) => onChange({ ...thresholds, minTemperature: value })} inputStyle={inputStyle} toDisplay={displayTemperature} fromDisplay={storeTemperature} />
    <ThresholdInput label={t(project.locale, "weatherAdvanced.maxTemperature")} value={thresholds.maxTemperature} onChange={(value) => onChange({ ...thresholds, maxTemperature: value })} inputStyle={inputStyle} toDisplay={displayTemperature} fromDisplay={storeTemperature} />
    <ThresholdInput label={t(project.locale, "weatherAdvanced.minWindSpeed")} value={thresholds.minWindSpeed} onChange={(value) => onChange({ ...thresholds, minWindSpeed: value })} inputStyle={inputStyle} toDisplay={displayWind} fromDisplay={storeWind} />
    <ThresholdInput label={t(project.locale, "weatherAdvanced.maxWindSpeed")} value={thresholds.maxWindSpeed} onChange={(value) => onChange({ ...thresholds, maxWindSpeed: value })} inputStyle={inputStyle} toDisplay={displayWind} fromDisplay={storeWind} />
    <ThresholdInput label={t(project.locale, includeChances ? "weatherAdvanced.minDailyRainTotal" : "weatherAdvanced.minRain")} value={thresholds.minRain ?? thresholds.minDailyRainTotal} onChange={(value) => onChange({ ...thresholds, minRain: includeChances ? thresholds.minRain : value, minDailyRainTotal: includeChances ? value : thresholds.minDailyRainTotal })} inputStyle={inputStyle} toDisplay={displayRain} fromDisplay={storeRain} />
    <ThresholdInput label={t(project.locale, includeChances ? "weatherAdvanced.maxDailyRainTotal" : "weatherAdvanced.maxRain")} value={thresholds.maxRain ?? thresholds.maxDailyRainTotal} onChange={(value) => onChange({ ...thresholds, maxRain: includeChances ? thresholds.maxRain : value, maxDailyRainTotal: includeChances ? value : thresholds.maxDailyRainTotal })} inputStyle={inputStyle} toDisplay={displayRain} fromDisplay={storeRain} />
    {includeChances ? <>
      <ThresholdInput label={t(project.locale, "weatherAdvanced.minPrecipitationChance")} value={thresholds.minPrecipitationChance} onChange={(value) => onChange({ ...thresholds, minPrecipitationChance: value })} inputStyle={inputStyle} />
      <ThresholdInput label={t(project.locale, "weatherAdvanced.minStormChance")} value={thresholds.minStormChance} onChange={(value) => onChange({ ...thresholds, minStormChance: value })} inputStyle={inputStyle} />
      <ThresholdInput label={t(project.locale, "weatherAdvanced.minFogChance")} value={thresholds.minFogChance} onChange={(value) => onChange({ ...thresholds, minFogChance: value })} inputStyle={inputStyle} />
    </> : null}
  </div>
  );
};

const StatusBadges = ({ project, custom, enabled }: { project: CalendarProject; custom?: boolean; enabled: boolean }) => <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
  <span style={badgeStyle}>{custom ? t(project.locale, "weatherAdvanced.custom") : t(project.locale, "weatherAdvanced.builtin")}</span>
  <span style={{ ...badgeStyle, color: enabled ? "#bbf7d0" : "#fecaca", borderColor: enabled ? "#166534" : "#7f1d1d" }}>{enabled ? t(project.locale, "weatherAdvanced.enabled") : t(project.locale, "weatherAdvanced.disabled")}</span>
</span>;

const weatherFrProject = (project: CalendarProject): CalendarProject => ({ ...project, locale: "fr" });

const StateConfigCard = ({ project, config, inputStyle, onProjectUpdate }: { project: CalendarProject; config: WeatherStateConfig; inputStyle: CSSProperties; onProjectUpdate: (project: CalendarProject) => void }) => {
  const patch = (next: Partial<WeatherStateConfig>) => onProjectUpdate(patchAdvancedSettings(project, { stateConfigs: { [config.id]: { ...config, ...next } } }));
  const reset = () => onProjectUpdate(removeConfigEntry(project, "stateConfigs", config.id));
  return (
    <CollapsibleSection title={`${config.icon ?? "•"} ${getWeatherStateLabel(project, config.id as WeatherState)} · ${config.enabled ? t(project.locale, "weatherAdvanced.enabled") : t(project.locale, "weatherAdvanced.disabled")}`} storageKey={`calendar-obr.settings.weatherAdvanced.state.${config.id}`}>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span style={metaStyle}>{config.id}</span><StatusBadges project={project} custom={false} enabled={config.enabled} /></div>
        <div style={metaStyle}>{t(project.locale, "weatherAdvanced.thresholdsHelp")}</div>
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
  const reset = () => onProjectUpdate(removeConfigEntry(project, "trendConfigs", config.id));
  const statusLabel = config.enabled ? t(project.locale, "weatherAdvanced.enabled") : t(project.locale, "weatherAdvanced.disabled");
  const title = `${config.icon ?? "•"} ${getWeatherTrendLabel(weatherFrProject(project), config.id as WeatherTrendKind)} · ${statusLabel}`;
  return (
    <CollapsibleSection title={title} storageKey={`calendar-obr.settings.weatherAdvanced.trend.${config.id}`}>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span style={metaStyle}>{config.id}</span><StatusBadges project={project} custom={false} enabled={config.enabled} /></div>
        <label><input type="checkbox" checked={config.enabled} onChange={(event) => patch({ enabled: event.target.checked })} /> {t(project.locale, "weatherAdvanced.enabled")}</label>
        <div style={trendIdentityRowStyle}>
          <label>
            <div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.icon")}</div>
            <input value={config.icon ?? ""} onChange={(event) => patch({ icon: event.target.value })} style={inputStyle} />
          </label>
          <label>
            <div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.labelFr")}</div>
            <input value={config.label?.fr ?? ""} onChange={(event) => patch({ label: textPatch(config.label, "fr", event.target.value) })} style={inputStyle} />
          </label>
          <label>
            <div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.labelEn")}</div>
            <input value={config.label?.en ?? ""} onChange={(event) => patch({ label: textPatch(config.label, "en", event.target.value) })} style={inputStyle} />
          </label>
        </div>
        <div style={rowStyle}>
          <ThresholdInput label={t(project.locale, "weatherAdvanced.temperatureOffset")} value={config.temperatureOffset} onChange={(value) => patch({ temperatureOffset: value })} inputStyle={inputStyle} toDisplay={(value) => toDisplayTemperatureDelta(value, project.units.temperature)} fromDisplay={(value) => fromDisplayTemperatureDelta(value, project.units.temperature)} />
          <ThresholdInput label={t(project.locale, "weatherAdvanced.rainMultiplier")} value={config.rainMultiplier} onChange={(value) => patch({ rainMultiplier: value })} inputStyle={inputStyle} />
          <ThresholdInput label={t(project.locale, "weatherAdvanced.windMultiplier")} value={config.windMultiplier} onChange={(value) => patch({ windMultiplier: value })} inputStyle={inputStyle} />
          <ThresholdInput label={t(project.locale, "weatherAdvanced.stabilityModifier")} value={config.stabilityModifier} onChange={(value) => patch({ stabilityModifier: value })} inputStyle={inputStyle} />
          <ThresholdInput label={t(project.locale, "weatherAdvanced.stormChanceModifier")} value={config.stormChanceModifier} onChange={(value) => patch({ stormChanceModifier: value })} inputStyle={inputStyle} />
        </div>
        <button type="button" onClick={reset} style={buttonStyle}>{t(project.locale, "weatherAdvanced.resetDefaults")}</button>
      </div>
    </CollapsibleSection>
  );
};

const DominanceConfigCard = ({ project, config, inputStyle, onProjectUpdate }: { project: CalendarProject; config: WeatherDominanceConfig; inputStyle: CSSProperties; onProjectUpdate: (project: CalendarProject) => void }) => {
  const settings = getWeatherAdvancedSettings(project);
  const isCustom = config.custom === true || !DEFAULT_WEATHER_DOMINANCE_CONFIGS[config.id];
  const patch = (next: Partial<WeatherDominanceConfig>) => onProjectUpdate(patchAdvancedSettings(project, { dominanceConfigs: { [config.id]: { ...config, ...next, custom: isCustom } } }));
  const reset = () => onProjectUpdate(removeConfigEntry(project, "dominanceConfigs", config.id));
  const remove = () => {
    if (typeof window !== "undefined" && !window.confirm(t(project.locale, "weatherAdvanced.confirmDeleteDominanceRule"))) return;
    onProjectUpdate(removeConfigEntry(project, "dominanceConfigs", config.id));
  };
  const stateConfig = settings.stateConfigs[config.stateId as WeatherState];
  const statusLabel = config.enabled ? t(project.locale, "weatherAdvanced.enabled") : t(project.locale, "weatherAdvanced.disabled");
  const title = `${stateConfig?.icon ?? "•"} ${getWeatherStateLabel(weatherFrProject(project), config.stateId as WeatherState)} · ${statusLabel}`;
  return (
    <CollapsibleSection title={title} storageKey={`calendar-obr.settings.weatherAdvanced.dominanceRule.${config.id}`}>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span style={metaStyle}>{config.id}</span><StatusBadges project={project} custom={isCustom} enabled={config.enabled} /></div>
        <label><input type="checkbox" checked={config.enabled} onChange={(event) => patch({ enabled: event.target.checked })} /> {t(project.locale, "weatherAdvanced.enabled")}</label>
        <div style={rowStyle}>
          <label><div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.state")}</div><select value={config.stateId} onChange={(event) => patch({ stateId: event.target.value })} style={inputStyle}>{WEATHER_STATES.map((state) => <option key={state} value={state}>{getWeatherStateLabel(project, state)}</option>)}</select></label>
          <ThresholdInput label={t(project.locale, "weatherAdvanced.priority")} value={config.priority} onChange={(value) => patch({ priority: value })} inputStyle={inputStyle} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 12 }}>{t(project.locale, "weatherAdvanced.thresholds")}</div>
        <ThresholdGrid project={project} thresholds={config.thresholds ?? {}} onChange={(thresholds) => patch({ thresholds })} inputStyle={inputStyle} includeChances />
        <div style={toolbarStyle}>
          {!isCustom ? <button type="button" onClick={reset} style={buttonStyle}>{t(project.locale, "weatherAdvanced.resetDefaults")}</button> : null}
          {isCustom ? <button type="button" onClick={remove} style={dangerButtonStyle}>{t(project.locale, "weatherAdvanced.deleteDominanceRule")}</button> : null}
        </div>
      </div>
    </CollapsibleSection>
  );
};

const addCustomDominanceRule = (project: CalendarProject): CalendarProject => {
  const id = `custom-dominance-${Date.now()}`;
  const enabledState = WEATHER_STATES.find((state) => getWeatherAdvancedSettings(project).stateConfigs[state].enabled) ?? "overcast";
  return patchAdvancedSettings(project, { dominanceConfigs: { [id]: { id, custom: true, enabled: true, stateId: enabledState, priority: 50, thresholds: {} } } });
};

export const WeatherAdvancedConfigSection = ({ project, onProjectUpdate, inputStyle }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; inputStyle: CSSProperties }) => {
  const settings = getWeatherAdvancedSettings(project);
  const resetAllStates = () => onProjectUpdate(resetBuiltinEntries(project, "stateConfigs", WEATHER_STATES));
  const resetAllTrends = () => onProjectUpdate(resetBuiltinEntries(project, "trendConfigs", WEATHER_TRENDS));
  const resetAllDominance = () => onProjectUpdate(resetBuiltinEntries(project, "dominanceConfigs", Object.keys(DEFAULT_WEATHER_DOMINANCE_CONFIGS)));
  return <div>
    <div style={helpStyle}>{t(project.locale, "settings.weatherAdvancedConfigHelp")}</div>
    <CollapsibleSection title={t(project.locale, "settings.weatherTrends")} storageKey="calendar-obr.settings.weatherAdvanced.trends">
      <div style={helpStyle}>{t(project.locale, "settings.weatherTrendsHelp")}</div>
      <div style={helpStyle}>{t(project.locale, "settings.weatherTrendsConceptHelp")}</div>
      <div style={toolbarStyle}><button type="button" onClick={resetAllTrends} style={buttonStyle}>{t(project.locale, "weatherAdvanced.resetAllTrends")}</button><span style={metaStyle}>{t(project.locale, "weatherAdvanced.builtinTrendsLocked")}</span></div>
      <div style={{ display: "grid", gap: 8 }}>{WEATHER_TRENDS.map((trend) => <TrendConfigCard key={trend} project={project} config={settings.trendConfigs[trend]} inputStyle={inputStyle} onProjectUpdate={onProjectUpdate} />)}</div>
    </CollapsibleSection>
    <CollapsibleSection title={t(project.locale, "settings.weatherDominanceRules")} storageKey="calendar-obr.settings.weatherAdvanced.dominance">
      <div style={helpStyle}>{t(project.locale, "settings.weatherDominanceHelp")}</div>
      <div style={helpStyle}>{t(project.locale, "settings.weatherDominanceConceptHelp")}</div>
      <div style={toolbarStyle}><button type="button" onClick={() => onProjectUpdate(addCustomDominanceRule(project))} style={buttonStyle}>{t(project.locale, "weatherAdvanced.addDominanceRule")}</button><button type="button" onClick={resetAllDominance} style={buttonStyle}>{t(project.locale, "weatherAdvanced.resetAllDominanceRules")}</button><span style={metaStyle}>{t(project.locale, "weatherAdvanced.customDominanceHelp")}</span></div>
      <div style={{ display: "grid", gap: 8 }}>{Object.values(settings.dominanceConfigs).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)).map((rule) => <DominanceConfigCard key={rule.id} project={project} config={rule} inputStyle={inputStyle} onProjectUpdate={onProjectUpdate} />)}</div>
    </CollapsibleSection>
    <CollapsibleSection title={t(project.locale, "settings.weatherStates")} storageKey="calendar-obr.settings.weatherAdvanced.states">
      <div style={helpStyle}>{t(project.locale, "settings.weatherStatesHelp")}</div>
      <div style={helpStyle}>{t(project.locale, "settings.weatherStatesConceptHelp")}</div>
      <div style={toolbarStyle}><button type="button" onClick={resetAllStates} style={buttonStyle}>{t(project.locale, "weatherAdvanced.resetAllStates")}</button><span style={metaStyle}>{t(project.locale, "weatherAdvanced.builtinStatesLocked")}</span></div>
      <div style={{ display: "grid", gap: 8 }}>{WEATHER_STATES.map((state) => <StateConfigCard key={state} project={project} config={settings.stateConfigs[state]} inputStyle={inputStyle} onProjectUpdate={onProjectUpdate} />)}</div>
    </CollapsibleSection>
  </div>;
};