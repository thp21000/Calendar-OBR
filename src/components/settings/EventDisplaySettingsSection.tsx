import { normalizeEventDisplaySettings } from "../../calendar/eventDisplayLogic";
import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";

type Props = {
  project: CalendarProject;
  onProjectUpdate: (project: CalendarProject) => void;
  inputStyle: React.CSSProperties;
};

const infoIconStyle: React.CSSProperties = { fontSize: 12, color: "#93c5fd", cursor: "help", marginLeft: 4 };
const fieldStyle: React.CSSProperties = { display: "block", fontSize: 12 };
const checkLabelStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, fontSize: 12 };
const gridStyle: React.CSSProperties = { display: "grid", gap: 8 };

const FieldLabel = ({ label, help }: { label: string; help: string }) => (
  <span>{label}<span title={help} style={infoIconStyle}>ⓘ</span></span>
);

export const EventDisplaySettingsSection = ({ project, onProjectUpdate, inputStyle }: Props) => {
  const settings = normalizeEventDisplaySettings(project.eventDisplaySettings);
  const update = (patch: Partial<typeof settings>) => onProjectUpdate({ ...project, eventDisplaySettings: normalizeEventDisplaySettings({ ...settings, ...patch }) });

  return (
    <div style={gridStyle}>
      <label style={checkLabelStyle}>
        <input type="checkbox" checked={settings.weatherFamilyArbitrationEnabled} onChange={(event) => update({ weatherFamilyArbitrationEnabled: event.target.checked })} />
        <FieldLabel label={t(project.locale, "eventDisplay.weatherFamilyArbitration")} help={t(project.locale, "eventDisplay.help.weatherFamilyArbitration")} />
      </label>
      <label style={checkLabelStyle}>
        <input type="checkbox" checked={settings.weatherDisplayLimitEnabled} onChange={(event) => update({ weatherDisplayLimitEnabled: event.target.checked })} />
        <FieldLabel label={t(project.locale, "eventDisplay.weatherLimit")} help={t(project.locale, "eventDisplay.help.weatherLimit")} />
      </label>
      {settings.weatherDisplayLimitEnabled ? <label style={fieldStyle}>
        <FieldLabel label={t(project.locale, "eventDisplay.maxVisibleWeather")} help={t(project.locale, "eventDisplay.help.maxVisibleWeather")} />
        <input type="number" min={1} max={20} value={settings.maxVisibleWeatherEvents} onChange={(event) => update({ maxVisibleWeatherEvents: Number(event.target.value) })} style={inputStyle} />
      </label> : null}
      <label style={checkLabelStyle}>
        <input type="checkbox" checked={settings.weatherAntiRepeatEnabled} onChange={(event) => update({ weatherAntiRepeatEnabled: event.target.checked })} />
        <FieldLabel label={t(project.locale, "eventDisplay.weatherAntiRepeat")} help={t(project.locale, "eventDisplay.help.weatherAntiRepeat")} />
      </label>
      {settings.weatherAntiRepeatEnabled ? <label style={fieldStyle}>
        <FieldLabel label={t(project.locale, "eventDisplay.weatherAntiRepeatHours")} help={t(project.locale, "eventDisplay.help.weatherAntiRepeatHours")} />
        <input type="number" min={1} value={settings.weatherAntiRepeatWindowHours} onChange={(event) => update({ weatherAntiRepeatWindowHours: Number(event.target.value) })} style={inputStyle} />
      </label> : null}
      <label style={checkLabelStyle}>
        <input type="checkbox" checked={settings.lunarPhaseArbitrationEnabled} onChange={(event) => update({ lunarPhaseArbitrationEnabled: event.target.checked })} />
        <FieldLabel label={t(project.locale, "eventDisplay.lunarPhaseArbitration")} help={t(project.locale, "eventDisplay.help.lunarPhaseArbitration")} />
      </label>
      <label style={checkLabelStyle}>
        <input type="checkbox" checked={settings.lunarDisplayLimitEnabled} onChange={(event) => update({ lunarDisplayLimitEnabled: event.target.checked })} />
        <FieldLabel label={t(project.locale, "eventDisplay.lunarLimit")} help={t(project.locale, "eventDisplay.help.lunarLimit")} />
      </label>
      {settings.lunarDisplayLimitEnabled ? <label style={fieldStyle}>
        <FieldLabel label={t(project.locale, "eventDisplay.maxVisibleLunar")} help={t(project.locale, "eventDisplay.help.maxVisibleLunar")} />
        <input type="number" min={1} max={20} value={settings.maxVisibleLunarEventsPerPhase} onChange={(event) => update({ maxVisibleLunarEventsPerPhase: Number(event.target.value) })} style={inputStyle} />
      </label> : null}
      <label style={checkLabelStyle}>
        <input type="checkbox" checked={settings.lunarAntiRepeatEnabled} onChange={(event) => update({ lunarAntiRepeatEnabled: event.target.checked })} />
        <FieldLabel label={t(project.locale, "eventDisplay.lunarAntiRepeat")} help={t(project.locale, "eventDisplay.help.lunarAntiRepeat")} />
      </label>
      {settings.lunarAntiRepeatEnabled ? <label style={fieldStyle}>
        <FieldLabel label={t(project.locale, "eventDisplay.lunarAntiRepeatHours")} help={t(project.locale, "eventDisplay.help.lunarAntiRepeatHours")} />
        <input type="number" min={1} value={settings.lunarAntiRepeatWindowHours} onChange={(event) => update({ lunarAntiRepeatWindowHours: Number(event.target.value) })} style={inputStyle} />
      </label> : null}
    </div>
  );
};
