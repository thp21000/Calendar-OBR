import type { CSSProperties } from "react";
import { DEFAULT_WEATHER_DOMINANCE_CONFIGS, WEATHER_TRENDS, getWeatherAdvancedSettings, getWeatherStateLabel, getWeatherTrendLabel, sanitizeWeatherAdvancedSettings } from "../../calendar/weatherAdvancedSettings";
import { fromDisplayRain, fromDisplayTemperature, fromDisplayTemperatureDelta, fromDisplayWindSpeed, toDisplayRain, toDisplayTemperature, toDisplayTemperatureDelta, toDisplayWindSpeed } from "../../calendar/weatherUnits";
import { WEATHER_STATES } from "../../calendar/weatherStates";
import type { CalendarProject, LocaleCode, WeatherAdvancedSettings, WeatherAdvancedThresholds, WeatherDominanceConfig, WeatherState, WeatherStateConfig, WeatherTrendConfig, WeatherTrendKind } from "../../domain/types";
import type { WeatherBiomeId } from "../../calendar/weather/biomes/types";
import { t } from "../../i18n/messages";
import { CollapsibleSection } from "../CollapsibleSection";

const cardStyle: CSSProperties = { border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827", display: "grid", gap: 6 };
const rowStyle: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 };
const trendIdentityRowStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6 };
const helpStyle: CSSProperties = { fontSize: 12, color: "#9ca3af", marginBottom: 8 };
const sectionHintStyle: CSSProperties = { ...helpStyle, border: "1px solid #374151", borderRadius: 8, padding: "7px 8px", background: "#0f172a" };
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

const localizedText = (value: Partial<Record<LocaleCode, string>> | undefined, locale: LocaleCode): string => {
  if (!value) return "";
  return value[locale] ?? value.fr ?? value.en ?? Object.values(value).find((entry): entry is string => typeof entry === "string" && entry.length > 0) ?? "";
};
const patchLocalizedText = (value: Partial<Record<LocaleCode, string>> | undefined, locale: LocaleCode, next: string) => ({ ...(value ?? {}), [locale]: next });
const numberOrUndefined = (value: string) => value === "" ? undefined : Number(value);
const formatTags = (tags: string[] | undefined) => (tags ?? []).join(", ");
const parseTags = (value: string) => value.split(",").map((tag) => tag.trim()).filter(Boolean) as WeatherBiomeId[];

const ThresholdInput = ({ label, value, onChange, inputStyle, toDisplay = (next: number) => next, fromDisplay = (next: number) => next }: { label: string; value: number | undefined; onChange: (value: number | undefined) => void; inputStyle: CSSProperties; toDisplay?: (value: number) => number; fromDisplay?: (value: number) => number }) => (
  <label style={{ display: "block" }}>
    <div style={{ fontSize: 11 }}>{label}</div>
    <input type="number" value={value === undefined ? "" : Math.round(toDisplay(value) * 100) / 100} onChange={(event) => { const next = numberOrUndefined(event.target.value); onChange(next === undefined ? undefined : fromDisplay(next)); }} style={inputStyle} />
  </label>
);

const ThresholdGrid = ({ project, thresholds, onChange, inputStyle, includeAdvanced = false }: { project: CalendarProject; thresholds: WeatherAdvancedThresholds; onChange: (thresholds: WeatherAdvancedThresholds) => void; inputStyle: CSSProperties; includeAdvanced?: boolean }) => {
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
    <ThresholdInput label={t(project.locale, "weatherAdvanced.minRain")} value={thresholds.minRain} onChange={(value) => onChange({ ...thresholds, minRain: value })} inputStyle={inputStyle} toDisplay={displayRain} fromDisplay={storeRain} />
    <ThresholdInput label={t(project.locale, "weatherAdvanced.maxRain")} value={thresholds.maxRain} onChange={(value) => onChange({ ...thresholds, maxRain: value })} inputStyle={inputStyle} toDisplay={displayRain} fromDisplay={storeRain} />
    {includeAdvanced ? <>
      <ThresholdInput label={t(project.locale, "weatherAdvanced.minDailyRainTotal")} value={thresholds.minDailyRainTotal} onChange={(value) => onChange({ ...thresholds, minDailyRainTotal: value })} inputStyle={inputStyle} toDisplay={displayRain} fromDisplay={storeRain} />
      <ThresholdInput label={t(project.locale, "weatherAdvanced.maxDailyRainTotal")} value={thresholds.maxDailyRainTotal} onChange={(value) => onChange({ ...thresholds, maxDailyRainTotal: value })} inputStyle={inputStyle} toDisplay={displayRain} fromDisplay={storeRain} />
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

const isEmptyThresholdValue = (value: unknown) => value === undefined || value === null || value === 0 || value === "";
const isEmptyThresholds = (thresholds: WeatherAdvancedThresholds | undefined) => !thresholds || Object.values(thresholds).every(isEmptyThresholdValue);
const thresholdSignature = (thresholds: WeatherAdvancedThresholds | undefined) => JSON.stringify(Object.entries(thresholds ?? {}).filter(([, value]) => !isEmptyThresholdValue(value)).sort(([left], [right]) => left.localeCompare(right)));
const splitDominanceRules = (rules: WeatherDominanceConfig[]) => {
  const sorted = [...rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  const seenSignatures = new Set<string>();
  const main: WeatherDominanceConfig[] = [];
  const technical: WeatherDominanceConfig[] = [];
  for (const rule of sorted) {
    const signature = thresholdSignature(rule.thresholds);
    const empty = isEmptyThresholds(rule.thresholds);
    if ((empty && sorted.length > 1) || seenSignatures.has(signature)) {
      technical.push(rule);
      continue;
    }
    seenSignatures.add(signature);
    main.push(rule);
  }
  return { main, technical };
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
            <div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.label")}</div>
            <input value={localizedText(config.label, project.locale)} onChange={(event) => patch({ label: patchLocalizedText(config.label, project.locale, event.target.value) })} style={inputStyle} />
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

const DominantRuleEditor = ({ project, config, inputStyle, onProjectUpdate, showStateSelect = false }: { project: CalendarProject; config: WeatherDominanceConfig; inputStyle: CSSProperties; onProjectUpdate: (project: CalendarProject) => void; showStateSelect?: boolean }) => {
  const isCustom = config.custom === true || !DEFAULT_WEATHER_DOMINANCE_CONFIGS[config.id];
  const patch = (next: Partial<WeatherDominanceConfig>) => onProjectUpdate(patchAdvancedSettings(project, { dominanceConfigs: { [config.id]: { ...config, ...next, custom: isCustom } } }));
  const reset = () => onProjectUpdate(removeConfigEntry(project, "dominanceConfigs", config.id));
  const remove = () => {
    if (typeof window !== "undefined" && !window.confirm(t(project.locale, "weatherAdvanced.confirmDeleteDominantRule"))) return;
    onProjectUpdate(removeConfigEntry(project, "dominanceConfigs", config.id));
  };
  const statusLabel = config.enabled ? t(project.locale, "weatherAdvanced.enabled") : t(project.locale, "weatherAdvanced.disabled");
  const title = `${t(project.locale, "weatherAdvanced.dominantRule")} · ${t(project.locale, "weatherAdvanced.priority")} ${config.priority ?? 0} · ${statusLabel}`;
  return (
    <CollapsibleSection title={title} storageKey={`calendar-obr.settings.weatherAdvanced.dominantRule.${config.id}`}>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span style={metaStyle}>{config.id}</span><StatusBadges project={project} custom={isCustom} enabled={config.enabled} /></div>
        <label><input type="checkbox" checked={config.enabled} onChange={(event) => patch({ enabled: event.target.checked })} /> {t(project.locale, "weatherAdvanced.enabled")}</label>
        <div style={rowStyle}>
          {showStateSelect ? <label><div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.state")}</div><select value={config.stateId} onChange={(event) => patch({ stateId: event.target.value })} style={inputStyle}>{WEATHER_STATES.map((state) => <option key={state} value={state}>{getWeatherStateLabel(project, state)}</option>)}</select></label> : null}
          <ThresholdInput label={t(project.locale, "weatherAdvanced.priority")} value={config.priority} onChange={(value) => patch({ priority: value })} inputStyle={inputStyle} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 12 }}>{t(project.locale, "weatherAdvanced.dominantRuleConditions")}</div>
        <ThresholdGrid project={project} thresholds={config.thresholds ?? {}} onChange={(thresholds) => patch({ thresholds })} inputStyle={inputStyle} includeAdvanced />
        <div style={toolbarStyle}>
          {!isCustom ? <button type="button" onClick={reset} style={buttonStyle}>{t(project.locale, "weatherAdvanced.resetDefaults")}</button> : null}
          {isCustom ? <button type="button" onClick={remove} style={dangerButtonStyle}>{t(project.locale, "weatherAdvanced.deleteDominantRule")}</button> : null}
        </div>
      </div>
    </CollapsibleSection>
  );
};

const StateConfigCard = ({ project, config, dominanceRules, inputStyle, onProjectUpdate }: { project: CalendarProject; config: WeatherStateConfig; dominanceRules: WeatherDominanceConfig[]; inputStyle: CSSProperties; onProjectUpdate: (project: CalendarProject) => void }) => {
  const patch = (next: Partial<WeatherStateConfig>) => onProjectUpdate(patchAdvancedSettings(project, { stateConfigs: { [config.id]: { ...config, ...next } } }));
  const reset = () => onProjectUpdate(removeConfigEntry(project, "stateConfigs", config.id));
  const addDominantRule = () => onProjectUpdate(addCustomDominanceRule(project, config.id));
  const statusLabel = config.enabled ? t(project.locale, "weatherAdvanced.enabled") : t(project.locale, "weatherAdvanced.disabled");
  const title = `${config.icon ?? "•"} ${getWeatherStateLabel(weatherFrProject(project), config.id as WeatherState)} · ${statusLabel}`;
  const { main: visibleDominanceRules, technical: technicalDominanceRules } = splitDominanceRules(dominanceRules);
  return (
    <CollapsibleSection title={title} storageKey={`calendar-obr.settings.weatherAdvanced.state.${config.id}`}>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span style={metaStyle}>{config.id}</span><StatusBadges project={project} custom={config.custom} enabled={config.enabled} /></div>
        <CollapsibleSection title={t(project.locale, "weatherAdvanced.stateDefinition")} storageKey={`calendar-obr.settings.weatherAdvanced.state.${config.id}.definition`}>
          <div style={cardStyle}>
            <label><input type="checkbox" checked={config.enabled} onChange={(event) => patch({ enabled: event.target.checked })} /> {t(project.locale, "weatherAdvanced.enabled")}</label>
            <div style={rowStyle}>
              <label><div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.label")}</div><input value={localizedText(config.label, project.locale)} onChange={(event) => patch({ label: patchLocalizedText(config.label, project.locale, event.target.value) })} style={inputStyle} /></label>
              <label><div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.icon")}</div><input value={config.icon ?? ""} onChange={(event) => patch({ icon: event.target.value })} style={inputStyle} /></label>
              <label><div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.priority")}</div><input type="number" value={config.priority ?? 0} onChange={(event) => patch({ priority: Number(event.target.value) })} style={inputStyle} /></label>
              <label><div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.description")}</div><input value={localizedText(config.description, project.locale)} onChange={(event) => patch({ description: patchLocalizedText(config.description, project.locale, event.target.value) })} style={inputStyle} /></label>
            </div>
            <button type="button" onClick={reset} style={buttonStyle}>{t(project.locale, "weatherAdvanced.resetDefaults")}</button>
          </div>
        </CollapsibleSection>
        <CollapsibleSection title={t(project.locale, "weatherAdvanced.immediateConditions")} storageKey={`calendar-obr.settings.weatherAdvanced.state.${config.id}.conditions`}>
          <div style={cardStyle}>
            <div style={metaStyle}>{t(project.locale, "weatherAdvanced.immediateConditionsHelp")}</div>
            <ThresholdGrid project={project} thresholds={config.thresholds ?? {}} onChange={(thresholds) => patch({ thresholds })} inputStyle={inputStyle} includeAdvanced />
            <label><div style={{ fontSize: 12 }}>{t(project.locale, "weatherAdvanced.biomeTags")}</div><input value={formatTags(config.biomeTags)} onChange={(event) => patch({ biomeTags: parseTags(event.target.value) })} style={inputStyle} /></label>
          </div>
        </CollapsibleSection>
        <CollapsibleSection title={t(project.locale, "weatherAdvanced.dominantRule")} storageKey={`calendar-obr.settings.weatherAdvanced.state.${config.id}.dominantRules`}>
          <div style={cardStyle}>
            <div style={metaStyle}>{t(project.locale, "weatherAdvanced.dominantRuleHelp")}</div>
            {visibleDominanceRules.length === 0 ? <div style={metaStyle}>{t(project.locale, "weatherAdvanced.noDominantRuleForState")}</div> : null}
            <div style={{ display: "grid", gap: 8 }}>{visibleDominanceRules.map((rule) => <DominantRuleEditor key={rule.id} project={project} config={rule} inputStyle={inputStyle} onProjectUpdate={onProjectUpdate} />)}</div>
            {technicalDominanceRules.length > 0 ? <CollapsibleSection title={t(project.locale, "weatherAdvanced.technicalOrEmptyDominantRules")} storageKey={`calendar-obr.settings.weatherAdvanced.state.${config.id}.technicalDominantRules`}>
              <div style={cardStyle}>
                <div style={metaStyle}>{t(project.locale, "weatherAdvanced.technicalOrEmptyDominantRulesHelp")}</div>
                <div style={{ display: "grid", gap: 8 }}>{technicalDominanceRules.map((rule) => <DominantRuleEditor key={rule.id} project={project} config={rule} inputStyle={inputStyle} onProjectUpdate={onProjectUpdate} />)}</div>
              </div>
            </CollapsibleSection> : null}
            <button type="button" onClick={addDominantRule} style={buttonStyle}>{t(project.locale, "weatherAdvanced.addDominantRule")}</button>
          </div>
        </CollapsibleSection>
      </div>
    </CollapsibleSection>
  );
};

const addCustomDominanceRule = (project: CalendarProject, stateId?: string): CalendarProject => {
  const id = `custom-dominance-${Date.now()}`;
  const enabledState = stateId ?? WEATHER_STATES.find((state) => getWeatherAdvancedSettings(project).stateConfigs[state].enabled) ?? "overcast";
  return patchAdvancedSettings(project, { dominanceConfigs: { [id]: { id, custom: true, enabled: true, stateId: enabledState, priority: 50, thresholds: {} } } });
};

export const WeatherAdvancedConfigSection = ({ project, onProjectUpdate, inputStyle }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; inputStyle: CSSProperties }) => {
  const settings = getWeatherAdvancedSettings(project);
  const stateConfigs = Object.values(settings.stateConfigs).sort((a, b) => {
    const indexA = WEATHER_STATES.indexOf(a.id as WeatherState);
    const indexB = WEATHER_STATES.indexOf(b.id as WeatherState);
    if (indexA !== -1 || indexB !== -1) return (indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA) - (indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB);
    return (a.priority ?? 0) - (b.priority ?? 0);
  });
  const stateIds = new Set(stateConfigs.map((state) => state.id));
  const dominanceRulesByState = Object.values(settings.dominanceConfigs).reduce<Record<string, WeatherDominanceConfig[]>>((groups, rule) => {
    if (!stateIds.has(rule.stateId)) return groups;
    groups[rule.stateId] = [...(groups[rule.stateId] ?? []), rule];
    return groups;
  }, {});
  const orphanDominanceRules = Object.values(settings.dominanceConfigs).filter((rule) => !stateIds.has(rule.stateId));
  const resetAllStates = () => onProjectUpdate(resetBuiltinEntries(project, "stateConfigs", WEATHER_STATES));
  const resetAllTrends = () => onProjectUpdate(resetBuiltinEntries(project, "trendConfigs", WEATHER_TRENDS));
  const resetAllDominance = () => onProjectUpdate(resetBuiltinEntries(project, "dominanceConfigs", Object.keys(DEFAULT_WEATHER_DOMINANCE_CONFIGS)));
  return <div>
    <div style={helpStyle}>{t(project.locale, "settings.weatherAdvancedConfigHelp")}</div>
    <CollapsibleSection title={t(project.locale, "settings.weatherStates")} storageKey="calendar-obr.settings.weatherAdvanced.states" defaultOpen>
      <div style={sectionHintStyle}>{t(project.locale, "settings.weatherStatesIntegratedHelp")}</div>
      <div style={toolbarStyle}><button type="button" onClick={resetAllStates} style={buttonStyle}>{t(project.locale, "weatherAdvanced.resetAllStates")}</button><button type="button" onClick={resetAllDominance} style={buttonStyle}>{t(project.locale, "weatherAdvanced.resetAllDominantRules")}</button><span style={metaStyle}>{t(project.locale, "weatherAdvanced.builtinStatesLocked")}</span></div>
      <div style={{ display: "grid", gap: 8 }}>{stateConfigs.map((state) => <StateConfigCard key={state.id} project={project} config={state} dominanceRules={dominanceRulesByState[state.id] ?? []} inputStyle={inputStyle} onProjectUpdate={onProjectUpdate} />)}</div>
      {orphanDominanceRules.length > 0 ? <CollapsibleSection title={t(project.locale, "weatherAdvanced.orphanDominantRules")} storageKey="calendar-obr.settings.weatherAdvanced.orphanDominanceRules">
        <div style={cardStyle}>
          <div style={metaStyle}>{t(project.locale, "weatherAdvanced.orphanDominantRulesHelp")}</div>
          <div style={{ display: "grid", gap: 8 }}>{orphanDominanceRules.map((rule) => <DominantRuleEditor key={rule.id} project={project} config={rule} inputStyle={inputStyle} onProjectUpdate={onProjectUpdate} showStateSelect />)}</div>
        </div>
      </CollapsibleSection> : null}
    </CollapsibleSection>
    <CollapsibleSection title={t(project.locale, "settings.weatherTrendsEvolution")} storageKey="calendar-obr.settings.weatherAdvanced.trends">
      <div style={helpStyle}>{t(project.locale, "settings.weatherTrendsHelp")}</div>
      <div style={sectionHintStyle}>{t(project.locale, "settings.weatherTrendsConceptHelp")}</div>
      <div style={toolbarStyle}><button type="button" onClick={resetAllTrends} style={buttonStyle}>{t(project.locale, "weatherAdvanced.resetAllTrends")}</button><span style={metaStyle}>{t(project.locale, "weatherAdvanced.builtinTrendsLocked")}</span></div>
      <div style={{ display: "grid", gap: 8 }}>{WEATHER_TRENDS.map((trend) => <TrendConfigCard key={trend} project={project} config={settings.trendConfigs[trend]} inputStyle={inputStyle} onProjectUpdate={onProjectUpdate} />)}</div>
    </CollapsibleSection>
  </div>;
};