import { useEffect, useState, type ReactNode } from "react";
import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import { parseWeatherInput } from "../../calendar/seasonsLogic";
import type { CalendarProject, MoonPhaseId, WeatherCondition, WeatherConditionMetric, WeatherConditionOperator, WeatherEvent, WeatherState, WeatherTrendKind, WindDirection } from "../../domain/types";
import { t } from "../../i18n/messages";
import { WEATHER_STATES } from "../../calendar/weatherStates";

const weatherStates = WEATHER_STATES;
const moonPhases: MoonPhaseId[] = ["new", "waxingCrescent", "firstQuarter", "waxingGibbous", "full", "waningGibbous", "lastQuarter", "waningCrescent"];
const windDirections: WindDirection[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const weatherTrends = ["cold", "warm", "wet", "dry", "windy", "calm", "stormy", "stable", "unstable"] as const;

type ConditionTypeToAdd = "metric" | "state" | "dominantState" | "windDirection" | "season" | "timeOfDay" | "moonPhase";

type WeatherEventFormSectionProps = { title: string; children: ReactNode };
const WeatherEventFormSection = ({ title, children }: WeatherEventFormSectionProps) => {
  const [open, setOpen] = useState(false);
  return <div style={sectionBoxStyle}><button type="button" onClick={() => setOpen((v) => !v)} style={sectionHeaderButtonStyle}><span>{title}</span><span>{open ? "▾" : "▸"}</span></button>{open ? <div style={sectionContentStyle}>{children}</div> : null}</div>;
};

const FieldLabel = ({ label, help }: { label: string; help?: string }) => (
  <div style={labelWithHelpStyle}>
    <span>{label}</span>
    {help ? <span style={infoIconStyle} title={help}>ⓘ</span> : null}
  </div>
);

const CollapsibleEditorBlock = ({ title, help, children }: { title: string; help?: string; children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={condCard}>
      <button type="button" onClick={() => setOpen((value) => !value)} style={collapsibleEditorHeaderStyle}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, overflowWrap: "anywhere" }}>
          <span>{title}</span>
          {help ? <span style={infoIconStyle} title={help}>ⓘ</span> : null}
        </span>
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {open ? <div style={{ display: "grid", gap: 6 }}>{children}</div> : null}
    </div>
  );
};

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
  if (condition.type === "season") return `${t(locale, "weatherEvents.season")} = ${project.seasons.find((s) => s.id === condition.seasonId)?.name ?? condition.seasonId}`;
  if (condition.type === "timeOfDay") return `${t(locale, "weatherEvents.timeOfDay")} ${condition.startHour}→${condition.endHour}`;
  if (condition.type === "moonPhase") return `${t(locale, "weatherEvents.moon")}=${project.moons.find((m) => m.id === condition.moonId)?.name ?? condition.moonId} · ${t(locale, `moon.phase.${condition.phaseId}`)}`;
  return `${metricLabel(locale, condition.metric)} ${condition.operator === "gte" ? ">=" : "<="} ${condition.value}`;
};

const formatWeatherHistoryDate = (project: CalendarProject, triggeredAtMinutes: number): string => {
  const absoluteDay = Math.floor(triggeredAtMinutes / 1440);
  const minuteOfDay = ((triggeredAtMinutes % 1440) + 1440) % 1440;
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const date = absoluteDayToCalendarDate({ absoluteDay, hour, minute }, project.calendarSystem);
  const timeLabel = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const dateLabel = `${date.weekdayName ?? ""} ${date.dayOfMonth} ${date.monthName} ${date.year}`.trim();
  return `${dateLabel} — ${timeLabel}`;
};

const getDefaultCondition = (project: CalendarProject, type: ConditionTypeToAdd): WeatherCondition => {
  if (type === "state") return { type: "state", state: "storm" };
  if (type === "dominantState") return { type: "dominantState", state: "heavyRain" };
  if (type === "windDirection") return { type: "windDirection", direction: "N" };
  if (type === "season") return { type: "season", seasonId: project.seasons[0]?.id ?? "" };
  if (type === "timeOfDay") return { type: "timeOfDay", startHour: 22, endHour: 6 };
  if (type === "moonPhase") return { type: "moonPhase", moonId: project.moons[0]?.id ?? "", phaseId: "full" };
  return { type: "metric", metric: "temperature", operator: "gte", value: 35 };
};

export const WeatherEventForm = ({ project, event, mode, onSubmit, onCancel, inputStyle }: { project: CalendarProject; event: WeatherEvent; mode: "create" | "edit"; onSubmit: (event: WeatherEvent) => void; onCancel: () => void; inputStyle?: React.CSSProperties }) => {
  const [draft, setDraft] = useState<WeatherEvent>(event);
  const [conditionTypeToAdd, setConditionTypeToAdd] = useState<ConditionTypeToAdd>("metric");
  useEffect(() => setDraft(event), [event]);
  const mergedInputStyle = inputStyle ?? defaultInputStyle;
  const updateDraft = (patch: Partial<WeatherEvent>) => setDraft((prev) => ({ ...prev, ...patch }));
  const updateDraftCondition = (index: number, condition: WeatherCondition) => setDraft((prev) => ({ ...prev, conditions: (prev.conditions ?? []).map((c, i) => (i === index ? condition : c)) }));
  const deleteDraftCondition = (index: number) => setDraft((prev) => ({ ...prev, conditions: (prev.conditions ?? []).filter((_, i) => i !== index) }));
  const addDraftCondition = (condition: WeatherCondition) => setDraft((prev) => ({ ...prev, conditions: [...(prev.conditions ?? []), condition] }));

  const conditions = draft.conditions ?? [];
  const conditionTypeOptions: Array<{ id: ConditionTypeToAdd; label: string }> = [
    { id: "metric", label: t(project.locale, "weatherEvents.conditionTypeMetric") },
    { id: "state", label: t(project.locale, "weatherEvents.conditionTypeState") },
    { id: "dominantState", label: t(project.locale, "weatherEvents.conditionDominantState") },
    { id: "windDirection", label: t(project.locale, "weatherEvents.conditionWindDirection") },
    { id: "season", label: t(project.locale, "weatherEvents.conditionTypeSeason") },
    { id: "timeOfDay", label: t(project.locale, "weatherEvents.conditionTypeTimeOfDay") },
    { id: "moonPhase", label: t(project.locale, "weatherEvents.conditionTypeMoonPhase") }
  ];

  const getWeatherEventAutoSummary = (): string => {
    const parts = [draft.name || t(project.locale, "weatherEvents.newEvent")];
    parts.push(draft.visibility === "players" ? t(project.locale, "weatherEvents.visibilityPlayers") : draft.visibility === "revealOnTrigger" ? t(project.locale, "weatherEvents.visibilityRevealOnTrigger") : t(project.locale, "weatherEvents.visibilityGm"));
    parts.push(draft.enabled !== false ? t(project.locale, "weatherEvents.enabled") : t(project.locale, "weatherEvents.disabled"));
    parts.push((draft.kind ?? "informational") === "weatherEffect" ? t(project.locale, "weatherEvents.kindWeatherEffect") : t(project.locale, "weatherEvents.kindInformational"));
    parts.push(t(project.locale, "weatherEvents.conditionsCount").replace("{count}", String(conditions.length)));
    const chance = Math.max(0, Math.min(100, Math.round(draft.triggerChancePercent ?? 100)));
    if (chance < 100) parts.push(t(project.locale, "weatherEvents.triggerChanceBadge").replace("{count}", String(chance)));
    if (typeof draft.durationHours === "number") parts.push(t(project.locale, "weatherEvents.durationBadge").replace("{count}", String(draft.durationHours)));
    if (typeof draft.cooldownHours === "number") parts.push(t(project.locale, "weatherEvents.cooldownBadge").replace("{count}", String(draft.cooldownHours)));
    return parts.join(" · ");
  };
  const showDefaultDurationHelp = draft.durationHours === undefined && ((draft.kind ?? "informational") === "weatherEffect" || Math.max(0, Math.min(100, Math.round(draft.triggerChancePercent ?? 100))) < 100);
  const hasConfiguredWeatherEffect = (Object.values(draft.effect ?? {}) as unknown[]).some((value) => value !== undefined && value !== null && value !== "");

  return <div>
    <div style={autoSummaryBoxStyle}><div style={{ fontWeight: 700, marginBottom: 4 }}>{t(project.locale, "weatherEvents.autoSummary")}</div><div>{getWeatherEventAutoSummary()}</div></div>

    <WeatherEventFormSection title={t(project.locale, "weatherEvents.sectionGeneral")}>
      <label style={field}><div style={labelStyle}>{t(project.locale, "weatherEvents.kind")}</div><select value={draft.kind ?? "informational"} onChange={(e) => updateDraft({ kind: e.target.value as WeatherEvent["kind"] })} style={mergedInputStyle}><option value="informational">{t(project.locale, "weatherEvents.kindInformational")}</option><option value="weatherEffect">{t(project.locale, "weatherEvents.kindWeatherEffect")}</option></select></label>
      <label style={field}><div style={labelStyle}>{t(project.locale, "weatherEvents.name")}</div><input value={draft.name} onChange={(e) => updateDraft({ name: e.target.value })} style={mergedInputStyle} /></label>
      <label style={field}><div style={labelStyle}>{t(project.locale, "weatherEvents.icon")}</div><input value={draft.icon ?? ""} onChange={(e) => updateDraft({ icon: e.target.value })} style={mergedInputStyle} /></label>
      <label style={field}><div style={labelStyle}>{t(project.locale, "weatherEvents.summary")}</div><input value={draft.summary ?? ""} onChange={(e) => updateDraft({ summary: e.target.value })} style={mergedInputStyle} /></label>
      <label style={field}><div style={labelStyle}>{t(project.locale, "weatherEvents.link")}</div><input value={draft.link ?? ""} onChange={(e) => updateDraft({ link: e.target.value })} style={mergedInputStyle} /></label>
      <label style={field}><div style={labelStyle}>{t(project.locale, "weatherEvents.gmDescription")}</div><textarea value={draft.gmDescription ?? ""} onChange={(e) => updateDraft({ gmDescription: e.target.value })} style={{ ...mergedInputStyle, minHeight: 56 }} /></label>
      <label style={field}><div style={labelStyle}>{t(project.locale, "weatherEvents.playerDescription")}</div><textarea value={draft.playerDescription ?? ""} onChange={(e) => updateDraft({ playerDescription: e.target.value })} style={{ ...mergedInputStyle, minHeight: 56 }} /></label>
      <label style={field}><div style={labelStyle}>{t(project.locale, "weatherEvents.visibility")}</div><select value={draft.visibility ?? "gm"} onChange={(e) => updateDraft({ visibility: e.target.value as WeatherEvent["visibility"] })} style={mergedInputStyle}><option value="gm">{t(project.locale, "weatherEvents.visibilityGm")}</option><option value="players">{t(project.locale, "weatherEvents.visibilityPlayers")}</option><option value="revealOnTrigger">{t(project.locale, "weatherEvents.visibilityRevealOnTrigger")}</option></select></label>
    </WeatherEventFormSection>

    <WeatherEventFormSection title={t(project.locale, "weatherEvents.sectionTriggerOptions")}>
      <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.triggerChancePercent")} help={t(project.locale, "weatherEvents.triggerChanceHelp")} /><input type="number" min={0} max={100} step={1} value={draft.triggerChancePercent ?? 100} onChange={(e) => updateDraft({ triggerChancePercent: Math.max(0, Math.min(100, Math.trunc(Number(e.target.value) || 0))) })} style={mergedInputStyle} /></label>
      <label style={checkLabel}><input type="checkbox" checked={draft.notifyOnTrigger !== false} onChange={(e) => updateDraft({ notifyOnTrigger: e.target.checked })} />{t(project.locale, "weatherEvents.notifyOnTrigger")}</label>
      <label style={checkLabel}><input type="checkbox" checked={draft.archiveAfterTrigger === true} onChange={(e) => updateDraft({ archiveAfterTrigger: e.target.checked })} />{t(project.locale, "weatherEvents.archiveAfterTrigger")}</label>
      <label style={checkLabel}><input type="checkbox" checked={draft.disableAfterTrigger === true} onChange={(e) => updateDraft({ disableAfterTrigger: e.target.checked })} />{t(project.locale, "weatherEvents.disableAfterTrigger")}</label>
    </WeatherEventFormSection>

    <WeatherEventFormSection title={t(project.locale, "weatherEvents.sectionDuration")}>
      <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.durationHours")} help={t(project.locale, "weatherEvents.durationHelp")} /><input type="number" min={0} step={1} value={draft.durationHours ?? ""} onChange={(e) => updateDraft({ durationHours: e.target.value.trim() === "" ? undefined : Math.max(0, Math.trunc(Number(e.target.value) || 0)) })} style={mergedInputStyle} />{showDefaultDurationHelp ? <div style={hint}>{t(project.locale, "weatherEvents.defaultDurationHelp")}</div> : null}</label>
      <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.cooldownHours")} help={t(project.locale, "weatherEvents.cooldownHelp")} /><input type="number" min={0} step={1} value={draft.cooldownHours ?? ""} onChange={(e) => updateDraft({ cooldownHours: e.target.value.trim() === "" ? undefined : Math.max(0, Math.trunc(Number(e.target.value) || 0)) })} style={mergedInputStyle} /></label>
    </WeatherEventFormSection>

    <WeatherEventFormSection title={`${t(project.locale, "weatherEvents.conditions")} (${conditions.length})`}>
      <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.conditions")} help={t(project.locale, "weatherEvents.help.requireAllConditions")} /><select value={draft.requireAllConditions ?? true ? "all" : "any"} onChange={(e) => updateDraft({ requireAllConditions: e.target.value === "all" })} style={mergedInputStyle}><option value="all">{t(project.locale, "weatherEvents.requireAll")}</option><option value="any">{t(project.locale, "weatherEvents.requireAny")}</option></select></label>

      {conditions.length === 0 ? <div style={hint}>{t(project.locale, "weatherEvents.noConditions")}</div> : conditions.map((condition, index) => <CollapsibleEditorBlock key={index} title={conditionSummary(project, condition)}>
        <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.conditionType")} help={t(project.locale, "weatherEvents.help.conditionType")} /><select value={condition.type === undefined || condition.type === "metric" ? "metric" : condition.type} onChange={(e) => updateDraftCondition(index, getDefaultCondition(project, e.target.value as ConditionTypeToAdd))} style={mergedInputStyle}>{conditionTypeOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
        {(condition.type === "metric" || condition.type === undefined) ? <><label style={field}><FieldLabel label={t(project.locale, "weatherEvents.metric")} help={t(project.locale, "weatherEvents.help.metric")} /><select value={condition.metric} onChange={(e) => updateDraftCondition(index, { ...condition, metric: e.target.value as WeatherConditionMetric })} style={mergedInputStyle}><option value="temperature">{t(project.locale, "weatherEvents.metricTemperature")}</option><option value="windSpeed">{t(project.locale, "weatherEvents.metricWindSpeed")}</option><option value="rain">{t(project.locale, "weatherEvents.metricRain")}</option><option value="dailyMinTemperature">{t(project.locale, "weatherEvents.metricDailyMinTemperature")}</option><option value="dailyMaxTemperature">{t(project.locale, "weatherEvents.metricDailyMaxTemperature")}</option><option value="dailyRainTotal">{t(project.locale, "weatherEvents.metricDailyRainTotal")}</option></select></label><label style={field}><FieldLabel label={t(project.locale, "weatherEvents.operator")} help={t(project.locale, "weatherEvents.help.operator")} /><select value={condition.operator} onChange={(e) => updateDraftCondition(index, { ...condition, operator: e.target.value as WeatherConditionOperator })} style={mergedInputStyle}><option value="gte">{t(project.locale, "weatherEvents.operatorGte")}</option><option value="lte">{t(project.locale, "weatherEvents.operatorLte")}</option></select></label><label style={field}><FieldLabel label={t(project.locale, "weatherEvents.value")} help={t(project.locale, "weatherEvents.help.value")} /><WeatherConditionValueInput value={condition.value} inputStyle={mergedInputStyle} onChange={(v) => updateDraftCondition(index, { ...condition, value: v })} /></label></> : null}
        {condition.type === "state" ? <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.state")} help={t(project.locale, "weatherEvents.help.weatherState")} /><select value={condition.state} onChange={(e) => updateDraftCondition(index, { ...condition, state: e.target.value as WeatherState })} style={mergedInputStyle}>{weatherStates.map((s) => <option key={s} value={s}>{t(project.locale, `weather.state.${s}`)}</option>)}</select></label> : null}
        {condition.type === "dominantState" ? <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.dominantState")} help={t(project.locale, "weatherEvents.help.weatherState")} /><select value={condition.state} onChange={(e) => updateDraftCondition(index, { ...condition, state: e.target.value as WeatherState })} style={mergedInputStyle}>{weatherStates.map((s) => <option key={s} value={s}>{t(project.locale, `weather.state.${s}`)}</option>)}</select></label> : null}
        {condition.type === "windDirection" ? <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.windDirection")} help={t(project.locale, "weatherEvents.help.windDirection")} /><select value={condition.direction} onChange={(e) => updateDraftCondition(index, { ...condition, direction: e.target.value as WindDirection })} style={mergedInputStyle}>{windDirections.map((d) => <option key={d} value={d}>{d}</option>)}</select></label> : null}
        {condition.type === "season" ? (project.seasons.length === 0 ? <div style={{ ...hint, color: "#fca5a5" }}>{t(project.locale, "weatherEvents.noSeasonAvailable")}</div> : <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.season")} help={t(project.locale, "weatherEvents.help.season")} /><select value={condition.seasonId} onChange={(e) => updateDraftCondition(index, { ...condition, seasonId: e.target.value })} style={mergedInputStyle}>{project.seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>) : null}
        {condition.type === "timeOfDay" ? <><label style={field}><FieldLabel label={t(project.locale, "weatherEvents.startHour")} help={t(project.locale, "weatherEvents.help.timeOfDay")} /><input type="number" min={0} max={23} value={condition.startHour} onChange={(e) => updateDraftCondition(index, { ...condition, startHour: Math.max(0, Math.min(23, Math.trunc(Number(e.target.value) || 0))) })} style={mergedInputStyle} /></label><label style={field}><FieldLabel label={t(project.locale, "weatherEvents.endHour")} help={t(project.locale, "weatherEvents.help.timeOfDay")} /><input type="number" min={0} max={23} value={condition.endHour} onChange={(e) => updateDraftCondition(index, { ...condition, endHour: Math.max(0, Math.min(23, Math.trunc(Number(e.target.value) || 0))) })} style={mergedInputStyle} /></label></> : null}
        {condition.type === "moonPhase" ? (project.moons.length === 0 ? <div style={{ ...hint, color: "#fca5a5" }}>{t(project.locale, "weatherEvents.noMoonAvailable")}</div> : <><label style={field}><FieldLabel label={t(project.locale, "weatherEvents.moon")} help={t(project.locale, "weatherEvents.help.moonPhase")} /><select value={condition.moonId} onChange={(e) => updateDraftCondition(index, { ...condition, moonId: e.target.value })} style={mergedInputStyle}>{project.moons.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label><label style={field}><FieldLabel label={t(project.locale, "weatherEvents.moonPhase")} help={t(project.locale, "weatherEvents.help.moonPhase")} /><select value={condition.phaseId} onChange={(e) => updateDraftCondition(index, { ...condition, phaseId: e.target.value as MoonPhaseId })} style={mergedInputStyle}>{moonPhases.map((p) => <option key={p} value={p}>{t(project.locale, `moon.phase.${p}`)}</option>)}</select></label></>) : null}
        <button type="button" onClick={() => deleteDraftCondition(index)} style={dangerButtonStyle}>{t(project.locale, "weatherEvents.deleteCondition")}</button>
      </CollapsibleEditorBlock>)}

      <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8 }}><FieldLabel label={t(project.locale, "weatherEvents.conditionType")} help={t(project.locale, "weatherEvents.help.conditionType")} /><div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <select value={conditionTypeToAdd} onChange={(e) => setConditionTypeToAdd(e.target.value as ConditionTypeToAdd)} style={{ ...mergedInputStyle, flex: "1 1 180px", marginBottom: 0 }}>{conditionTypeOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>
        <button type="button" onClick={() => addDraftCondition(getDefaultCondition(project, conditionTypeToAdd))} style={smallButtonStyle}>{t(project.locale, "weatherEvents.addCondition")}</button>
      </div></div>
    </WeatherEventFormSection>

    {(draft.kind ?? "informational") === "weatherEffect" ? <WeatherEventFormSection title={t(project.locale, "weatherEvents.sectionWeatherEffect")}>
      <div style={hint}>{t(project.locale, "weatherEvents.effectEmptyFieldsHelp")}</div>
      {!hasConfiguredWeatherEffect ? <div style={warningBoxStyle}>{t(project.locale, "weatherEvents.noConfiguredEffectWarning")}</div> : null}
      <CollapsibleEditorBlock title={t(project.locale, "weatherEvents.effectGroupSky")} help={t(project.locale, "weatherEvents.help.effectGroupSky")}>
        <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.effectState")} help={t(project.locale, "weatherEvents.help.weatherState")} /><select value={draft.effect?.state ?? ""} onChange={(e) => updateDraft({ effect: { ...(draft.effect ?? {}), state: e.target.value === "" ? undefined : e.target.value as WeatherState } })} style={mergedInputStyle}><option value="">{t(project.locale, "weatherEvents.effectNoOverride")}</option>{weatherStates.map((s) => <option key={s} value={s}>{t(project.locale, `weather.state.${s}`)}</option>)}</select></label>
        <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.effectDominantState")} help={t(project.locale, "weatherEvents.help.weatherState")} /><select value={draft.effect?.dominantState ?? ""} onChange={(e) => updateDraft({ effect: { ...(draft.effect ?? {}), dominantState: e.target.value === "" ? undefined : e.target.value as WeatherState } })} style={mergedInputStyle}><option value="">{t(project.locale, "weatherEvents.effectNoOverride")}</option>{weatherStates.map((s) => <option key={s} value={s}>{t(project.locale, `weather.state.${s}`)}</option>)}</select></label>
        <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.effectTrendKind")} help={t(project.locale, "weatherEvents.effectEmptyFieldsHelp")} /><select value={draft.effect?.trendKind ?? ""} onChange={(e) => updateDraft({ effect: { ...(draft.effect ?? {}), trendKind: e.target.value === "" ? undefined : e.target.value as WeatherTrendKind } })} style={mergedInputStyle}><option value="">{t(project.locale, "weatherEvents.effectNoOverride")}</option>{weatherTrends.map((trend) => <option key={trend} value={trend}>{t(project.locale, `weatherEvents.trend${trend.charAt(0).toUpperCase()}${trend.slice(1)}`)}</option>)}</select></label>
      </CollapsibleEditorBlock>
      <CollapsibleEditorBlock title={t(project.locale, "weatherEvents.effectGroupTemperature")} help={t(project.locale, "weatherEvents.help.effectGroupTemperature")}>
        <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.effectTemperature")} help={t(project.locale, "weatherEvents.help.value")} /><input type="number" value={draft.effect?.temperature ?? ""} onChange={(e) => updateDraft({ effect: { ...(draft.effect ?? {}), temperature: e.target.value.trim() === "" ? undefined : Number(e.target.value) } })} style={mergedInputStyle} /></label>
        <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.effectDailyMinTemperature")} help={t(project.locale, "weatherEvents.help.value")} /><input type="number" value={draft.effect?.dailyMinTemperature ?? ""} onChange={(e) => updateDraft({ effect: { ...(draft.effect ?? {}), dailyMinTemperature: e.target.value.trim() === "" ? undefined : Number(e.target.value) } })} style={mergedInputStyle} /></label>
        <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.effectDailyMaxTemperature")} help={t(project.locale, "weatherEvents.help.value")} /><input type="number" value={draft.effect?.dailyMaxTemperature ?? ""} onChange={(e) => updateDraft({ effect: { ...(draft.effect ?? {}), dailyMaxTemperature: e.target.value.trim() === "" ? undefined : Number(e.target.value) } })} style={mergedInputStyle} /></label>
      </CollapsibleEditorBlock>
      <CollapsibleEditorBlock title={t(project.locale, "weatherEvents.effectGroupRain")} help={t(project.locale, "weatherEvents.help.effectGroupRain")}>
        <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.effectRain")} help={t(project.locale, "weatherEvents.help.value")} /><input type="number" value={draft.effect?.rain ?? ""} onChange={(e) => updateDraft({ effect: { ...(draft.effect ?? {}), rain: e.target.value.trim() === "" ? undefined : Number(e.target.value) } })} style={mergedInputStyle} /></label>
        <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.effectDailyRainTotal")} help={t(project.locale, "weatherEvents.help.value")} /><input type="number" value={draft.effect?.dailyRainTotal ?? ""} onChange={(e) => updateDraft({ effect: { ...(draft.effect ?? {}), dailyRainTotal: e.target.value.trim() === "" ? undefined : Number(e.target.value) } })} style={mergedInputStyle} /></label>
      </CollapsibleEditorBlock>
      <CollapsibleEditorBlock title={t(project.locale, "weatherEvents.effectGroupWind")} help={t(project.locale, "weatherEvents.help.effectGroupWind")}>
        <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.effectWindSpeed")} help={t(project.locale, "weatherEvents.help.value")} /><input type="number" value={draft.effect?.windSpeed ?? ""} onChange={(e) => updateDraft({ effect: { ...(draft.effect ?? {}), windSpeed: e.target.value.trim() === "" ? undefined : Number(e.target.value) } })} style={mergedInputStyle} /></label>
        <label style={field}><FieldLabel label={t(project.locale, "weatherEvents.effectWindDirection")} help={t(project.locale, "weatherEvents.help.windDirection")} /><select value={draft.effect?.windDirection ?? ""} onChange={(e) => updateDraft({ effect: { ...(draft.effect ?? {}), windDirection: e.target.value === "" ? undefined : e.target.value as WindDirection } })} style={mergedInputStyle}><option value="">{t(project.locale, "weatherEvents.effectNoOverride")}</option>{windDirections.map((d) => <option key={d} value={d}>{d}</option>)}</select></label>
      </CollapsibleEditorBlock>
    </WeatherEventFormSection> : null}
    <WeatherEventFormSection title={t(project.locale, "weatherEvents.history")}>
      <div style={hint}>{t(project.locale, "weatherEvents.lastTriggeredAtMinutes")}: {typeof draft.lastTriggeredAtMinutes === "number" ? formatWeatherHistoryDate(project, draft.lastTriggeredAtMinutes) : t(project.locale, "weatherEvents.neverTriggered")}</div>
      {(draft.triggerHistory ?? []).length === 0 ? <div style={hint}>{t(project.locale, "weatherEvents.noHistory")}</div> : <div style={{ display: "grid", gap: 4 }}>{(draft.triggerHistory ?? []).slice(-5).reverse().map((entry) => <div key={entry.id} style={hint}>{t(project.locale, "weatherEvents.historyAt")} {formatWeatherHistoryDate(project, entry.triggeredAtMinutes)}{entry.weatherState ? ` · ${t(project.locale, `weather.state.${entry.weatherState}`)}` : ""}{entry.dominantState ? ` · ${t(project.locale, `weather.state.${entry.dominantState}`)}` : ""}{typeof entry.temperature === "number" ? ` · T:${entry.temperature}` : ""}{typeof entry.rain === "number" ? ` · R:${entry.rain}` : ""}{typeof entry.windSpeed === "number" ? ` · W:${entry.windSpeed}` : ""}</div>)}</div>}
    </WeatherEventFormSection>

    <div style={{ display: "flex", gap: 6, marginTop: 8 }}><button type="button" onClick={onCancel} style={buttonStyle}>{t(project.locale, "events.cancel")}</button><button type="button" onClick={() => onSubmit(draft)} style={buttonStyle}>{mode === "create" ? t(project.locale, "weatherEvents.create") : t(project.locale, "weatherEvents.update")}</button></div>
  </div>;
};

const WeatherConditionValueInput = ({ value, inputStyle, onChange }: { value: number; inputStyle: React.CSSProperties; onChange: (value: number) => void; }) => {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return <input type="text" inputMode="decimal" value={draft} onChange={(e) => { const v = e.target.value; setDraft(v); const parsed = parseWeatherInput(v); if (parsed !== null) onChange(parsed); }} style={inputStyle} />;
};

const labelStyle = { fontSize: 12, color: "#cbd5e1" };
const labelWithHelpStyle = { ...labelStyle, display: "flex", alignItems: "center", gap: 6, marginBottom: 2 };
const infoIconStyle = { fontSize: 12, color: "#93c5fd", cursor: "help" };
const field = { display: "block" };
const hint = { fontSize: 11, color: "#9ca3af" };
const defaultInputStyle = { width: "100%", background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 6, padding: "6px 8px", fontSize: 12, boxSizing: "border-box" as const, marginBottom: 8 };
const buttonStyle = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "6px 10px", cursor: "pointer" };
const smallButtonStyle = { ...buttonStyle, fontSize: 12, padding: "5px 8px" };
const dangerButtonStyle = { ...smallButtonStyle, borderColor: "#7f1d1d", background: "#450a0a", color: "#fecaca" };
const warningBoxStyle = { border: "1px solid #92400e", background: "#451a03", color: "#fed7aa", borderRadius: 8, padding: 8, fontSize: 12 };
const condCard = { border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827", display: "grid", gap: 6 };
const collapsibleEditorHeaderStyle = { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, background: "transparent", color: "#f3f4f6", padding: 0, border: 0, cursor: "pointer", fontSize: 12, fontWeight: 700, textAlign: "left" as const };
const checkLabel = { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 };
const sectionBoxStyle = { border: "1px solid #374151", borderRadius: 8, marginBottom: 8, overflow: "hidden" };
const sectionHeaderButtonStyle = { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111827", color: "#f3f4f6", padding: "8px 10px", border: 0, cursor: "pointer", fontSize: 12, fontWeight: 700 };
const sectionContentStyle = { padding: 8, display: "grid", gap: 8, background: "#0f172a" };
const autoSummaryBoxStyle = { border: "1px solid #374151", borderRadius: 8, background: "#111827", padding: 8, marginBottom: 8, fontSize: 12, color: "#cbd5e1" };