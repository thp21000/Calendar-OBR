import type { CSSProperties } from "react";
import type { CalendarProject, SceneWeatherProfile, WeatherState, WeatherTrendKind, WindDirection } from "../../domain/types";
import { isSceneWeatherProfileEmpty, createDefaultSceneWeatherProfile } from "../../calendar/sceneWeather";
import { WEATHER_BIOME_DEFINITIONS } from "../../calendar/weather/biomes";
import { t } from "../../i18n/messages";
import { CollapsibleSection } from "../CollapsibleSection";

const weatherStates: WeatherState[] = ["clear", "cloudy", "overcast", "fog", "lightRain", "heavyRain", "storm", "snow", "strongWind", "tempest"];
const trendKinds: WeatherTrendKind[] = ["cold", "warm", "wet", "dry", "windy", "calm", "stormy", "stable", "unstable"];
const windDirections: WindDirection[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const smallHelp = (help: string) => <span title={help} style={{ color: "#93c5fd", cursor: "help", marginLeft: 4 }}>ⓘ</span>;
const parseOptionalNumber = (value: string): number | undefined => {
  const normalized = value.trim().replace(",", ".");
  if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const FieldLabel = ({ label, help }: { label: string; help: string }) => <div style={{ fontSize: 12 }}>{label}{smallHelp(help)}</div>;

const NumericInput = ({ label, help, value, onChange, inputStyle }: { label: string; help: string; value: number | undefined; onChange: (value: number | undefined) => void; inputStyle: CSSProperties }) => (
  <label style={{ display: "block" }}>
    <FieldLabel label={label} help={help} />
    <input inputMode="decimal" value={value ?? ""} onChange={(event) => onChange(parseOptionalNumber(event.target.value))} style={inputStyle} />
  </label>
);

const patchProfile = (project: CalendarProject, profileId: string, patch: Partial<SceneWeatherProfile>): CalendarProject => ({
  ...project,
  sceneWeatherProfiles: (project.sceneWeatherProfiles ?? []).map((profile) => profile.id === profileId ? { ...profile, ...patch } : profile)
});

const patchOverride = (project: CalendarProject, profile: SceneWeatherProfile, patch: Partial<SceneWeatherProfile["override"]>): CalendarProject =>
  patchProfile(project, profile.id, { override: { ...(profile.override ?? {}), ...patch } });

export const SceneWeatherProfilesSettingsSection = ({ project, onProjectUpdate, inputStyle }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; inputStyle: CSSProperties }) => {
  const profiles = project.sceneWeatherProfiles ?? [];
  const addProfile = () => onProjectUpdate({ ...project, sceneWeatherProfiles: [...profiles, createDefaultSceneWeatherProfile(project)] });
  const duplicateProfile = (profile: SceneWeatherProfile) => onProjectUpdate({
    ...project,
    sceneWeatherProfiles: [...profiles, { ...profile, id: `scene-weather-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: `${profile.name} ${project.locale === "fr" ? "(copie)" : "(copy)"}` }]
  });

  return <div style={{ display: "grid", gap: 8 }}>
    <button type="button" onClick={addProfile} style={buttonStyle}>{t(project.locale, "sceneWeather.addProfile")}</button>
    {profiles.length === 0 ? <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "common.empty")}</div> : null}
    {profiles.map((profile) => <div key={profile.id} style={{ border: "1px solid #374151", borderRadius: 8, padding: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 6 }}>
        <strong>{profile.icon ?? "🎬"} {profile.name}</strong>
        <label style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 12 }} title={t(project.locale, "sceneWeather.help.enabled")}><input type="checkbox" checked={profile.enabled} onChange={(event) => onProjectUpdate(patchProfile(project, profile.id, { enabled: event.target.checked }))} />{t(project.locale, "sceneWeather.enabled")}</label>
      </div>
      {isSceneWeatherProfileEmpty(profile) ? <div style={{ color: "#fbbf24", fontSize: 12, marginBottom: 6 }}>{t(project.locale, "sceneWeather.emptyProfileWarning")}</div> : null}
      <CollapsibleSection title={t(project.locale, "sceneWeather.generalSection")}>
        <label style={{ display: "block" }}><FieldLabel label={t(project.locale, "seasons.name")} help={t(project.locale, "sceneWeather.help.name")} /><input value={profile.name} onChange={(event) => onProjectUpdate(patchProfile(project, profile.id, { name: event.target.value }))} style={inputStyle} /></label>
        <label style={{ display: "block" }}><FieldLabel label={t(project.locale, "seasons.icon")} help={t(project.locale, "sceneWeather.help.icon")} /><input value={profile.icon ?? ""} onChange={(event) => onProjectUpdate(patchProfile(project, profile.id, { icon: event.target.value || undefined }))} style={inputStyle} /></label>
        <NumericInput label={t(project.locale, "sceneWeather.durationMinutes")} help={t(project.locale, "sceneWeather.help.durationMinutes")} value={profile.durationMinutes} onChange={(value) => onProjectUpdate(patchProfile(project, profile.id, { durationMinutes: value }))} inputStyle={inputStyle} />
        <NumericInput label={t(project.locale, "sceneWeather.transitionMinutes")} help={t(project.locale, "sceneWeather.help.transitionMinutes")} value={profile.transitionMinutes} onChange={(value) => onProjectUpdate(patchProfile(project, profile.id, { transitionMinutes: value }))} inputStyle={inputStyle} />
      </CollapsibleSection>
      <CollapsibleSection title={t(project.locale, "sceneWeather.biomeSection")}>
        <label style={{ display: "block" }}><FieldLabel label={t(project.locale, "sceneWeather.forceBiome")} help={t(project.locale, "sceneWeather.help.forceBiome")} />
          <select value={profile.forceBiomeId ?? ""} onChange={(event) => onProjectUpdate(patchProfile(project, profile.id, { forceBiomeId: (event.target.value || undefined) as SceneWeatherProfile["forceBiomeId"] }))} style={inputStyle}>
            <option value="">{t(project.locale, "sceneWeather.noBiomeOverride")}</option>
            {WEATHER_BIOME_DEFINITIONS.map((biome) => <option key={biome.id} value={biome.id}>{biome.icon} {t(project.locale, biome.nameKey)}</option>)}
          </select>
        </label>
      </CollapsibleSection>
      <CollapsibleSection title={t(project.locale, "sceneWeather.skySection")}>
        <label style={{ display: "block" }}><FieldLabel label={t(project.locale, "weatherOverride.state")} help={t(project.locale, "sceneWeather.help.state")} /><select value={profile.override.state ?? ""} onChange={(event) => onProjectUpdate(patchOverride(project, profile, { state: (event.target.value || undefined) as WeatherState | undefined }))} style={inputStyle}><option value="" />{weatherStates.map((state) => <option key={state} value={state}>{t(project.locale, `weather.state.${state}`)}</option>)}</select></label>
        <label style={{ display: "block" }}><FieldLabel label={t(project.locale, "weatherOverride.dominantState")} help={t(project.locale, "sceneWeather.help.dominantState")} /><select value={profile.override.dominantState ?? ""} onChange={(event) => onProjectUpdate(patchOverride(project, profile, { dominantState: (event.target.value || undefined) as WeatherState | undefined }))} style={inputStyle}><option value="" />{weatherStates.map((state) => <option key={state} value={state}>{t(project.locale, `weather.state.${state}`)}</option>)}</select></label>
        <label style={{ display: "block" }}><FieldLabel label={t(project.locale, "weather.trend")} help={t(project.locale, "sceneWeather.help.trend")} /><select value={profile.override.trendKind ?? ""} onChange={(event) => onProjectUpdate(patchOverride(project, profile, { trendKind: (event.target.value || undefined) as WeatherTrendKind | undefined }))} style={inputStyle}><option value="" />{trendKinds.map((trend) => <option key={trend} value={trend}>{t(project.locale, `weather.trend.${trend}`)}</option>)}</select></label>
      </CollapsibleSection>
      <CollapsibleSection title={t(project.locale, "sceneWeather.temperatureSection")}>
        <NumericInput label={t(project.locale, "weatherOverride.temperature")} help={t(project.locale, "sceneWeather.help.temperature")} value={profile.override.temperature} onChange={(value) => onProjectUpdate(patchOverride(project, profile, { temperature: value }))} inputStyle={inputStyle} />
        <NumericInput label={t(project.locale, "sceneWeather.dailyMinTemperature")} help={t(project.locale, "sceneWeather.help.dailyMinTemperature")} value={profile.override.dailyMinTemperature} onChange={(value) => onProjectUpdate(patchOverride(project, profile, { dailyMinTemperature: value }))} inputStyle={inputStyle} />
        <NumericInput label={t(project.locale, "sceneWeather.dailyMaxTemperature")} help={t(project.locale, "sceneWeather.help.dailyMaxTemperature")} value={profile.override.dailyMaxTemperature} onChange={(value) => onProjectUpdate(patchOverride(project, profile, { dailyMaxTemperature: value }))} inputStyle={inputStyle} />
      </CollapsibleSection>
      <CollapsibleSection title={t(project.locale, "sceneWeather.rainSection")}>
        <NumericInput label={t(project.locale, "weatherOverride.rain")} help={t(project.locale, "sceneWeather.help.rain")} value={profile.override.rain} onChange={(value) => onProjectUpdate(patchOverride(project, profile, { rain: value }))} inputStyle={inputStyle} />
        <NumericInput label={t(project.locale, "sceneWeather.dailyRainTotal")} help={t(project.locale, "sceneWeather.help.dailyRainTotal")} value={profile.override.dailyRainTotal} onChange={(value) => onProjectUpdate(patchOverride(project, profile, { dailyRainTotal: value }))} inputStyle={inputStyle} />
      </CollapsibleSection>
      <CollapsibleSection title={t(project.locale, "sceneWeather.windSection")}>
        <NumericInput label={t(project.locale, "weatherOverride.wind")} help={t(project.locale, "sceneWeather.help.windSpeed")} value={profile.override.windSpeed} onChange={(value) => onProjectUpdate(patchOverride(project, profile, { windSpeed: value }))} inputStyle={inputStyle} />
        <label style={{ display: "block" }}><FieldLabel label={t(project.locale, "weatherOverride.windDirection")} help={t(project.locale, "sceneWeather.help.windDirection")} /><select value={profile.override.windDirection ?? ""} onChange={(event) => onProjectUpdate(patchOverride(project, profile, { windDirection: (event.target.value || undefined) as WindDirection | undefined }))} style={inputStyle}><option value="" />{windDirections.map((direction) => <option key={direction} value={direction}>{direction}</option>)}</select></label>
      </CollapsibleSection>
      <CollapsibleSection title={t(project.locale, "sceneWeather.noteSection")}>
        <label style={{ display: "block" }}><FieldLabel label={t(project.locale, "weatherOverride.gmNote")} help={t(project.locale, "sceneWeather.help.gmNote")} /><textarea value={profile.override.gmNote ?? ""} onChange={(event) => onProjectUpdate(patchOverride(project, profile, { gmNote: event.target.value || undefined }))} style={{ ...inputStyle, minHeight: 56 }} /></label>
      </CollapsibleSection>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
        <button type="button" onClick={() => duplicateProfile(profile)} style={buttonStyle}>{t(project.locale, "sceneWeather.duplicateProfile")}</button>
        <button type="button" onClick={() => { if (confirm(t(project.locale, "sceneWeather.confirmDelete"))) onProjectUpdate({ ...project, sceneWeatherProfiles: profiles.filter((item) => item.id !== profile.id) }); }} style={dangerButtonStyle}>{t(project.locale, "sceneWeather.deleteProfile")}</button>
      </div>
    </div>)}
  </div>;
};

const buttonStyle: CSSProperties = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "6px 10px", cursor: "pointer" };
const dangerButtonStyle: CSSProperties = { ...buttonStyle, borderColor: "#7f1d1d", color: "#fecaca" };
