import {
  addWeatherCondition,
  addWeatherEvent,
  createDefaultWeatherEvent,
  deleteWeatherCondition,
  deleteWeatherEvent,
  updateWeatherCondition,
  updateWeatherEvent
} from "../../calendar/weatherEventsLogic";
import type { CalendarProject, WeatherConditionMetric, WeatherConditionOperator } from "../../domain/types";
import { t } from "../../i18n/messages";

type Props = {
  project: CalendarProject;
  onProjectUpdate: (project: CalendarProject) => void;
  inputStyle: React.CSSProperties;
};

const metricLabel = (locale: CalendarProject["locale"], metric: WeatherConditionMetric): string => {
  if (metric === "temperature") return t(locale, "weatherEvents.metricTemperature");
  if (metric === "windSpeed") return t(locale, "weatherEvents.metricWindSpeed");
  return t(locale, "weatherEvents.metricRain");
};

const operatorLabel = (locale: CalendarProject["locale"], operator: WeatherConditionOperator): string =>
  operator === "gte" ? t(locale, "weatherEvents.operatorGte") : t(locale, "weatherEvents.operatorLte");

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
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <input type="checkbox" checked={event.enabled} onChange={(e) => onProjectUpdate(updateWeatherEvent(project, event.id, { enabled: e.target.checked }))} />
              <span>{t(project.locale, "weatherEvents.enabled")}</span>
            </label>
            <label style={{ display: "block" }}>
              <div style={labelStyle}>{t(project.locale, "weatherEvents.conditions")}</div>
              <select
                value={event.requireAllConditions ? "all" : "any"}
                onChange={(e) => onProjectUpdate(updateWeatherEvent(project, event.id, { requireAllConditions: e.target.value === "all" }))}
                style={inputStyle}
              >
                <option value="all">{t(project.locale, "weatherEvents.requireAll")}</option>
                <option value="any">{t(project.locale, "weatherEvents.requireAny")}</option>
              </select>
            </label>

            <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>
              {event.requireAllConditions ? t(project.locale, "weatherEvents.requireAll") : t(project.locale, "weatherEvents.requireAny")}
            </div>
            {(event.conditions ?? []).map((condition, index) => (
              <div key={`${event.id}-${index}`} style={{ border: "1px dashed #374151", borderRadius: 6, padding: 6, marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
                  {metricLabel(project.locale, condition.metric)} {condition.operator === "gte" ? ">=" : "<="} {condition.value}
                </div>
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
                  <input
                    type="number"
                    value={condition.value}
                    onChange={(e) => onProjectUpdate(updateWeatherCondition(project, event.id, index, { value: Number(e.target.value) }))}
                    style={inputStyle}
                  />
                </label>
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
        ))}
      </div>
    )}
  </>
);

const labelStyle = { fontSize: 12, color: "#cbd5e1" };
const buttonStyle = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "6px 10px", cursor: "pointer" };
const smallButtonStyle = { ...buttonStyle, fontSize: 12, padding: "5px 8px" };
