import { addMoonEvent, createDefaultMoonEvent, deleteMoonEvent, updateMoonEvent } from "../../calendar/moonEventsLogic";
import type { CalendarProject, MoonPhaseId } from "../../domain/types";
import { t } from "../../i18n/messages";

export const MoonEventsSettingsSection = ({ project, onProjectUpdate, inputStyle }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; inputStyle: React.CSSProperties; }) => {
  const phases: MoonPhaseId[] = ["new", "waxingCrescent", "firstQuarter", "waxingGibbous", "full", "waningGibbous", "lastQuarter", "waningCrescent"];
  return <>
    <button type="button" onClick={() => onProjectUpdate(addMoonEvent(project, createDefaultMoonEvent(project)))} style={buttonStyle}>{t(project.locale, "moonEvents.add")}</button>
    {project.moons.length === 0 ? <div style={{ fontSize: 12, color: "#fca5a5", marginTop: 6 }}>{t(project.locale, "moonEvents.noMoonAvailable")}</div> : null}
    {(project.moonEvents ?? []).length === 0 ? <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>{t(project.locale, "moonEvents.empty")}</div> : null}
    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
      {(project.moonEvents ?? []).map((event) => <div key={event.id} style={{ border: "1px solid #374151", borderRadius: 8, padding: 8 }}>
        <input value={event.name} onChange={(e) => onProjectUpdate(updateMoonEvent(project, event.id, { name: e.target.value }))} style={inputStyle} />
        <input value={event.icon ?? ""} onChange={(e) => onProjectUpdate(updateMoonEvent(project, event.id, { icon: e.target.value }))} style={inputStyle} />
        <input value={event.summary} onChange={(e) => onProjectUpdate(updateMoonEvent(project, event.id, { summary: e.target.value }))} style={inputStyle} />
        <select value={event.moonId} onChange={(e) => onProjectUpdate(updateMoonEvent(project, event.id, { moonId: e.target.value }))} style={inputStyle}>{project.moons.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        <select value={event.phaseId} onChange={(e) => onProjectUpdate(updateMoonEvent(project, event.id, { phaseId: e.target.value as MoonPhaseId }))} style={inputStyle}>{phases.map((p) => <option key={p} value={p}>{p}</option>)}</select>
        <select value={event.visibility} onChange={(e) => onProjectUpdate(updateMoonEvent(project, event.id, { visibility: e.target.value as "gm" | "players" | "revealOnTrigger" }))} style={inputStyle}><option value="gm">GM</option><option value="players">Players</option><option value="revealOnTrigger">Reveal on trigger</option></select>
        <label><input type="checkbox" checked={event.enabled} onChange={(e) => onProjectUpdate(updateMoonEvent(project, event.id, { enabled: e.target.checked }))} /> {t(project.locale, "moonEvents.enabled")}</label>
        <label><input type="checkbox" checked={event.notifyOnTrigger} onChange={(e) => onProjectUpdate(updateMoonEvent(project, event.id, { notifyOnTrigger: e.target.checked }))} /> {t(project.locale, "moonEvents.notifyOnTrigger")}</label>
        <button type="button" onClick={() => { if (confirm(t(project.locale, "moonEvents.confirmDelete"))) onProjectUpdate(deleteMoonEvent(project, event.id)); }} style={buttonStyle}>{t(project.locale, "moonEvents.delete")}</button>
      </div>)}
    </div>
  </>;
};

const buttonStyle = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "6px 10px", cursor: "pointer" };
