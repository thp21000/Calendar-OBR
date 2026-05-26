import { useEffect, useRef, useState } from "react";
import { addDayNote, createDefaultDayNote, deleteDayNote, updateDayNote } from "../../calendar/dayNotesLogic";
import { absoluteDayToCalendarDate, calendarDateToAbsoluteDay } from "../../calendar/dateEngine";
import type { DayNote, CalendarDate, CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { DangerButton, EmptyState, Panel, PrimaryButton, SecondaryButton, Toolbar } from "../ui";
import { sendPopupNotification } from "../../obr/popupNotifications";

const normalizeVisibility = (playerNote: string): "gm" | "players" => (playerNote.trim() ? "players" : "gm");

const AutoResizeTextarea = ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  useEffect(() => resize(), [value]);
  return <textarea ref={ref} value={value} onChange={(e) => { onChange(e.target.value); resize(); }} rows={2} placeholder={placeholder} style={{ width: "100%", resize: "none", overflow: "hidden", boxSizing: "border-box", borderRadius: 6, border: "1px solid #475569", background: "#1f2937", color: "#f3f4f6", padding: "7px 8px", fontSize: 12 }} />;
};

export const DayNotesEditor = ({ project, date, notes, onProjectUpdate }: { project: CalendarProject; date: CalendarDate; notes: DayNote[]; onProjectUpdate?: (project: CalendarProject) => void }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { gmNote: string; playerNote: string }>>({});
  const [creating, setCreating] = useState(false);
  const [newDraft, setNewDraft] = useState({ gmNote: "", playerNote: "" });
  if (!onProjectUpdate) return null;
  const displayDate = absoluteDayToCalendarDate(calendarDateToAbsoluteDay(date, project.calendarSystem), project.calendarSystem);
  const dateLabel = `${displayDate.weekdayName} ${displayDate.dayOfMonth} ${displayDate.monthName} ${displayDate.year}`;

  const beginEdit = (note: DayNote) => {
    setEditingId(note.id);
    setDrafts((prev) => ({ ...prev, [note.id]: { gmNote: note.gmNote ?? "", playerNote: note.playerNote ?? "" } }));
  };

  const cancelEdit = (noteId: string) => {
    setEditingId(null);
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[noteId];
      return next;
    });
  };

  return (
    <>
      {notes.length === 0 && !creating ? (
        <>
          <EmptyState text={t(project.locale, "dayNotes.noNotes")} />
          <SecondaryButton type="button" style={{ marginTop: 4 }} onClick={() => setCreating(true)}>{t(project.locale, "dayNotes.new")}</SecondaryButton>
        </>
      ) : null}

      {notes.map((note) => {
        const draft = drafts[note.id] ?? { gmNote: note.gmNote ?? "", playerNote: note.playerNote ?? "" };
        const isEditing = editingId === note.id;
        return (
          <Panel key={note.id} style={{ fontSize: 12, marginBottom: 6 }}>
            {isEditing ? (
              <>
                <label style={{ display: "grid", gap: 3, marginBottom: 6 }}>
                  <span><strong>{t(project.locale, "dayNotes.gmNote")}:</strong></span>
                  <AutoResizeTextarea value={draft.gmNote} onChange={(value) => setDrafts((prev) => ({ ...prev, [note.id]: { ...draft, gmNote: value } }))} placeholder={t(project.locale, "dayNotes.emptyGmNote")} />
                </label>
                <label style={{ display: "grid", gap: 3, marginBottom: 6 }}>
                  <span><strong>{t(project.locale, "dayNotes.playerNote")}:</strong></span>
                  <AutoResizeTextarea value={draft.playerNote} onChange={(value) => setDrafts((prev) => ({ ...prev, [note.id]: { ...draft, playerNote: value } }))} placeholder={t(project.locale, "dayNotes.emptyPlayerNote")} />
                </label>
                <Toolbar>
                  <PrimaryButton type="button" onClick={() => {
                    onProjectUpdate(updateDayNote(project, note.id, { gmNote: draft.gmNote, playerNote: draft.playerNote, visibility: normalizeVisibility(draft.playerNote) }));
                    cancelEdit(note.id);
                  }}>{t(project.locale, "dayNotes.save")}</PrimaryButton>
                  <SecondaryButton type="button" onClick={() => cancelEdit(note.id)}>{t(project.locale, "dayNotes.cancel")}</SecondaryButton>
                  <DangerButton type="button" onClick={() => {
                    if (confirm(t(project.locale, "dayNotes.confirmDelete"))) {
                      onProjectUpdate(deleteDayNote(project, note.id));
                      cancelEdit(note.id);
                    }
                  }}>{t(project.locale, "dayNotes.delete")}</DangerButton>
                </Toolbar>
              </>
            ) : (
              <>
                {note.gmNote?.trim() ? (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><strong>{t(project.locale, "dayNotes.gmNote")}</strong></div>
                    <div style={{ whiteSpace: "pre-wrap", color: "#d1d5db" }}>{note.gmNote}</div>
                  </div>
                ) : null}
                {note.playerNote?.trim() ? (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><strong>{t(project.locale, "dayNotes.playerNote")}</strong></div>
                    <div style={{ whiteSpace: "pre-wrap", color: "#d1d5db" }}>{note.playerNote}</div>
                  </div>
                ) : null}
                <Toolbar>
                  <SecondaryButton type="button" onClick={() => beginEdit(note)}>{t(project.locale, "dayNotes.edit")}</SecondaryButton>
                  {(note.gmNote?.trim() || note.playerNote?.trim()) ? (
                    <SecondaryButton type="button" onClick={() => {
                      if (note.gmNote?.trim()) sendPopupNotification({ type: "dayNote", audience: "gm", title: t(project.locale, "dayNotes.gmNote"), body: note.gmNote, date: dateLabel });
                      if (note.playerNote?.trim()) sendPopupNotification({ type: "dayNote", audience: "players", title: t(project.locale, "dayNotes.playerNote"), body: note.playerNote, date: dateLabel });
                    }}>
                       {t(project.locale, "common.send")}
                    </SecondaryButton>
                  ) : null}
                </Toolbar>
              </>
            )}
          </Panel>
        );
      })}
      {notes.length > 0 && !creating ? <SecondaryButton type="button" style={{ marginTop: 4 }} onClick={() => setCreating(true)}>{t(project.locale, "dayNotes.new")}</SecondaryButton> : null}
      {creating ? (
        <Panel style={{ marginTop: 6 }}>
          <div style={{ marginBottom: 4, fontSize: 12 }}><strong>{t(project.locale, "dayNotes.create")}</strong></div>
          <label style={{ display: "grid", gap: 3, marginBottom: 6 }}>
            <span><strong>{t(project.locale, "dayNotes.gmNote")}:</strong></span>
            <AutoResizeTextarea value={newDraft.gmNote} onChange={(value) => setNewDraft((prev) => ({ ...prev, gmNote: value }))} placeholder={t(project.locale, "dayNotes.emptyGmNote")} />
          </label>
          <label style={{ display: "grid", gap: 3, marginBottom: 6 }}>
            <span><strong>{t(project.locale, "dayNotes.playerNote")}:</strong></span>
            <AutoResizeTextarea value={newDraft.playerNote} onChange={(value) => setNewDraft((prev) => ({ ...prev, playerNote: value }))} placeholder={t(project.locale, "dayNotes.emptyPlayerNote")} />
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
      ) : null}
    </>
  );
};