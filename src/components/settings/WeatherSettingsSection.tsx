import type { CalendarProject, WeatherOverride, WeatherState, WeatherTrendKind, WindDirection } from "../../domain/types";
import { t } from "../../i18n/messages";



const weatherStates: WeatherState[] = ["clear", "cloudy", "overcast", "fog", "lightRain", "heavyRain", "storm", "snow", "strongWind", "tempest"];
const trendKinds: WeatherTrendKind[] = ["cold", "warm", "wet", "dry", "windy", "calm", "stormy", "stable", "unstable"];
const windDirections: WindDirection[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const updateOverride = (project: CalendarProject, id: string, patch: Partial<WeatherOverride>): CalendarProject => ({
  ...project,
  weatherOverrides: (project.weatherOverrides ?? []).map((o) => (o.id === id ? { ...o, ...patch } : o))
});

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
      <div style={{ marginTop: 12, borderTop: "1px solid #374151", paddingTop: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{t(project.locale, "weatherOverride.title")}</div>
        <button type="button" onClick={() => onProjectUpdate({ ...project, weatherOverrides: [...(project.weatherOverrides ?? []), { id: `wo-${Date.now()}`, absoluteDay: project.currentTime.absoluteDay }] })} style={{ border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "6px 10px", marginBottom: 8, cursor: "pointer" }}>{t(project.locale, "weatherOverride.add")}</button>
        <div style={{ display: "grid", gap: 8 }}>
          {(project.weatherOverrides ?? []).map((o) => (
            <div key={o.id} style={{ border: "1px solid #374151", borderRadius: 6, padding: 8 }}>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.absoluteDay")}</div><input type="number" value={o.absoluteDay} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{absoluteDay:Math.trunc(Number(e.target.value)||0)}))} style={inputStyle} /></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.label")}</div><input value={o.label ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{label:e.target.value}))} style={inputStyle} /></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.state")}</div><select value={o.state ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{state:(e.target.value||undefined) as WeatherState|undefined}))} style={inputStyle}><option value="" />{weatherStates.map(s=><option key={s} value={s}>{t(project.locale,`weather.state.${s}`)}</option>)}</select></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.dominantState")}</div><select value={o.dominantState ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{dominantState:(e.target.value||undefined) as WeatherState|undefined}))} style={inputStyle}><option value="" />{weatherStates.map(s=><option key={s} value={s}>{t(project.locale,`weather.state.${s}`)}</option>)}</select></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weather.trend")}</div><select value={o.trendKind ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{trendKind:(e.target.value||undefined) as WeatherTrendKind|undefined}))} style={inputStyle}><option value="" />{trendKinds.map(s=><option key={s} value={s}>{t(project.locale,`weather.trend.${s}`)}</option>)}</select></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.temperature")}</div><input type="number" value={o.temperature ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{temperature:e.target.value===""?undefined:Number(e.target.value)}))} style={inputStyle} /></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.minMax")}</div><div style={{ display:"flex", gap:6 }}><input type="number" value={o.dailyMinTemperature ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{dailyMinTemperature:e.target.value===""?undefined:Number(e.target.value)}))} style={inputStyle} /><input type="number" value={o.dailyMaxTemperature ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{dailyMaxTemperature:e.target.value===""?undefined:Number(e.target.value)}))} style={inputStyle} /></div></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.rain")}</div><div style={{ display:"flex", gap:6 }}><input type="number" value={o.rain ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{rain:e.target.value===""?undefined:Number(e.target.value)}))} style={inputStyle} /><input type="number" value={o.dailyRainTotal ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{dailyRainTotal:e.target.value===""?undefined:Number(e.target.value)}))} style={inputStyle} /></div></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.wind")}</div><input type="number" value={o.windSpeed ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{windSpeed:e.target.value===""?undefined:Number(e.target.value)}))} style={inputStyle} /></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.windDirection")}</div><select value={o.windDirection ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{windDirection:(e.target.value||undefined) as WindDirection|undefined}))} style={inputStyle}><option value="" />{windDirections.map(d=><option key={d} value={d}>{d}</option>)}</select></label>
              <label style={{ display: "block" }}><div style={{ fontSize: 12 }}>{t(project.locale, "weatherOverride.gmNote")}</div><textarea value={o.gmNote ?? ""} onChange={(e)=>onProjectUpdate(updateOverride(project,o.id,{gmNote:e.target.value}))} style={{...inputStyle,minHeight:50}} /></label>
              <button type="button" onClick={()=>onProjectUpdate({...project, weatherOverrides:(project.weatherOverrides??[]).filter(x=>x.id!==o.id)})} style={{ border:"1px solid #7f1d1d", borderRadius:6, background:"#1f2937", color:"#fecaca", padding:"6px 10px" }}>{t(project.locale, "weatherOverride.delete")}</button>
            </div>
          ))}
        </div>
      </div>

    </>
  );
};