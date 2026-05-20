import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";

type Props = {
  project: CalendarProject;
  onProjectUpdate: (project: CalendarProject) => void;
  inputStyle: React.CSSProperties;
};

export const WeatherSettingsSection = ({ project, onProjectUpdate, inputStyle }: Props) => {
  const mode = project.weatherSettings.forecastMode ?? "fine";

  return (
    <>
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
