import { useState } from "react";
import { addCalendarEvent, deleteCalendarEvent, sortEventsByDate, updateCalendarEvent } from "../calendar/eventsLogic";
import { formatEventDateTime, formatEventRecurrence, formatEventStatus, formatEventTriggerOptions, formatEventVisibility } from "../calendar/formatEvent";
import type { CalendarEvent, CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";
import { EventIcon } from "./EventIcon";
import { EventForm } from "./events/EventForm";

export const EventsView = ({ project, onProjectUpdate }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void }) => {
  const events = sortEventsByDate(project.events, project);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"active" | "triggered" | "archived" | "disabled" | "all">("active");
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  
  const filteredEvents = events.filter((event) => {
    if (statusFilter === "all") return true;
    return event.status === statusFilter;
  });

    const handleCreate = (event: CalendarEvent) => {
    onProjectUpdate(addCalendarEvent(project, event));
    setIsCreateFormOpen(false);
  };
  const handleUpdate = (event: CalendarEvent) => {
    onProjectUpdate(updateCalendarEvent(project, event.id, event));
    setEditingEventId(null);
  };
  const handleDelete = (event: CalendarEvent) => {
    if (!window.confirm(t(project.locale, "events.confirmDelete"))) return;
    onProjectUpdate(deleteCalendarEvent(project, event.id));
    if (editingEventId === event.id) setEditingEventId(null);
  };
  const handleStatusUpdate = (event: CalendarEvent, status: CalendarEvent["status"]) =>
    onProjectUpdate(updateCalendarEvent(project, event.id, { status }));
  return (
    <>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>{t(project.locale, "events.title")}</div>
      <button
        type="button"
        onClick={() => setIsCreateFormOpen((prev) => !prev)}
        style={{ border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#f3f4f6", padding: "7px 10px", fontSize: 12, marginBottom: 8 }}
      >
        {isCreateFormOpen ? t(project.locale, "events.closeCreateForm") : t(project.locale, "events.openCreateForm")}
      </button>
      {isCreateFormOpen ? <EventForm project={project} mode="create" onSubmit={handleCreate} /> : null}
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>{t(project.locale, "events.filter")}</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "active" | "triggered" | "archived" | "disabled" | "all")} style={{ width: "100%", background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 6, padding: "6px 8px", fontSize: 12 }}>
          <option value="active">{t(project.locale, "events.filterActive")}</option>
          <option value="triggered">{t(project.locale, "events.filterTriggered")}</option>
          <option value="archived">{t(project.locale, "events.filterArchived")}</option>
          <option value="disabled">{t(project.locale, "events.filterDisabled")}</option>
          <option value="all">{t(project.locale, "events.filterAll")}</option>
        </select>
      </div>

      {filteredEvents.length === 0 ? <div style={{ color: "#9ca3af" }}>{t(project.locale, "events.noEventsForFilter")}</div> : <div style={{ display: "grid", gap: 8 }}>
        {filteredEvents.map((event) => (
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
                <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "events.status")}: {formatEventStatus(project, event)}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>{t(project.locale, "events.visibility")}: {formatEventVisibility(project, event.visibility)}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" onClick={() => setEditingEventId(event.id)} style={btn}>{t(project.locale, "events.edit")}</button>
                  <button type="button" onClick={() => handleDelete(event)} style={btn}>{t(project.locale, "events.delete")}</button>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  {event.status === "active" ? (
                    <>
                      <button type="button" onClick={() => handleStatusUpdate(event, "disabled")} style={btn}>{t(project.locale, "events.disable")}</button>
                      <button type="button" onClick={() => handleStatusUpdate(event, "archived")} style={btn}>{t(project.locale, "events.archive")}</button>
                    </>
                  ) : null}
                  {event.status === "triggered" ? (
                    <>
                      <button type="button" onClick={() => handleStatusUpdate(event, "active")} style={btn}>{t(project.locale, "events.reactivate")}</button>
                      <button type="button" onClick={() => handleStatusUpdate(event, "archived")} style={btn}>{t(project.locale, "events.archive")}</button>
                    </>
                  ) : null}
                  {event.status === "archived" ? (
                    <button type="button" onClick={() => handleStatusUpdate(event, "active")} style={btn}>{t(project.locale, "events.reactivate")}</button>
                  ) : null}
                  {event.status === "disabled" ? (
                    <>
                      <button type="button" onClick={() => handleStatusUpdate(event, "active")} style={btn}>{t(project.locale, "events.reactivate")}</button>
                      <button type="button" onClick={() => handleStatusUpdate(event, "archived")} style={btn}>{t(project.locale, "events.archive")}</button>
                    </>
                  ) : null}
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