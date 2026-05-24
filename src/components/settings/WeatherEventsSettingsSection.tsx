import {
  addWeatherCondition,
  addWeatherSeasonCondition,
  addWeatherTimeOfDayCondition,
  addWeatherMoonPhaseCondition,
  addWeatherStateCondition,
  addWeatherDominantStateCondition,
  addWeatherWindDirectionCondition,
  addWeatherEvent,
  createDefaultWeatherEvent,
  deleteWeatherCondition,
  deleteWeatherEvent,
  updateWeatherCondition,
  updateWeatherEvent
} from "../../calendar/weatherEventsLogic";
import { parseWeatherInput } from "../../calendar/seasonsLogic";
import type { CalendarProject, MoonPhaseId, WeatherCondition, WeatherConditionMetric, WeatherConditionOperator, WeatherState, WindDirection } from "../../domain/types";
import { useEffect, useState } from "react";
import { t } from "../../i18n/messages";

type Props = {
  project: CalendarProject;
  onProjectUpdate: (project: CalendarProject) => void;
  inputStyle: React.CSSProperties;
};

const metricLabel = (locale: CalendarProject["locale"], metric: WeatherConditionMetric): string => {
  if (metric === "temperature") return t(locale, "weatherEvents.metricTemperature");
  if (metric === "windSpeed") return t(locale, "weatherEvents.metricWindSpeed");
  if (metric === "dailyMinTemperature") return t(locale, "weatherEvents.metricDailyMinTemperature");
  if (metric === "dailyMaxTemperature") return t(locale, "weatherEvents.metricDailyMaxTemperature");
  if (metric === "dailyRainTotal") return t(locale, "weatherEvents.metricDailyRainTotal");
  return t(locale, "weatherEvents.metricRain");
};

const operatorLabel = (locale: CalendarProject["locale"], operator: WeatherConditionOperator): string =>
  operator === "gte" ? t(locale, "weatherEvents.operatorGte") : t(locale, "weatherEvents.operatorLte");

const weatherStates: WeatherState[] = ["clear", "cloudy", "overcast", "fog", "lightRain", "heavyRain", "storm", "snow", "strongWind", "tempest"];
const moonPhases: MoonPhaseId[] = ["new", "waxingCrescent", "firstQuarter", "waxingGibbous", "full", "waningGibbous", "lastQuarter", "waningCrescent"];
const windDirections: WindDirection[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const conditionSummary = (locale: CalendarProject["locale"], condition: WeatherCondition): string => {
  if (condition.type === "state") {
    return `${t(locale, "weatherEvents.state")} = ${t(locale, `weather.state.${condition.state}`)}`;
  }
  if (condition.type === "dominantState") return `${t(locale, "weatherEvents.dominantState")} = ${t(locale, `weather.state.${condition.state}`)}`;
  if (condition.type === "windDirection") return `${t(locale, "weatherEvents.windDirection")} = ${condition.direction}`;
  if (condition.type === "season") return `${t(locale, "weatherEvents.season")} = ${condition.seasonId || "?"}`;
  if (condition.type === "timeOfDay") return `${t(locale, "weatherEvents.timeOfDay")} ${condition.startHour}→${condition.endHour}`;
  if (condition.type === "moonPhase") return `${t(locale, "weatherEvents.moonPhase")} = ${condition.phaseId}`;
  return `${metricLabel(locale, condition.metric)} ${condition.operator === "gte" ? ">=" : "<="} ${condition.value}`;
};

export const WeatherEventsSettingsSection = ({ project, onProjectUpdate, inputStyle }: Props) => (
  <>
    <button type="button" onClick={() => onProjectUpdate(addWeatherEvent(project, createDefaultWeatherEvent(project.locale)))} style={buttonStyle}>
      {t(project.locale, "weatherEvents.add")}
    </button>

    {project.weatherEvents.length === 0 ? (
      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>{t(project.locale, "weatherEvents.empty")}</div>
    ) : (
      <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
        {project.weatherEvents.map((event) => (
          (() => {
            const requireAll = event.requireAllConditions ?? true;
            return (
          <div key={event.id} style={{ border: "1px solid #374151", borderRadius: 8, padding: 8 }}>
            <label style={{ display: "block" }}>
              <div style={labelStyle}>{t(project.locale, "weatherEvents.name")}</div>
              <input value={event.name} onChange={(e) => onProjectUpdate(updateWeatherEvent(project, event.id, { name: e.target.value }))} style={inputStyle} />
            </label>
            <label style={{ display: "block" }}>
              <div style={labelStyle}>{t(project.locale, "weatherEvents.icon")}</div>
              <input value={event.icon ?? ""} onChange={(e) => onProjectUpdate(updateWeatherEvent(project, event.id, { icon: e.target.value }))} style={inputStyle} />
            </label>
            <label style={{ display: "block" }}>
              <div style={labelStyle}>{t(project.locale, "weatherEvents.summary")}</div>
              <input value={event.summary ?? ""} onChange={(e) => onProjectUpdate(updateWeatherEvent(project, event.id, { summary: e.target.value }))} style={inputStyle} />
            </label>
            <label style={{ display: "block" }}>
              <div style={labelStyle}>{t(project.locale, "weatherEvents.link")}</div>
              <input value={event.link ?? ""} onChange={(e) => onProjectUpdate(updateWeatherEvent(project, event.id, { link: e.target.value }))} style={inputStyle} />
            </label>
            <label style={{ display: "block" }}>
              <div style={labelStyle}>{t(project.locale, "weatherEvents.gmDescription")}</div>
              <textarea value={event.gmDescription ?? ""} onChange={(e) => onProjectUpdate(updateWeatherEvent(project, event.id, { gmDescription: e.target.value }))} style={{ ...inputStyle, minHeight: 56 }} />
            </label>
            <label style={{ display: "block" }}>
              <div style={labelStyle}>{t(project.locale, "weatherEvents.playerDescription")}</div>
              <textarea value={event.playerDescription ?? ""} onChange={(e) => onProjectUpdate(updateWeatherEvent(project, event.id, { playerDescription: e.target.value }))} style={{ ...inputStyle, minHeight: 56 }} />
            </label>
            <label style={{ display: "block" }}>
              <div style={labelStyle}>{t(project.locale, "weatherEvents.visibility")}</div>
              <select value={event.visibility ?? "gm"} onChange={(e) => onProjectUpdate(updateWeatherEvent(project, event.id, { visibility: e.target.value as "gm" | "players" | "revealOnTrigger" }))} style={inputStyle}>
                <option value="gm">{t(project.locale, "weatherEvents.visibilityGm")}</option>
                <option value="players">{t(project.locale, "weatherEvents.visibilityPlayers")}</option>
                <option value="revealOnTrigger">{t(project.locale, "weatherEvents.visibilityRevealOnTrigger")}</option>
              </select>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <input type="checkbox" checked={event.notifyOnTrigger !== false} onChange={(e) => onProjectUpdate(updateWeatherEvent(project, event.id, { notifyOnTrigger: e.target.checked }))} />
              <span>{t(project.locale, "weatherEvents.notifyOnTrigger")}</span>
            </label>
            <label style={{ display: "block" }}>
              <div style={labelStyle}>{t(project.locale, "weatherEvents.status")}</div>
              <select value={event.status ?? "active"} onChange={(e) => onProjectUpdate(updateWeatherEvent(project, event.id, { status: e.target.value as "active" | "triggered" | "archived" | "disabled" }))} style={inputStyle}>
                <option value="active">{t(project.locale, "weatherEvents.statusActive")}</option>
                <option value="triggered">{t(project.locale, "weatherEvents.statusTriggered")}</option>
                <option value="archived">{t(project.locale, "weatherEvents.statusArchived")}</option>
                <option value="disabled">{t(project.locale, "weatherEvents.statusDisabled")}</option>
              </select>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <input type="checkbox" checked={event.archiveAfterTrigger === true} onChange={(e) => onProjectUpdate(updateWeatherEvent(project, event.id, { archiveAfterTrigger: e.target.checked }))} />
              <span>{t(project.locale, "weatherEvents.archiveAfterTrigger")}</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <input type="checkbox" checked={event.disableAfterTrigger === true} onChange={(e) => onProjectUpdate(updateWeatherEvent(project, event.id, { disableAfterTrigger: e.target.checked }))} />
              <span>{t(project.locale, "weatherEvents.disableAfterTrigger")}</span>
            </label>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>
              {t(project.locale, "weatherEvents.lastTriggeredAtMinutes")}: {typeof event.lastTriggeredAtMinutes === "number" ? event.lastTriggeredAtMinutes : t(project.locale, "weatherEvents.neverTriggered")}
            </div>
            <label style={{ display: "block" }}>
              <div style={labelStyle}>{t(project.locale, "weatherEvents.durationHours")}</div>
              <input
                type="number"
                min={0}
                step={1}
                value={event.durationHours ?? ""}
                onChange={(e) =>
                  onProjectUpdate(
                    updateWeatherEvent(project, event.id, {
                      durationHours:
                        e.target.value.trim() === ""
                          ? undefined
                          : Math.max(0, Math.trunc(Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0))
                    })
                  )
                }
                style={inputStyle}
              />
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{t(project.locale, "weatherEvents.durationHelp")}</div>
            </label>
            <label style={{ display: "block" }}>
              <div style={labelStyle}>{t(project.locale, "weatherEvents.cooldownHours")}</div>
              <input
                type="number"
                min={0}
                step={1}
                value={event.cooldownHours ?? ""}
                onChange={(e) =>
                  onProjectUpdate(
                    updateWeatherEvent(project, event.id, {
                      cooldownHours:
                        e.target.value.trim() === ""
                          ? undefined
                          : Math.max(0, Math.trunc(Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0))
                    })
                  )
                }
                style={inputStyle}
              />
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{t(project.locale, "weatherEvents.cooldownHelp")}</div>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={event.enabled !== false}
                onChange={(e) => onProjectUpdate(updateWeatherEvent(project, event.id, { enabled: e.target.checked }))}
              />
              <span>{t(project.locale, "weatherEvents.enabled")}</span>
            </label>
            <label style={{ display: "block" }}>
              <div style={labelStyle}>{t(project.locale, "weatherEvents.conditions")}</div>
              <select
                value={requireAll ? "all" : "any"}
                onChange={(e) => onProjectUpdate(updateWeatherEvent(project, event.id, { requireAllConditions: e.target.value === "all" }))}
                style={inputStyle}
              >
                <option value="all">{t(project.locale, "weatherEvents.requireAll")}</option>
                <option value="any">{t(project.locale, "weatherEvents.requireAny")}</option>
              </select>
            </label>

            <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>
              {requireAll ? t(project.locale, "weatherEvents.requireAll") : t(project.locale, "weatherEvents.requireAny")}
            </div>
            {(event.conditions ?? []).map((condition, index) => (
              <div key={`${event.id}-${index}`} style={{ border: "1px dashed #374151", borderRadius: 6, padding: 6, marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
                  {conditionSummary(project.locale, condition)}
                </div>
                <label style={{ display: "block" }}>
                  <div style={labelStyle}>{t(project.locale, "weatherEvents.conditionType")}</div>
                  <select
                    value={condition.type === "state" ? "state" : condition.type === "dominantState" ? "dominantState" : condition.type === "windDirection" ? "windDirection" : condition.type === "season" ? "season" : condition.type === "timeOfDay" ? "timeOfDay" : condition.type === "moonPhase" ? "moonPhase" : "metric"}
                    onChange={(e) =>
                      onProjectUpdate(
                        updateWeatherCondition(
                          project,
                          event.id,
                          index,
                          e.target.value === "state"
                            ? { type: "state", state: "storm" }
                            : e.target.value === "dominantState"
                            ? { type: "dominantState", state: "heavyRain" }
                            : e.target.value === "windDirection"
                            ? { type: "windDirection", direction: "N" }
                            : e.target.value === "season"
                            ? { type: "season", seasonId: project.seasons[0]?.id ?? "" }
                            : e.target.value === "timeOfDay"
                            ? { type: "timeOfDay", startHour: 22, endHour: 6 }
                            : e.target.value === "moonPhase"
                            ? { type: "moonPhase", moonId: project.moons[0]?.id ?? "", phaseId: "full" }
                            : { type: "metric", metric: "temperature", operator: "gte", value: 35 }
                        )
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="metric">{t(project.locale, "weatherEvents.conditionTypeMetric")}</option>
                    <option value="state">{t(project.locale, "weatherEvents.conditionTypeState")}</option>
                    <option value="dominantState">{t(project.locale, "weatherEvents.conditionDominantState")}</option>
                    <option value="windDirection">{t(project.locale, "weatherEvents.conditionWindDirection")}</option>
                    <option value="season">{t(project.locale, "weatherEvents.conditionTypeSeason")}</option>
                    <option value="timeOfDay">{t(project.locale, "weatherEvents.conditionTypeTimeOfDay")}</option>
                    <option value="moonPhase">{t(project.locale, "weatherEvents.conditionTypeMoonPhase")}</option>
                  </select>
                </label>
                {condition.type === "state" ? (
                  <label style={{ display: "block" }}>
                    <div style={labelStyle}>{t(project.locale, "weatherEvents.state")}</div>
                    <select
                      value={condition.state}
                      onChange={(e) => onProjectUpdate(updateWeatherCondition(project, event.id, index, { type: "state", state: e.target.value as WeatherState }))}
                      style={inputStyle}
                    >
                      {weatherStates.map((state) => (
                        <option key={state} value={state}>
                          {t(project.locale, `weather.state.${state}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                  ) : condition.type === "dominantState" ? (
                  <label style={{ display: "block" }}>
                    <div style={labelStyle}>{t(project.locale, "weatherEvents.dominantState")}</div>
                    <select value={condition.state} onChange={(e) => onProjectUpdate(updateWeatherCondition(project, event.id, index, { type: "dominantState", state: e.target.value as WeatherState }))} style={inputStyle}>
                      {weatherStates.map((state) => <option key={state} value={state}>{t(project.locale, `weather.state.${state}`)}</option>)}
                    </select>
                  </label>
                ) : condition.type === "windDirection" ? (
                  <label style={{ display: "block" }}>
                    <div style={labelStyle}>{t(project.locale, "weatherEvents.windDirection")}</div>
                    <select value={condition.direction} onChange={(e) => onProjectUpdate(updateWeatherCondition(project, event.id, index, { type: "windDirection", direction: e.target.value as WindDirection }))} style={inputStyle}>
                      {windDirections.map((direction) => <option key={direction} value={direction}>{direction}</option>)}
                    </select>
                  </label>
                ) : condition.type === "season" ? (
                  project.seasons.length === 0 ? (
                    <div style={{ fontSize: 11, color: "#fca5a5" }}>{t(project.locale, "weatherEvents.noSeasonAvailable")}</div>
                  ) : (
                    <label style={{ display: "block" }}>
                      <div style={labelStyle}>{t(project.locale, "weatherEvents.season")}</div>
                      <select
                        value={condition.seasonId}
                        onChange={(e) => onProjectUpdate(updateWeatherCondition(project, event.id, index, { type: "season", seasonId: e.target.value }))}
                        style={inputStyle}
                      >
                        {project.seasons.map((season) => (
                          <option key={season.id} value={season.id}>
                            {season.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )
                ) : condition.type === "timeOfDay" ? (
                  <>
                    <label style={{ display: "block" }}>
                      <div style={labelStyle}>{t(project.locale, "weatherEvents.startHour")}</div>
                      <input type="number" min={0} max={23} step={1} value={condition.startHour} onChange={(e) => onProjectUpdate(updateWeatherCondition(project, event.id, index, { type: "timeOfDay", startHour: Math.max(0, Math.min(23, Math.trunc(Number(e.target.value) || 0))) }))} style={inputStyle} />
                    </label>
                    <label style={{ display: "block" }}>
                      <div style={labelStyle}>{t(project.locale, "weatherEvents.endHour")}</div>
                      <input type="number" min={0} max={23} step={1} value={condition.endHour} onChange={(e) => onProjectUpdate(updateWeatherCondition(project, event.id, index, { type: "timeOfDay", endHour: Math.max(0, Math.min(23, Math.trunc(Number(e.target.value) || 0))) }))} style={inputStyle} />
                    </label>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{t(project.locale, "weatherEvents.timeOfDayHelp")}</div>
                  </>
                  ) : condition.type === "moonPhase" ? (
                  project.moons.length === 0 ? (
                    <div style={{ fontSize: 11, color: "#fca5a5" }}>{t(project.locale, "weatherEvents.noMoonAvailable")}</div>
                  ) : (
                    <>
                      <label style={{ display: "block" }}>
                        <div style={labelStyle}>{t(project.locale, "weatherEvents.moon")}</div>
                        <select value={condition.moonId} onChange={(e) => onProjectUpdate(updateWeatherCondition(project, event.id, index, { type: "moonPhase", moonId: e.target.value, phaseId: condition.phaseId }))} style={inputStyle}>
                          {project.moons.map((moon) => <option key={moon.id} value={moon.id}>{moon.name}</option>)}
                        </select>
                      </label>
                      <label style={{ display: "block" }}>
                        <div style={labelStyle}>{t(project.locale, "weatherEvents.moonPhase")}</div>
                        <select value={condition.phaseId} onChange={(e) => onProjectUpdate(updateWeatherCondition(project, event.id, index, { type: "moonPhase", moonId: condition.moonId, phaseId: e.target.value as MoonPhaseId }))} style={inputStyle}>
                          {moonPhases.map((phase) => <option key={phase} value={phase}>{phase}</option>)}
                        </select>
                      </label>
                    </>
                  )
                ) : (
                  <>
                <label style={{ display: "block" }}>
                  <div style={labelStyle}>{t(project.locale, "weatherEvents.metric")}</div>
                  <select
                    value={condition.metric}
                    onChange={(e) => onProjectUpdate(updateWeatherCondition(project, event.id, index, { metric: e.target.value as WeatherConditionMetric }))}
                    style={inputStyle}
                  >
                    <option value="temperature">{t(project.locale, "weatherEvents.metricTemperature")}</option>
                    <option value="windSpeed">{t(project.locale, "weatherEvents.metricWindSpeed")}</option>
                    <option value="rain">{t(project.locale, "weatherEvents.metricRain")}</option>
                    <option value="dailyMinTemperature">{t(project.locale, "weatherEvents.metricDailyMinTemperature")}</option>
                    <option value="dailyMaxTemperature">{t(project.locale, "weatherEvents.metricDailyMaxTemperature")}</option>
                    <option value="dailyRainTotal">{t(project.locale, "weatherEvents.metricDailyRainTotal")}</option>
                  </select>
                </label>
                <label style={{ display: "block" }}>
                  <div style={labelStyle}>{t(project.locale, "weatherEvents.operator")}</div>
                  <select
                    value={condition.operator}
                    onChange={(e) => onProjectUpdate(updateWeatherCondition(project, event.id, index, { operator: e.target.value as WeatherConditionOperator }))}
                    style={inputStyle}
                  >
                    <option value="gte">{operatorLabel(project.locale, "gte")}</option>
                    <option value="lte">{operatorLabel(project.locale, "lte")}</option>
                  </select>
                </label>
                <label style={{ display: "block" }}>
                  <div style={labelStyle}>{t(project.locale, "weatherEvents.value")}</div>
                  <WeatherConditionValueInput
                    value={condition.value}
                    inputStyle={inputStyle}
                    onChange={(nextValue) => onProjectUpdate(updateWeatherCondition(project, event.id, index, { value: nextValue }))}
                  />
                </label>
                </>
                )}
                <button type="button" onClick={() => onProjectUpdate(deleteWeatherCondition(project, event.id, index))} style={smallButtonStyle}>
                  {t(project.locale, "weatherEvents.deleteCondition")}
                </button>
              </div>
            ))}

            {(event.conditions ?? []).length === 0 ? (
              <div style={{ fontSize: 12, color: "#fca5a5", marginBottom: 8 }}>{t(project.locale, "weatherEvents.noConditions")}</div>
            ) : null}

            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => onProjectUpdate(addWeatherCondition(project, event.id))} style={smallButtonStyle}>
                {t(project.locale, "weatherEvents.addCondition")}
              </button>
              <button type="button" onClick={() => onProjectUpdate(addWeatherStateCondition(project, event.id))} style={smallButtonStyle}>
                {t(project.locale, "weatherEvents.addStateCondition")}
              </button>
              <button type="button" onClick={() => onProjectUpdate(addWeatherSeasonCondition(project, event.id))} style={smallButtonStyle}>
                {t(project.locale, "weatherEvents.addSeasonCondition")}
              </button>
              <button type="button" onClick={() => onProjectUpdate(addWeatherTimeOfDayCondition(project, event.id))} style={smallButtonStyle}>
                {t(project.locale, "weatherEvents.addTimeOfDayCondition")}
              </button>
              <button type="button" onClick={() => onProjectUpdate(addWeatherMoonPhaseCondition(project, event.id))} style={smallButtonStyle}>
                {t(project.locale, "weatherEvents.addMoonPhaseCondition")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!confirm(t(project.locale, "weatherEvents.confirmDelete"))) return;
                  onProjectUpdate(deleteWeatherEvent(project, event.id));
                }}
                style={{ ...smallButtonStyle, borderColor: "#7f1d1d", color: "#fecaca" }}
              >
                {t(project.locale, "weatherEvents.delete")}
              </button>
            </div>
          </div>
          );
          })()
        ))}
      </div>
    )}
  </>
);

const WeatherConditionValueInput = ({
  value,
  inputStyle,
  onChange
}: {
  value: number;
  inputStyle: React.CSSProperties;
  onChange: (value: number) => void;
}) => {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      onChange={(e) => {
        const nextDraft = e.target.value;
        setDraft(nextDraft);
        const parsed = parseWeatherInput(nextDraft);
        if (parsed === null) return;
        onChange(parsed);
      }}
      style={inputStyle}
    />
  );
};

const labelStyle = { fontSize: 12, color: "#cbd5e1" };
const buttonStyle = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "6px 10px", cursor: "pointer" };
const smallButtonStyle = { ...buttonStyle, fontSize: 12, padding: "5px 8px" };
