import { useState } from "react";
import { addCalendarEvent, deleteCalendarEvent, sortEventsByDate, updateCalendarEvent } from "../calendar/eventsLogic";
import { formatEventDateTime, formatEventRecurrence, formatEventTriggerOptions, formatEventVisibility } from "../calendar/formatEvent";
import type { CalendarEvent, CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";
import { EventIcon } from "./EventIcon";
import { EventForm } from "./events/EventForm";

export const EventsView = ({ project, onProjectUpdate }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void }) => {
  const events = sortEventsByDate(project.events, project);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

    const handleCreate = (event: CalendarEvent) => onProjectUpdate(addCalendarEvent(project, event));
  const handleUpdate = (event: CalendarEvent) => {
    onProjectUpdate(updateCalendarEvent(project, event.id, event));
    setEditingEventId(null);
  };
  const handleDelete = (event: CalendarEvent) => {
    if (!window.confirm(t(project.locale, "events.confirmDelete"))) return;
    onProjectUpdate(deleteCalendarEvent(project, event.id));
    if (editingEventId === event.id) setEditingEventId(null);
  };
  return (
    <>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>{t(project.locale, "events.title")}</div>
      <EventForm project={project} mode="create" onSubmit={handleCreate} />
      {events.length === 0 ? <div style={{ color: "#9ca3af" }}>{t(project.locale, "events.noEvents")}</div> : <div style={{ display: "grid", gap: 8 }}>
        {events.map((event) => (
          <div key={event.id} style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827" }}>
            {editingEventId === event.id ? (
              <EventForm project={project} mode="edit" initialEvent={event} onSubmit={handleUpdate} onCancel={() => setEditingEventId(null)} />
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, overflow: "hidden" }}><EventIcon icon={event.icon} locale={project.locale} /><strong>{event.name}</strong></div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>{formatEventDateTime(project, event)}</div>
                {event.summary ? <div style={{ fontSize: 12, marginBottom: 4, color: "#d1d5db" }}>{event.summary}</div> : null}
                <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "events.recurrence")}: {formatEventRecurrence(project, event)}</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "events.triggerOptions")}: {formatEventTriggerOptions(project, event)}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>{t(project.locale, "events.visibility")}: {formatEventVisibility(project, event.visibility)}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" onClick={() => setEditingEventId(event.id)} style={btn}>{t(project.locale, "events.edit")}</button>
                  <button type="button" onClick={() => handleDelete(event)} style={btn}>{t(project.locale, "events.delete")}</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>}
    </>
  );
};

const btn = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#f3f4f6", padding: "6px 9px", fontSize: 12 };