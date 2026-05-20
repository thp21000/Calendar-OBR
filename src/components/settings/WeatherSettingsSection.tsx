import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";

type Props = {
  project: CalendarProject;
  onProjectUpdate: (project: CalendarProject) => void;
  inputStyle: React.CSSProperties;
};

export const WeatherSettingsSection = ({ project, onProjectUpdate, inputStyle }: Props) => {
  const mode = project.weatherSettings.forecastMode ?? "fine";
  const seed = project.weatherSettings.seed ?? "";

  return (
    <>
      <label style={{ display: "block" }}>
        <div style={{ fontSize: 12, color: "#cbd5e1" }}>{t(project.locale, "weather.seed")}</div>
        <input
          value={seed}
          onChange={(e) =>
            onProjectUpdate({
              ...project,
              weatherSettings: {
                ...project.weatherSettings,
                seed: e.target.value.trim() === "" ? undefined : e.target.value
              }
            })
          }
          placeholder={t(project.locale, "weather.seedPlaceholder")}
          style={inputStyle}
        />
      </label>
      <button
        type="button"
        onClick={() =>
          onProjectUpdate({
            ...project,
            weatherSettings: {
              ...project.weatherSettings,
              seed: `${project.locale === "fr" ? "meteo" : "weather"}-${Date.now()}`
            }
          })
        }
        style={{
          border: "1px solid #374151",
          borderRadius: 6,
          background: "#1f2937",
          color: "#e5e7eb",
          padding: "6px 10px",
          marginBottom: 8,
          cursor: "pointer"
        }}
      >
        {t(project.locale, "weather.generateSeed")}
      </button>
      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>{t(project.locale, "weather.seedHelp")}</div>
      <label style={{ display: "block" }}>
        <div style={{ fontSize: 12, color: "#cbd5e1" }}>{t(project.locale, "weather.forecastMode")}</div>
        <select
          value={mode}
          onChange={(e) =>
            onProjectUpdate({
              ...project,
              weatherSettings: { ...project.weatherSettings, forecastMode: e.target.value as "fine" | "wide" }
            })
          }
          style={inputStyle}
        >
          <option value="fine">{t(project.locale, "weather.forecastModeFine")}</option>
          <option value="wide">{t(project.locale, "weather.forecastModeWide")}</option>
        </select>
      </label>
      <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "weather.forecastModeHelp")}</div>
    </>
  );
};