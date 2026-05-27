import { useState } from "react";
import type { CalendarProject, MoonEvent, MoonPhaseId } from "../../domain/types";
import { t } from "../../i18n/messages";

const phases: MoonPhaseId[] = ["new", "waxingCrescent", "firstQuarter", "waxingGibbous", "full", "waningGibbous", "lastQuarter", "waningCrescent"];

export const MoonEventForm = ({ project, event, mode, onSubmit, onCancel }: { project: CalendarProject; event: MoonEvent; mode: "create" | "edit"; onSubmit: (event: MoonEvent) => void; onCancel: () => void }) => {
  const [draft, setDraft] = useState<MoonEvent>(event);

  return <div>
    <label style={label}>{t(project.locale, "moonEvents.name")}</label>
    <input value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} style={inputStyle} />

    <label style={label}>{t(project.locale, "moonEvents.icon")}</label>
    <input value={draft.icon ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, icon: e.target.value }))} style={inputStyle} />

    <label style={label}>{t(project.locale, "moonEvents.summary")}</label>
    <input value={draft.summary} onChange={(e) => setDraft((prev) => ({ ...prev, summary: e.target.value }))} style={inputStyle} />

    <label style={label}>{t(project.locale, "moonEvents.moon")}</label>
    <select value={draft.moonId} onChange={(e) => setDraft((prev) => ({ ...prev, moonId: e.target.value }))} style={inputStyle}>
      {project.moons.map((moon) => <option key={moon.id} value={moon.id}>{moon.name}</option>)}
    </select>

    <label style={label}>{t(project.locale, "moonEvents.phase")}</label>
    <select value={draft.phaseId} onChange={(e) => setDraft((prev) => ({ ...prev, phaseId: e.target.value as MoonPhaseId }))} style={inputStyle}>
      {phases.map((phaseId) => <option key={phaseId} value={phaseId}>{t(project.locale, `moon.phase.${phaseId}`)}</option>)}
    </select>

    <label style={label}>{t(project.locale, "moonEvents.visibility")}</label>
    <select value={draft.visibility} onChange={(e) => setDraft((prev) => ({ ...prev, visibility: e.target.value as "gm" | "players" | "revealOnTrigger" }))} style={inputStyle}>
      <option value="gm">{t(project.locale, "events.visibilityGm")}</option>
      <option value="players">{t(project.locale, "events.visibilityPlayers")}</option>
      <option value="revealOnTrigger">{t(project.locale, "events.visibilityRevealOnTrigger")}</option>
    </select>

    <label style={checkboxLabel}><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft((prev) => ({ ...prev, enabled: e.target.checked }))} /> {t(project.locale, "moonEvents.enabled")}</label>
    <label style={checkboxLabel}><input type="checkbox" checked={draft.notifyOnTrigger} onChange={(e) => setDraft((prev) => ({ ...prev, notifyOnTrigger: e.target.checked }))} /> {t(project.locale, "moonEvents.notifyOnTrigger")}</label>

    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
      <button type="button" onClick={onCancel} style={buttonStyle}>{t(project.locale, "moonEvents.cancel")}</button>
      <button type="button" onClick={() => onSubmit(draft)} style={buttonStyle}>{mode === "create" ? t(project.locale, "moonEvents.create") : t(project.locale, "moonEvents.update")}</button>
    </div>
  </div>;
};

const inputStyle = { width: "100%", background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 6, padding: "6px 8px", fontSize: 12, boxSizing: "border-box" as const, marginBottom: 8 };
const label = { display: "block", fontSize: 12, marginBottom: 4 };
const checkboxLabel = { display: "flex", gap: 6, fontSize: 12, marginBottom: 6 };
const buttonStyle = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "6px 10px", cursor: "pointer" };
