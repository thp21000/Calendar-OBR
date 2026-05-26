import { useState } from "react";
import { formatEventDateTime, formatEventRecurrence, formatEventStatus, formatEventTriggerOptions, formatEventVisibility } from "../../calendar/formatEvent";
import type { CalendarEvent, CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";
import { EventForm } from "./EventForm";

export const EventDetailsPopup = ({ project, event, onClose, onUpdate }: { project: CalendarProject; event: CalendarEvent; onClose: () => void; onUpdate?: (event: CalendarEvent) => void }) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing && onUpdate) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }} onClick={onClose}>
        <div style={{ width: "100%", maxWidth: 340, maxHeight: "85vh", overflow: "auto", border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#0f172a" }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <strong>{t(project.locale, "events.details")}</strong>
            <button type="button" onClick={onClose} title={t(project.locale, "month.closeDayDetails")} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb", fontSize: 18, lineHeight: 1, cursor: "pointer" }}>×</button>
          </div>
          <EventForm
            project={project}
            mode="edit"
            initialEvent={event}
            onSubmit={(updated) => {
              onUpdate(updated);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 340, maxHeight: "85vh", overflow: "auto", border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <strong>{t(project.locale, "events.details")}</strong>
          <button type="button" onClick={onClose} title={t(project.locale, "month.closeDayDetails")} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb", fontSize: 18, lineHeight: 1, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <EventIcon icon={event.icon} locale={project.locale} />
          <strong>{event.name}</strong>
        </div>
        <div style={{ fontSize: 12, marginBottom: 4 }}><strong>{t(project.locale, "events.date")}:</strong> {formatEventDateTime(project, event)}</div>
        <div style={{ fontSize: 12, marginBottom: 4 }}><strong>{t(project.locale, "events.recurrence")}:</strong> {formatEventRecurrence(project, event)}</div>
        <div style={{ fontSize: 12, marginBottom: 4 }}><strong>{t(project.locale, "events.status")}:</strong> {formatEventStatus(project, event)}</div>
        <div style={{ fontSize: 12, marginBottom: 4 }}><strong>{t(project.locale, "events.visibility")}:</strong> {formatEventVisibility(project, event.visibility)}</div>
        {event.summary ? <div style={{ fontSize: 12, marginBottom: 4 }}><strong>{t(project.locale, "events.summary")}:</strong> {event.summary}</div> : null}
        {event.playerDescription ? <div style={{ fontSize: 12, marginBottom: 4 }}><strong>{t(project.locale, "events.playerDescription")}:</strong> {event.playerDescription}</div> : null}
        {event.gmDescription ? <div style={{ fontSize: 12, marginBottom: 4 }}><strong>{t(project.locale, "events.gmDescription")}:</strong> {event.gmDescription}</div> : null}
        <div style={{ fontSize: 12, marginBottom: 8 }}><strong>{t(project.locale, "events.triggerOptions")}:</strong> {formatEventTriggerOptions(project, event)}</div>
        <div style={{ display: "flex", gap: 6 }}>
          {onUpdate ? <button type="button" onClick={() => setIsEditing(true)}>{t(project.locale, "events.edit")}</button> : null}
        </div>
      </div>
    </div>
  );
};