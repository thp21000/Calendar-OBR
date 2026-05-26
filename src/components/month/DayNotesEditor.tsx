import { useState } from "react";
import { addDayNote, createDefaultDayNote, deleteDayNote, updateDayNote } from "../../calendar/dayNotesLogic";
import type { DayNote, CalendarDate, CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { Badge, DangerButton, EmptyState, Panel, PrimaryButton, SecondaryButton, TextareaInput, Toolbar } from "../ui";

const normalizeVisibility = (playerNote: string): "gm" | "players" => (playerNote.trim() ? "players" : "gm");

export const DayNotesEditor = ({ project, date, notes, onProjectUpdate }: { project: CalendarProject; date: CalendarDate; notes: DayNote[]; onProjectUpdate?: (project: CalendarProject) => void }) => {
  const [drafts, setDrafts] = useState<Record<string, { gmNote: string; playerNote: string }>>({});
  const [creating, setCreating] = useState(false);
  const [newDraft, setNewDraft] = useState({ gmNote: "", playerNote: "" });
  if (!onProjectUpdate) return null;

  return (
    <>
      {notes.length === 0 ? <EmptyState text={t(project.locale, "dayNotes.noNotes")} /> : notes.map((note) => {
        const draft = drafts[note.id] ?? { gmNote: note.gmNote ?? "", playerNote: note.playerNote ?? "" };
        const isEditing = !!drafts[note.id];
        return (
          <Panel key={note.id} style={{ fontSize: 12, marginBottom: 6 }}>
            <div style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {isEditing ? <Badge tone="warning">{t(project.locale, "dayNotes.editing")}</Badge> : null}
              <Badge>{t(project.locale, "dayNotes.gmNote")}</Badge>
              <Badge tone="success">{t(project.locale, "dayNotes.playerNote")}</Badge>
            </div>
            <label style={{ display: "grid", gap: 3, marginBottom: 6 }}>
              <span><strong>{t(project.locale, "dayNotes.gmNote")}:</strong></span>
              <TextareaInput value={draft.gmNote} onChange={(e) => setDrafts((prev) => ({ ...prev, [note.id]: { ...draft, gmNote: e.target.value } }))} rows={2} style={{ resize: "vertical" }} placeholder={t(project.locale, "dayNotes.emptyGmNote")} />
            </label>
            <label style={{ display: "grid", gap: 3, marginBottom: 6 }}>
              <span><strong>{t(project.locale, "dayNotes.playerNote")}:</strong></span>
              <TextareaInput value={draft.playerNote} onChange={(e) => setDrafts((prev) => ({ ...prev, [note.id]: { ...draft, playerNote: e.target.value } }))} rows={2} style={{ resize: "vertical" }} placeholder={t(project.locale, "dayNotes.emptyPlayerNote")} />
            </label>
            <Toolbar>
              <PrimaryButton type="button" onClick={() => onProjectUpdate(updateDayNote(project, note.id, { gmNote: draft.gmNote, playerNote: draft.playerNote, visibility: normalizeVisibility(draft.playerNote) }))}>{t(project.locale, "dayNotes.save")}</PrimaryButton>
              <SecondaryButton type="button" onClick={() => setDrafts((prev) => { const next = { ...prev }; delete next[note.id]; return next; })}>{t(project.locale, "dayNotes.cancel")}</SecondaryButton>
              {!isEditing ? <SecondaryButton type="button" onClick={() => setDrafts((prev) => ({ ...prev, [note.id]: { gmNote: note.gmNote ?? "", playerNote: note.playerNote ?? "" } }))}>{t(project.locale, "dayNotes.edit")}</SecondaryButton> : null}
              <DangerButton type="button" onClick={() => { if (confirm(t(project.locale, "dayNotes.confirmDelete"))) onProjectUpdate(deleteDayNote(project, note.id)); }}>{t(project.locale, "dayNotes.delete")}</DangerButton>
            </Toolbar>
          </Panel>
        );
      })}
      {!creating ? <SecondaryButton type="button" style={{ marginTop: 4 }} onClick={() => setCreating(true)}>{t(project.locale, "dayNotes.new")}</SecondaryButton> : (
        <Panel style={{ marginTop: 6 }}>
          <div style={{ marginBottom: 4, fontSize: 12 }}><strong>{t(project.locale, "dayNotes.create")}</strong></div>
          <label style={{ display: "grid", gap: 3, marginBottom: 6 }}>
            <span><strong>{t(project.locale, "dayNotes.gmNote")}:</strong></span>
            <TextareaInput value={newDraft.gmNote} onChange={(e) => setNewDraft((prev) => ({ ...prev, gmNote: e.target.value }))} rows={2} style={{ resize: "vertical" }} placeholder={t(project.locale, "dayNotes.emptyGmNote")} />
          </label>
          <label style={{ display: "grid", gap: 3, marginBottom: 6 }}>
            <span><strong>{t(project.locale, "dayNotes.playerNote")}:</strong></span>
            <TextareaInput value={newDraft.playerNote} onChange={(e) => setNewDraft((prev) => ({ ...prev, playerNote: e.target.value }))} rows={2} style={{ resize: "vertical" }} placeholder={t(project.locale, "dayNotes.emptyPlayerNote")} />
          </label>
          <Toolbar>
            <PrimaryButton type="button" onClick={() => {
              const base = createDefaultDayNote(project, date);
              onProjectUpdate(addDayNote(project, { ...base, gmNote: newDraft.gmNote, playerNote: newDraft.playerNote, visibility: normalizeVisibility(newDraft.playerNote) }));
              setCreating(false);
              setNewDraft({ gmNote: "", playerNote: "" });
            }}>{t(project.locale, "dayNotes.save")}</PrimaryButton>
            <SecondaryButton type="button" onClick={() => { setCreating(false); setNewDraft({ gmNote: "", playerNote: "" }); }}>{t(project.locale, "dayNotes.cancel")}</SecondaryButton>
          </Toolbar>
        </Panel>
      )}
    </>
  );
};