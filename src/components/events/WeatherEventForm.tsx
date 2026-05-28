import { useEffect, useState } from "react";
import { parseWeatherInput } from "../../calendar/seasonsLogic";
import type { CalendarProject, MoonPhaseId, WeatherCondition, WeatherConditionMetric, WeatherConditionOperator, WeatherEvent, WeatherState, WindDirection } from "../../domain/types";
import { t } from "../../i18n/messages";

const weatherStates: WeatherState[] = ["clear", "cloudy", "overcast", "fog", "lightRain", "heavyRain", "storm", "snow", "strongWind", "tempest"];
const moonPhases: MoonPhaseId[] = ["new", "waxingCrescent", "firstQuarter", "waxingGibbous", "full", "waningGibbous", "lastQuarter", "waningCrescent"];
const windDirections: WindDirection[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const metricLabel = (locale: CalendarProject["locale"], metric: WeatherConditionMetric): string => {
  if (metric === "temperature") return t(locale, "weatherEvents.metricTemperature");
  if (metric === "windSpeed") return t(locale, "weatherEvents.metricWindSpeed");
  if (metric === "dailyMinTemperature") return t(locale, "weatherEvents.metricDailyMinTemperature");
  if (metric === "dailyMaxTemperature") return t(locale, "weatherEvents.metricDailyMaxTemperature");
  if (metric === "dailyRainTotal") return t(locale, "weatherEvents.metricDailyRainTotal");
  return t(locale, "weatherEvents.metricRain");
};

export const conditionSummary = (project: CalendarProject, condition: WeatherCondition): string => {
  const locale = project.locale;
  if (condition.type === "state") return `${t(locale, "weatherEvents.state")} = ${t(locale, `weather.state.${condition.state}`)}`;
  if (condition.type === "dominantState") return `${t(locale, "weatherEvents.dominantState")} = ${t(locale, `weather.state.${condition.state}`)}`;
  if (condition.type === "windDirection") return `${t(locale, "weatherEvents.windDirection")} = ${condition.direction}`;
  if (condition.type === "season") {
    const seasonName = project.seasons.find((s) => s.id === condition.seasonId)?.name ?? condition.seasonId;
    return `${t(locale, "weatherEvents.season")} = ${seasonName}`;
  }
  if (condition.type === "timeOfDay") return `${t(locale, "weatherEvents.timeOfDay")} ${condition.startHour}→${condition.endHour}`;
  if (condition.type === "moonPhase") {
    const moonName = project.moons.find((m) => m.id === condition.moonId)?.name ?? condition.moonId;
    return `${t(locale, "weatherEvents.moon")}=${moonName} · ${t(locale, `moon.phase.${condition.phaseId}`)}`;
  }
  return `${metricLabel(locale, condition.metric)} ${condition.operator === "gte" ? ">=" : "<="} ${condition.value}`;
};

export const WeatherEventForm = ({ project, event, mode, onSubmit, onCancel, inputStyle }: { project: CalendarProject; event: WeatherEvent; mode: "create" | "edit"; onSubmit: (event: WeatherEvent) => void; onCancel: () => void; inputStyle?: React.CSSProperties }) => {
  const [draft, setDraft] = useState<WeatherEvent>(event);
  useEffect(() => setDraft(event), [event]);
  const mergedInputStyle = inputStyle ?? defaultInputStyle;
  const updateDraft = (patch: Partial<WeatherEvent>) => setDraft((prev) => ({ ...prev, ...patch }));
  const updateDraftCondition = (index: number, condition: WeatherCondition) => setDraft((prev) => ({ ...prev, conditions: (prev.conditions ?? []).map((c, i) => (i === index ? condition : c)) }));
  const deleteDraftCondition = (index: number) => setDraft((prev) => ({ ...prev, conditions: (prev.conditions ?? []).filter((_, i) => i !== index) }));
  const addDraftCondition = (condition: WeatherCondition) => setDraft((prev) => ({ ...prev, conditions: [...(prev.conditions ?? []), condition] }));

  return <div>
    <label style={{ display: "block" }}><div style={labelStyle}>{t(project.locale, "weatherEvents.name")}</div><input value={draft.name} onChange={(e) => updateDraft({ name: e.target.value })} style={mergedInputStyle} /></label>
    <label style={{ display: "block" }}><div style={labelStyle}>{t(project.locale, "weatherEvents.icon")}</div><input value={draft.icon ?? ""} onChange={(e) => updateDraft({ icon: e.target.value })} style={mergedInputStyle} /></label>
    <label style={{ display: "block" }}><div style={labelStyle}>{t(project.locale, "weatherEvents.summary")}</div><input value={draft.summary ?? ""} onChange={(e) => updateDraft({ summary: e.target.value })} style={mergedInputStyle} /></label>
    <label style={{ display: "block" }}><div style={labelStyle}>{t(project.locale, "weatherEvents.link")}</div><input value={draft.link ?? ""} onChange={(e) => updateDraft({ link: e.target.value })} style={mergedInputStyle} /></label>
    <label style={{ display: "block" }}><div style={labelStyle}>{t(project.locale, "weatherEvents.gmDescription")}</div><textarea value={draft.gmDescription ?? ""} onChange={(e) => updateDraft({ gmDescription: e.target.value })} style={{ ...mergedInputStyle, minHeight: 56 }} /></label>
    <label style={{ display: "block" }}><div style={labelStyle}>{t(project.locale, "weatherEvents.playerDescription")}</div><textarea value={draft.playerDescription ?? ""} onChange={(e) => updateDraft({ playerDescription: e.target.value })} style={{ ...mergedInputStyle, minHeight: 56 }} /></label>
    <label style={{ display: "block" }}><div style={labelStyle}>{t(project.locale, "weatherEvents.visibility")}</div><select value={draft.visibility ?? "gm"} onChange={(e) => updateDraft({ visibility: e.target.value as "gm" | "players" | "revealOnTrigger" })} style={mergedInputStyle}><option value="gm">{t(project.locale, "weatherEvents.visibilityGm")}</option><option value="players">{t(project.locale, "weatherEvents.visibilityPlayers")}</option><option value="revealOnTrigger">{t(project.locale, "weatherEvents.visibilityRevealOnTrigger")}</option></select></label>
    <label style={checkLabel}><input type="checkbox" checked={draft.notifyOnTrigger !== false} onChange={(e) => updateDraft({ notifyOnTrigger: e.target.checked })} />{t(project.locale, "weatherEvents.notifyOnTrigger")}</label>
    <label style={{ display: "block" }}><div style={labelStyle}>{t(project.locale, "weatherEvents.status")}</div><select value={draft.status ?? "active"} onChange={(e) => updateDraft({ status: e.target.value as WeatherEvent["status"] })} style={mergedInputStyle}><option value="active">{t(project.locale, "weatherEvents.statusActive")}</option><option value="triggered">{t(project.locale, "weatherEvents.statusTriggered")}</option><option value="archived">{t(project.locale, "weatherEvents.statusArchived")}</option><option value="disabled">{t(project.locale, "weatherEvents.statusDisabled")}</option></select></label>
    <label style={checkLabel}><input type="checkbox" checked={draft.archiveAfterTrigger === true} onChange={(e) => updateDraft({ archiveAfterTrigger: e.target.checked })} />{t(project.locale, "weatherEvents.archiveAfterTrigger")}</label>
    <label style={checkLabel}><input type="checkbox" checked={draft.disableAfterTrigger === true} onChange={(e) => updateDraft({ disableAfterTrigger: e.target.checked })} />{t(project.locale, "weatherEvents.disableAfterTrigger")}</label>
    <label style={{ display: "block" }}><div style={labelStyle}>{t(project.locale, "weatherEvents.durationHours")}</div><input type="number" min={0} step={1} value={draft.durationHours ?? ""} onChange={(e) => updateDraft({ durationHours: e.target.value.trim() === "" ? undefined : Math.max(0, Math.trunc(Number(e.target.value) || 0)) })} style={mergedInputStyle} /></label>
    <label style={{ display: "block" }}><div style={labelStyle}>{t(project.locale, "weatherEvents.cooldownHours")}</div><input type="number" min={0} step={1} value={draft.cooldownHours ?? ""} onChange={(e) => updateDraft({ cooldownHours: e.target.value.trim() === "" ? undefined : Math.max(0, Math.trunc(Number(e.target.value) || 0)) })} style={mergedInputStyle} /></label>
    <label style={checkLabel}><input type="checkbox" checked={draft.enabled !== false} onChange={(e) => updateDraft({ enabled: e.target.checked })} />{t(project.locale, "weatherEvents.enabled")}</label>
    <label style={{ display: "block" }}><div style={labelStyle}>{t(project.locale, "weatherEvents.conditions")}</div><select value={draft.requireAllConditions ?? true ? "all" : "any"} onChange={(e) => updateDraft({ requireAllConditions: e.target.value === "all" })} style={mergedInputStyle}><option value="all">{t(project.locale, "weatherEvents.requireAll")}</option><option value="any">{t(project.locale, "weatherEvents.requireAny")}</option></select></label>

    {(draft.conditions ?? []).map((condition, index) => <div key={index} style={condCard}>
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{conditionSummary(project, condition)}</div>
      <select value={condition.type === undefined || condition.type === "metric" ? "metric" : condition.type} onChange={(e) => updateDraftCondition(index, e.target.value === "state" ? { type: "state", state: "storm" } : e.target.value === "dominantState" ? { type: "dominantState", state: "heavyRain" } : e.target.value === "windDirection" ? { type: "windDirection", direction: "N" } : e.target.value === "season" ? { type: "season", seasonId: project.seasons[0]?.id ?? "" } : e.target.value === "timeOfDay" ? { type: "timeOfDay", startHour: 22, endHour: 6 } : e.target.value === "moonPhase" ? { type: "moonPhase", moonId: project.moons[0]?.id ?? "", phaseId: "full" } : { type: "metric", metric: "temperature", operator: "gte", value: 35 })} style={mergedInputStyle}><option value="metric">{t(project.locale, "weatherEvents.conditionTypeMetric")}</option><option value="state">{t(project.locale, "weatherEvents.conditionTypeState")}</option><option value="dominantState">{t(project.locale, "weatherEvents.conditionDominantState")}</option><option value="windDirection">{t(project.locale, "weatherEvents.conditionWindDirection")}</option><option value="season">{t(project.locale, "weatherEvents.conditionTypeSeason")}</option><option value="timeOfDay">{t(project.locale, "weatherEvents.conditionTypeTimeOfDay")}</option><option value="moonPhase">{t(project.locale, "weatherEvents.conditionTypeMoonPhase")}</option></select>
      {condition.type === "metric" || condition.type === undefined ? <>
        <select value={condition.metric} onChange={(e) => updateDraftCondition(index, { ...condition, metric: e.target.value as WeatherConditionMetric })} style={mergedInputStyle}><option value="temperature">{t(project.locale, "weatherEvents.metricTemperature")}</option><option value="windSpeed">{t(project.locale, "weatherEvents.metricWindSpeed")}</option><option value="rain">{t(project.locale, "weatherEvents.metricRain")}</option><option value="dailyMinTemperature">{t(project.locale, "weatherEvents.metricDailyMinTemperature")}</option><option value="dailyMaxTemperature">{t(project.locale, "weatherEvents.metricDailyMaxTemperature")}</option><option value="dailyRainTotal">{t(project.locale, "weatherEvents.metricDailyRainTotal")}</option></select>
        <select value={condition.operator} onChange={(e) => updateDraftCondition(index, { ...condition, operator: e.target.value as WeatherConditionOperator })} style={mergedInputStyle}><option value="gte">{t(project.locale, "weatherEvents.operatorGte")}</option><option value="lte">{t(project.locale, "weatherEvents.operatorLte")}</option></select>
        <WeatherConditionValueInput value={condition.value} inputStyle={mergedInputStyle} onChange={(v) => updateDraftCondition(index, { ...condition, value: v })} />
      </> : null}
      {condition.type === "state" ? <select value={condition.state} onChange={(e) => updateDraftCondition(index, { ...condition, state: e.target.value as WeatherState })} style={mergedInputStyle}>{weatherStates.map((s) => <option key={s} value={s}>{t(project.locale, `weather.state.${s}`)}</option>)}</select> : null}
      {condition.type === "dominantState" ? <select value={condition.state} onChange={(e) => updateDraftCondition(index, { ...condition, state: e.target.value as WeatherState })} style={mergedInputStyle}>{weatherStates.map((s) => <option key={s} value={s}>{t(project.locale, `weather.state.${s}`)}</option>)}</select> : null}
      {condition.type === "windDirection" ? <select value={condition.direction} onChange={(e) => updateDraftCondition(index, { ...condition, direction: e.target.value as WindDirection })} style={mergedInputStyle}>{windDirections.map((d) => <option key={d} value={d}>{d}</option>)}</select> : null}
      {condition.type === "season" ? <select value={condition.seasonId} onChange={(e) => updateDraftCondition(index, { ...condition, seasonId: e.target.value })} style={mergedInputStyle}>{project.seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select> : null}
      {condition.type === "timeOfDay" ? <>
        <input type="number" min={0} max={23} value={condition.startHour} onChange={(e) => updateDraftCondition(index, { ...condition, startHour: Math.max(0, Math.min(23, Math.trunc(Number(e.target.value) || 0))) })} style={mergedInputStyle} />
        <input type="number" min={0} max={23} value={condition.endHour} onChange={(e) => updateDraftCondition(index, { ...condition, endHour: Math.max(0, Math.min(23, Math.trunc(Number(e.target.value) || 0))) })} style={mergedInputStyle} />
      </> : null}
      {condition.type === "moonPhase" ? <>
        <select value={condition.moonId} onChange={(e) => updateDraftCondition(index, { ...condition, moonId: e.target.value })} style={mergedInputStyle}>{project.moons.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        <select value={condition.phaseId} onChange={(e) => updateDraftCondition(index, { ...condition, phaseId: e.target.value as MoonPhaseId })} style={mergedInputStyle}>{moonPhases.map((p) => <option key={p} value={p}>{t(project.locale, `moon.phase.${p}`)}</option>)}</select>
      </> : null}
      <button type="button" onClick={() => deleteDraftCondition(index)} style={smallButtonStyle}>{t(project.locale, "weatherEvents.deleteCondition")}</button>
    </div>)}

    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
      <button type="button" onClick={() => addDraftCondition({ type: "metric", metric: "temperature", operator: "gte", value: 35 })} style={smallButtonStyle}>{t(project.locale, "weatherEvents.addCondition")}</button>
      <button type="button" onClick={() => addDraftCondition({ type: "state", state: "storm" })} style={smallButtonStyle}>{t(project.locale, "weatherEvents.addStateCondition")}</button>
      <button type="button" onClick={() => addDraftCondition({ type: "dominantState", state: "heavyRain" })} style={smallButtonStyle}>{t(project.locale, "weatherEvents.conditionDominantState")}</button>
      <button type="button" onClick={() => addDraftCondition({ type: "windDirection", direction: "N" })} style={smallButtonStyle}>{t(project.locale, "weatherEvents.conditionWindDirection")}</button>
      <button type="button" onClick={() => addDraftCondition({ type: "season", seasonId: project.seasons[0]?.id ?? "" })} style={smallButtonStyle}>{t(project.locale, "weatherEvents.addSeasonCondition")}</button>
      <button type="button" onClick={() => addDraftCondition({ type: "timeOfDay", startHour: 22, endHour: 6 })} style={smallButtonStyle}>{t(project.locale, "weatherEvents.addTimeOfDayCondition")}</button>
      <button type="button" onClick={() => addDraftCondition({ type: "moonPhase", moonId: project.moons[0]?.id ?? "", phaseId: "full" })} style={smallButtonStyle}>{t(project.locale, "weatherEvents.addMoonPhaseCondition")}</button>
    </div>

    <div style={{ display: "flex", gap: 6 }}><button type="button" onClick={onCancel} style={buttonStyle}>{t(project.locale, "events.cancel")}</button><button type="button" onClick={() => onSubmit(draft)} style={buttonStyle}>{mode === "create" ? t(project.locale, "weatherEvents.create") : t(project.locale, "events.update")}</button></div>
  </div>;
};

const WeatherConditionValueInput = ({ value, inputStyle, onChange }: { value: number; inputStyle: React.CSSProperties; onChange: (value: number) => void; }) => {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return <input type="text" inputMode="decimal" value={draft} onChange={(e) => { const v = e.target.value; setDraft(v); const parsed = parseWeatherInput(v); if (parsed !== null) onChange(parsed); }} style={inputStyle} />;
};

const labelStyle = { fontSize: 12, color: "#cbd5e1" };
const defaultInputStyle = { width: "100%", background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 6, padding: "6px 8px", fontSize: 12, boxSizing: "border-box" as const, marginBottom: 8 };
const buttonStyle = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "6px 10px", cursor: "pointer" };
const smallButtonStyle = { ...buttonStyle, fontSize: 12, padding: "5px 8px" };
const condCard = { border: "1px dashed #374151", borderRadius: 6, padding: 6, marginBottom: 6 };
const checkLabel = { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 };
