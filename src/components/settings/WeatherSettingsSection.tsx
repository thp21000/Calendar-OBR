import type { CalendarProject, WeatherOverride, WeatherState, WeatherTrendKind, WindDirection } from "../../domain/types";
import { t } from "../../i18n/messages";
import { WEATHER_STATES } from "../../calendar/weatherStates";
import { getWeatherStateLabel, getWeatherTrendLabel } from "../../calendar/weatherAdvancedSettings";
import { fromDisplayRain, fromDisplayTemperature, fromDisplayWindSpeed, toDisplayRain, toDisplayTemperature, toDisplayWindSpeed } from "../../calendar/weatherUnits";

const weatherStates = WEATHER_STATES;
const trendKinds: WeatherTrendKind[] = ["cold", "warm", "wet", "dry", "windy", "calm", "stormy", "stable", "unstable"];
const windDirections: WindDirection[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const roundDisplay = (value: number): number => Math.round(value * 100) / 100;

const displayOptionalValue = (value: number | undefined, toDisplay: (value: number) => number): number | "" =>
  value === undefined ? "" : roundDisplay(toDisplay(value));

const readOptionalDisplayValue = (value: string, fromDisplay: (value: number) => number): number | undefined => {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? fromDisplay(parsed) : undefined;
};

const updateOverride = (project: CalendarProject, id: string, patch: Partial<WeatherOverride>): CalendarProject => ({
  ...project,
  weatherOverrides: (project.weatherOverrides ?? []).map((o) => (o.id === id ? { ...o, ...patch } : o))
});

type Props = {
  project: CalendarProject;
  onProjectUpdate: (project: CalendarProject) => void;
  inputStyle: React.CSSProperties;
  showBase?: boolean;
  showOverrides?: boolean;
};

export const WeatherSettingsSection = ({ project, onProjectUpdate, inputStyle, showBase = true, showOverrides = true }: Props) => {
  const mode = project.weatherSettings.forecastMode ?? "fine";
  const seed = project.weatherSettings.seed ?? "";

  return (
    <>
      {showBase ? <>
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
      </> : null}
      {showOverrides ? <div style={{ marginTop: showBase ? 12 : 0, borderTop: showBase ? "1px solid #374151" : undefined, paddingTop: showBase ? 8 : 0 }}>
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{t(project.locale, "weatherOverride.title")}</div>
        <button type="button" onClick={() => onProjectUpdate({ ...project, weatherOverrides: [...(project.weatherOverrides ?? []), { id: `wo-${Date.now()}`, absoluteDay: project.currentTime.absoluteDay }] })} style={{ border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "6px 10px", marginBottom: 8, cursor: "pointer" }}>{t(project.locale, "weatherOverride.add")}</button>
        <div style={{ display: "grid", gap: 8 }}>
          {(project.weatherOverrides ?? []).map((o) => (
            <div key={o.id} style={{ border: "1px solid #374151", borderRadius: 6, padding: 8 }}>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.absoluteDay")}</div><input type="number" value={o.absoluteDay} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{absoluteDay:Math.trunc(Number(e.target.value)||0)}))} style={inputStyle} /></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.label")}</div><input value={o.label ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{label:e.target.value}))} style={inputStyle} /></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.state")}</div><select value={o.state ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{state:(e.target.value||undefined) as WeatherState|undefined}))} style={inputStyle}><option value="" />{weatherStates.map(s=><option key={s} value={s}>{getWeatherStateLabel(project, s)}</option>)}</select></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.dominantState")}</div><select value={o.dominantState ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{dominantState:(e.target.value||undefined) as WeatherState|undefined}))} style={inputStyle}><option value="" />{weatherStates.map(s=><option key={s} value={s}>{getWeatherStateLabel(project, s)}</option>)}</select></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weather.trend")}</div><select value={o.trendKind ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{trendKind:(e.target.value||undefined) as WeatherTrendKind|undefined}))} style={inputStyle}><option value="" />{trendKinds.map(s=><option key={s} value={s}>{getWeatherTrendLabel(project, s)}</option>)}</select></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.temperature")}</div><input type="number" value={displayOptionalValue(o.temperature, (value) => toDisplayTemperature(value, project.units.temperature))} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{temperature:readOptionalDisplayValue(e.target.value, (value) => fromDisplayTemperature(value, project.units.temperature))}))} style={inputStyle} /></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.minMax")}</div><div style={{ display:"flex", gap:6 }}><input type="number" value={displayOptionalValue(o.dailyMinTemperature, (value) => toDisplayTemperature(value, project.units.temperature))} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{dailyMinTemperature:readOptionalDisplayValue(e.target.value, (value) => fromDisplayTemperature(value, project.units.temperature))}))} style={inputStyle} /><input type="number" value={displayOptionalValue(o.dailyMaxTemperature, (value) => toDisplayTemperature(value, project.units.temperature))} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{dailyMaxTemperature:readOptionalDisplayValue(e.target.value, (value) => fromDisplayTemperature(value, project.units.temperature))}))} style={inputStyle} /></div></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.rain")}</div><div style={{ display:"flex", gap:6 }}><input type="number" value={displayOptionalValue(o.rain, (value) => toDisplayRain(value, project.units.rain))} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{rain:readOptionalDisplayValue(e.target.value, (value) => fromDisplayRain(value, project.units.rain))}))} style={inputStyle} /><input type="number" value={displayOptionalValue(o.dailyRainTotal, (value) => toDisplayRain(value, project.units.rain))} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{dailyRainTotal:readOptionalDisplayValue(e.target.value, (value) => fromDisplayRain(value, project.units.rain))}))} style={inputStyle} /></div></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.wind")}</div><input type="number" value={displayOptionalValue(o.windSpeed, (value) => toDisplayWindSpeed(value, project.units.windSpeed))} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{windSpeed:readOptionalDisplayValue(e.target.value, (value) => fromDisplayWindSpeed(value, project.units.windSpeed))}))} style={inputStyle} /></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.windDirection")}</div><select value={o.windDirection ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{windDirection:(e.target.value||undefined) as WindDirection|undefined}))} style={inputStyle}><option value="" />{windDirections.map(d=><option key={d} value={d}>{d}</option>)}</select></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.gmNote")}</div><textarea value={o.gmNote ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{gmNote:e.target.value}))} style={{...inputStyle,minHeight:50}} /></label>
              <button type="button" onClick={()=>onProjectUpdate({...project, weatherOverrides:(project.weatherOverrides??[]).filter(x=>x.id!==o.id)})} style={{ border:"1px solid #7f1d1d", borderRadius:6, background:"#1f2937", color:"#fecaca", padding:"6px 10px" }}>{t(project.locale, "weatherOverride.delete")}</button>
            </div>
          ))}
        </div>
      </div> : null}

    </>
  );
};