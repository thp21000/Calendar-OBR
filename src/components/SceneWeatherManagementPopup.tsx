import { useEffect, useState, type CSSProperties } from "react";
import type { CalendarProject, SceneWeatherProfile, SceneWeatherSceneState } from "../domain/types";
import { applySceneWeatherProfile, disableSceneWeatherForScene, isSceneWeatherProfileEmpty } from "../calendar/sceneWeather";
import { toAbsoluteMinutes } from "../calendar/weatherEventsLogic";
import { t } from "../i18n/messages";
import { clearSceneWeatherState, getCurrentObrSceneInfo, getSceneWeatherState, setSceneWeatherState, type ObrSceneInfo } from "../obr/sceneWeatherMetadata";

export const SceneWeatherManagementPopup = ({ project, onProjectUpdate, onClose }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; onClose: () => void }) => {
  const [sceneInfo, setSceneInfo] = useState<ObrSceneInfo | undefined>();
  const [sceneState, setSceneState] = useState<SceneWeatherSceneState | undefined>();
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const enabledProfiles = (project.sceneWeatherProfiles ?? []).filter((profile) => profile.enabled);
  const selectedProfile = enabledProfiles.find((profile) => profile.id === selectedProfileId);
  const sceneId = sceneInfo?.id ?? "local-scene";
  const sceneName = sceneInfo?.name;

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const [info, state] = await Promise.all([getCurrentObrSceneInfo(), getSceneWeatherState()]);
      if (!mounted) return;
      setSceneInfo(info);
      setSceneState(state);
      setSelectedProfileId(state?.profileId ?? enabledProfiles[0]?.id ?? "");
    })();
    return () => { mounted = false; };
  }, []);

  const saveForScene = async (profile: SceneWeatherProfile | undefined) => {
    if (!profile) return;
    const nextState: SceneWeatherSceneState = {
      ...(sceneState ?? {}),
      profileId: profile.id,
      profileName: profile.name,
      profileIcon: profile.icon,
      isActive: false
    };
    await setSceneWeatherState(nextState);
    setSceneState(nextState);
  };

  const applyNow = async (profile: SceneWeatherProfile | undefined) => {
    if (!profile) return;
    const nextProject = applySceneWeatherProfile(project, profile, { sceneId, sceneName });
    onProjectUpdate(nextProject);
    const now = toAbsoluteMinutes(project.currentTime);
    const nextState: SceneWeatherSceneState = { profileId: profile.id, profileName: profile.name, profileIcon: profile.icon, isActive: true, lastAppliedAtMinutes: now };
    await setSceneWeatherState(nextState);
    setSceneState(nextState);
  };

  const backToAutomatic = async () => {
    onProjectUpdate(disableSceneWeatherForScene(project, sceneId));
    const nextState = sceneState?.profileId ? { ...sceneState, isActive: false } : undefined;
    if (nextState) await setSceneWeatherState(nextState);
    setSceneState(nextState);
  };

  const disableForScene = async () => {
    onProjectUpdate(disableSceneWeatherForScene(project, sceneId));
    await clearSceneWeatherState();
    setSceneState(undefined);
    setSelectedProfileId(enabledProfiles[0]?.id ?? "");
  };

  return <div style={overlayStyle} role="dialog" aria-modal="true">
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>{t(project.locale, "sceneWeather.title")}</h2>
        <button type="button" onClick={onClose} style={ghostButtonStyle}>{t(project.locale, "common.close")}</button>
      </div>
      <div style={statusStyle}><strong>{t(project.locale, "sceneWeather.currentScene")}:</strong> {sceneInfo ? (sceneInfo.name ?? t(project.locale, "common.gm")) : t(project.locale, "sceneWeather.noSceneDetected")}</div>
      <div style={statusStyle}><strong>{t(project.locale, "sceneWeather.sceneProfile")}:</strong> {sceneState?.profileId ? `${sceneState.profileIcon ?? "🎬"} ${sceneState.profileName ?? sceneState.profileId}` : t(project.locale, "sceneWeather.noSceneProfile")}</div>
      <div style={statusStyle}><strong>{t(project.locale, "weatherOverride.state")}:</strong> {sceneState?.isActive ? t(project.locale, "sceneWeather.activeForScene") : sceneState?.profileId ? t(project.locale, "sceneWeather.inactiveForScene") : t(project.locale, "sceneWeather.automaticWeather")}</div>
      <label style={{ display: "block", marginTop: 10 }}>
        <div style={{ fontSize: 12, marginBottom: 4 }}>{t(project.locale, "sceneWeather.title")}</div>
        <select value={selectedProfileId} onChange={(event) => setSelectedProfileId(event.target.value)} style={inputStyle}>
          <option value="">{t(project.locale, "common.none")}</option>
          {enabledProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.icon ?? "🎬"} {profile.name}</option>)}
        </select>
      </label>
      {selectedProfile && isSceneWeatherProfileEmpty(selectedProfile) ? <div style={{ color: "#fbbf24", fontSize: 12 }}>{t(project.locale, "sceneWeather.emptyProfileWarning")}</div> : null}
      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={() => saveForScene(selectedProfile)} disabled={!selectedProfile} style={buttonStyle} title={t(project.locale, "sceneWeather.help.saveForScene")}>{t(project.locale, "sceneWeather.saveForScene")}</button>
        <button type="button" onClick={() => applyNow(selectedProfile)} disabled={!selectedProfile} style={buttonStyle} title={t(project.locale, "sceneWeather.help.applyNow")}>{t(project.locale, "sceneWeather.applyNow")}</button>
        <button type="button" onClick={backToAutomatic} style={buttonStyle} title={t(project.locale, "sceneWeather.help.backToAutomatic")}>{t(project.locale, "sceneWeather.backToAutomatic")}</button>
        <button type="button" onClick={disableForScene} style={dangerButtonStyle}>{t(project.locale, "sceneWeather.disableForScene")}</button>
      </div>
    </div>
  </div>;
};

export const SceneWeatherApplyPrompt = ({ project, state, onYes, onNo }: { project: CalendarProject; state: SceneWeatherSceneState; onYes: () => void; onNo: () => void }) => (
  <div style={overlayStyle} role="dialog" aria-modal="true">
    <div style={panelStyle}>
      <h2 style={{ marginTop: 0, fontSize: 16 }}>{t(project.locale, "sceneWeather.applyPromptTitle")}</h2>
      <p style={{ fontSize: 13, color: "#d1d5db" }}>{t(project.locale, "sceneWeather.applyPromptBody")}<br /><strong>{state.profileIcon ?? "🎬"} {state.profileName ?? state.profileId}</strong></p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={onYes} style={buttonStyle}>{t(project.locale, "sceneWeather.applyPromptYes")}</button>
        <button type="button" onClick={onNo} style={ghostButtonStyle}>{t(project.locale, "sceneWeather.applyPromptNo")}</button>
      </div>
    </div>
  </div>
);

const overlayStyle: CSSProperties = { position: "fixed", inset: 0, zIndex: 50, background: "rgba(3,7,18,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 };
const panelStyle: CSSProperties = { width: "min(420px, 100%)", maxHeight: "85vh", overflowY: "auto", background: "#111827", border: "1px solid #374151", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,.45)", padding: 14, color: "#e5e7eb" };
const inputStyle: CSSProperties = { width: "100%", margin: "4px 0 8px", background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 6, padding: "6px 8px", boxSizing: "border-box" };
const buttonStyle: CSSProperties = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "7px 10px", cursor: "pointer" };
const ghostButtonStyle: CSSProperties = { ...buttonStyle, background: "transparent" };
const dangerButtonStyle: CSSProperties = { ...buttonStyle, borderColor: "#7f1d1d", color: "#fecaca" };
const statusStyle: CSSProperties = { fontSize: 12, color: "#d1d5db", margin: "4px 0" };
