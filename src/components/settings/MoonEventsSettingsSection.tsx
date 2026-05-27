import { useState } from "react";
import { addMoonEvent, createDefaultMoonEvent, deleteMoonEvent, updateMoonEvent } from "../../calendar/moonEventsLogic";
import type { CalendarProject, MoonPhaseId } from "../../domain/types";
import { t } from "../../i18n/messages";

export const MoonEventsSettingsSection = ({ project, onProjectUpdate, inputStyle }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; inputStyle: React.CSSProperties; }) => {
  const [editingMoonEventId, setEditingMoonEventId] = useState<string | null>(null);
  const phases: MoonPhaseId[] = ["new", "waxingCrescent", "firstQuarter", "waxingGibbous", "full", "waningGibbous", "lastQuarter", "waningCrescent"];
  const handleAddMoonEvent = () => {
    const event = createDefaultMoonEvent(project);
    onProjectUpdate(addMoonEvent(project, event));
    setEditingMoonEventId(event.id);
  };

  return <>
    <button type="button" onClick={handleAddMoonEvent} style={buttonStyle}>{t(project.locale, "moonEvents.add")}</button>
    {project.moons.length === 0 ? <div style={{ fontSize: 12, color: "#fca5a5", marginTop: 6 }}>{t(project.locale, "moonEvents.noMoonAvailable")}</div> : null}
    {(project.moonEvents ?? []).length === 0 ? <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>{t(project.locale, "moonEvents.empty")}</div> : null}
    <div style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        {t(project.locale, "moonEvents.listTitle")} ({(project.moonEvents ?? []).length})
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {(project.moonEvents ?? []).map((event) => {
          const moon = project.moons.find((moonItem) => moonItem.id === event.moonId);
          if (editingMoonEventId !== event.id) {
            return <div key={event.id} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <span>{event.icon || "🌕"}</span>
                  <strong style={{ overflowWrap: "anywhere" }}>{event.name}</strong>
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span style={badgeStyle}>{event.enabled ? t(project.locale, "moonEvents.enabled") : t(project.locale, "moonEvents.disabled")}</span>
                  <span style={badgeStyle}>{formatMoonEventVisibility(project, event.visibility)}</span>
                </div>
              </div>
              <div style={metaStyle}>
                {moon?.name ?? t(project.locale, "moonEvents.unknownMoon")} · {t(project.locale, `moon.phase.${event.phaseId}`)}
              </div>
              <div style={summaryStyle}>
                {event.summary?.trim() ? event.summary : t(project.locale, "moonEvents.noSummary")}
              </div>
              <div style={actionsStyle}>
                <button type="button" onClick={() => setEditingMoonEventId(event.id)} style={buttonStyle}>
                  {t(project.locale, "events.edit")}
                </button>
                <button type="button" onClick={() => { if (confirm(t(project.locale, "moonEvents.confirmDelete"))) onProjectUpdate(deleteMoonEvent(project, event.id)); }} style={buttonStyle}>
                  {t(project.locale, "moonEvents.delete")}
                </button>
              </div>
            </div>;
          }
          return <div key={event.id} style={cardStyle}>
            <input value={event.name} onChange={(e) => onProjectUpdate(updateMoonEvent(project, event.id, { name: e.target.value }))} style={inputStyle} />
            <input value={event.icon ?? ""} onChange={(e) => onProjectUpdate(updateMoonEvent(project, event.id, { icon: e.target.value }))} style={inputStyle} />
            <input value={event.summary} onChange={(e) => onProjectUpdate(updateMoonEvent(project, event.id, { summary: e.target.value }))} style={inputStyle} />
            <select value={event.moonId} onChange={(e) => onProjectUpdate(updateMoonEvent(project, event.id, { moonId: e.target.value }))} style={inputStyle}>{project.moons.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
            <select value={event.phaseId} onChange={(e) => onProjectUpdate(updateMoonEvent(project, event.id, { phaseId: e.target.value as MoonPhaseId }))} style={inputStyle}>{phases.map((p) => <option key={p} value={p}>{t(project.locale, `moon.phase.${p}`)}</option>)}</select>
            <select value={event.visibility} onChange={(e) => onProjectUpdate(updateMoonEvent(project, event.id, { visibility: e.target.value as "gm" | "players" | "revealOnTrigger" }))} style={inputStyle}><option value="gm">{t(project.locale, "events.visibilityGm")}</option><option value="players">{t(project.locale, "events.visibilityPlayers")}</option><option value="revealOnTrigger">{t(project.locale, "events.visibilityRevealOnTrigger")}</option></select>
            <label><input type="checkbox" checked={event.enabled} onChange={(e) => onProjectUpdate(updateMoonEvent(project, event.id, { enabled: e.target.checked }))} /> {t(project.locale, "moonEvents.enabled")}</label>
            <label><input type="checkbox" checked={event.notifyOnTrigger} onChange={(e) => onProjectUpdate(updateMoonEvent(project, event.id, { notifyOnTrigger: e.target.checked }))} /> {t(project.locale, "moonEvents.notifyOnTrigger")}</label>
            <div style={actionsStyle}>
              <button type="button" onClick={() => setEditingMoonEventId(null)} style={buttonStyle}>{t(project.locale, "common.close")}</button>
              <button type="button" onClick={() => { if (confirm(t(project.locale, "moonEvents.confirmDelete"))) onProjectUpdate(deleteMoonEvent(project, event.id)); }} style={buttonStyle}>{t(project.locale, "moonEvents.delete")}</button>
            </div>
          </div>;
        })}
      </div>
    </div>
  </>;
};

const formatMoonEventVisibility = (
  project: CalendarProject,
  visibility: "gm" | "players" | "revealOnTrigger"
): string => {
  if (visibility === "gm") return t(project.locale, "events.visibilityGm");
  if (visibility === "players") return t(project.locale, "events.visibilityPlayers");
  return t(project.locale, "events.visibilityRevealOnTrigger");
};

const buttonStyle = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "6px 10px", cursor: "pointer" };
const sectionStyle = { border: "1px solid #374151", borderRadius: 8, padding: 8, marginTop: 8, background: "#0f172a" };
const sectionHeaderStyle = { fontWeight: 700, marginBottom: 8, fontSize: 13 };
const cardStyle = { border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827" };
const cardHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 };
const badgeStyle = { border: "1px solid #374151", borderRadius: 999, padding: "2px 6px", fontSize: 11, color: "#cbd5e1", background: "#1f2937" };
const metaStyle = { fontSize: 12, color: "#cbd5e1", marginBottom: 4 };
const summaryStyle = { fontSize: 12, color: "#d1d5db", marginBottom: 6, whiteSpace: "pre-wrap" as const };
const actionsStyle = { display: "flex", gap: 6, flexWrap: "wrap" as const };