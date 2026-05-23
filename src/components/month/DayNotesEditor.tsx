import { useState } from "react";
import { addDayNote, createDefaultDayNote, deleteDayNote, updateDayNote } from "../../calendar/dayNotesLogic";
import type { DayNote, CalendarDate, CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";

const normalizeVisibility = (playerNote: string): "gm" | "players" => (playerNote.trim() ? "players" : "gm");

export const DayNotesEditor = ({ project, date, notes, onProjectUpdate }: { project: CalendarProject; date: CalendarDate; notes: DayNote[]; onProjectUpdate?: (project: CalendarProject) => void }) => {
  const [drafts, setDrafts] = useState<Record<string, { gmNote: string; playerNote: string }>>({});
  const [creating, setCreating] = useState(false);
  const [newDraft, setNewDraft] = useState({ gmNote: "", playerNote: "" });
  if (!onProjectUpdate) return null;

  return (
    <>
      {notes.length === 0 ? <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "dayNotes.noNotes")}</div> : notes.map((note) => {
        const draft = drafts[note.id] ?? { gmNote: note.gmNote ?? "", playerNote: note.playerNote ?? "" };
        const isEditing = !!drafts[note.id];
        return (
          <div key={note.id} style={{ fontSize: 12, border: "1px solid #374151", borderRadius: 6, padding: 6, marginBottom: 6, background: "#0f172a" }}>
            <div style={{ marginBottom: 4, color: "#93c5fd" }}>{isEditing ? t(project.locale, "dayNotes.editing") : ""}</div>
            <label style={{ display: "grid", gap: 3, marginBottom: 6 }}>
              <span><strong>{t(project.locale, "dayNotes.gmNote")}:</strong></span>
              <textarea value={draft.gmNote} onChange={(e) => setDrafts((prev) => ({ ...prev, [note.id]: { ...draft, gmNote: e.target.value } }))} rows={2} style={{ width: "100%", resize: "vertical" }} placeholder={t(project.locale, "dayNotes.emptyGmNote")} />
            </label>
            <label style={{ display: "grid", gap: 3, marginBottom: 6 }}>
              <span><strong>{t(project.locale, "dayNotes.playerNote")}:</strong></span>
              <textarea value={draft.playerNote} onChange={(e) => setDrafts((prev) => ({ ...prev, [note.id]: { ...draft, playerNote: e.target.value } }))} rows={2} style={{ width: "100%", resize: "vertical" }} placeholder={t(project.locale, "dayNotes.emptyPlayerNote")} />
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button type="button" onClick={() => onProjectUpdate(updateDayNote(project, note.id, { gmNote: draft.gmNote, playerNote: draft.playerNote, visibility: normalizeVisibility(draft.playerNote) }))}>{t(project.locale, "dayNotes.save")}</button>
              <button type="button" onClick={() => setDrafts((prev) => { const next = { ...prev }; delete next[note.id]; return next; })}>{t(project.locale, "dayNotes.cancel")}</button>
              {!isEditing ? <button type="button" onClick={() => setDrafts((prev) => ({ ...prev, [note.id]: { gmNote: note.gmNote ?? "", playerNote: note.playerNote ?? "" } }))}>{t(project.locale, "dayNotes.edit")}</button> : null}
              <button type="button" onClick={() => { if (confirm(t(project.locale, "dayNotes.confirmDelete"))) onProjectUpdate(deleteDayNote(project, note.id)); }}>{t(project.locale, "dayNotes.delete")}</button>
            </div>
          </div>
        );
      })}
      {!creating ? <button type="button" style={{ marginTop: 4 }} onClick={() => setCreating(true)}>{t(project.locale, "dayNotes.new")}</button> : (
        <div style={{ marginTop: 6, border: "1px solid #374151", borderRadius: 6, padding: 6 }}>
          <div style={{ marginBottom: 4, fontSize: 12 }}><strong>{t(project.locale, "dayNotes.create")}</strong></div>
          <label style={{ display: "grid", gap: 3, marginBottom: 6 }}>
            <span><strong>{t(project.locale, "dayNotes.gmNote")}:</strong></span>
            <textarea value={newDraft.gmNote} onChange={(e) => setNewDraft((prev) => ({ ...prev, gmNote: e.target.value }))} rows={2} style={{ width: "100%", resize: "vertical" }} placeholder={t(project.locale, "dayNotes.emptyGmNote")} />
          </label>
          <label style={{ display: "grid", gap: 3, marginBottom: 6 }}>
            <span><strong>{t(project.locale, "dayNotes.playerNote")}:</strong></span>
            <textarea value={newDraft.playerNote} onChange={(e) => setNewDraft((prev) => ({ ...prev, playerNote: e.target.value }))} rows={2} style={{ width: "100%", resize: "vertical" }} placeholder={t(project.locale, "dayNotes.emptyPlayerNote")} />
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={() => {
              const base = createDefaultDayNote(project, date);
              onProjectUpdate(addDayNote(project, { ...base, gmNote: newDraft.gmNote, playerNote: newDraft.playerNote, visibility: normalizeVisibility(newDraft.playerNote) }));
              setCreating(false);
              setNewDraft({ gmNote: "", playerNote: "" });
            }}>{t(project.locale, "dayNotes.save")}</button>
            <button type="button" onClick={() => { setCreating(false); setNewDraft({ gmNote: "", playerNote: "" }); }}>{t(project.locale, "dayNotes.cancel")}</button>
          </div>
        </div>
      )}
    </>
  );
};
