import { useState } from "react";
import { formatEventDateTime, formatEventRecurrence, formatEventStatus, formatEventTriggerOptions, formatEventVisibility } from "../../calendar/formatEvent";
import type { CalendarEvent, CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";
import { Badge, SecondaryButton } from "../ui";
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <EventIcon icon={event.icon} locale={project.locale} />
            <strong style={{ lineHeight: 1.2, overflowWrap: "anywhere" }}>{event.name}</strong>
          </div>
          <button type="button" onClick={onClose} title={t(project.locale, "month.closeDayDetails")} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb", fontSize: 18, lineHeight: 1, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
          <div style={{ fontSize: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ color: "#9ca3af" }}>{t(project.locale, "events.date")}</span>
            <span style={{ color: "#e5e7eb", textAlign: "right" }}>{formatEventDateTime(project, event)}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <Badge>{t(project.locale, "events.recurrence")}: {formatEventRecurrence(project, event)}</Badge>
            <Badge>{t(project.locale, "events.status")}: {formatEventStatus(project, event)}</Badge>
            <Badge>{t(project.locale, "events.visibility")}: {formatEventVisibility(project, event.visibility)}</Badge>
            <Badge>{t(project.locale, "events.triggerOptions")}: {formatEventTriggerOptions(project, event)}</Badge>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {event.summary ? (
            <div style={{ fontSize: 12, border: "1px solid #374151", borderRadius: 6, background: "#0f172a", padding: 6 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{t(project.locale, "events.summary")}</div>
              <div style={{ whiteSpace: "pre-wrap", color: "#d1d5db" }}>{event.summary}</div>
            </div>
          ) : null}
          {event.playerDescription ? (
            <div style={{ fontSize: 12, border: "1px solid #374151", borderRadius: 6, background: "#0f172a", padding: 6 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{t(project.locale, "events.playerDescription")}</div>
              <div style={{ whiteSpace: "pre-wrap", color: "#d1d5db" }}>{event.playerDescription}</div>
            </div>
          ) : null}
          {event.gmDescription ? (
            <div style={{ fontSize: 12, border: "1px solid #374151", borderRadius: 6, background: "#0f172a", padding: 6 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{t(project.locale, "events.gmDescription")}</div>
              <div style={{ whiteSpace: "pre-wrap", color: "#d1d5db" }}>{event.gmDescription}</div>
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          {onUpdate ? <SecondaryButton type="button" onClick={() => setIsEditing(true)}>{t(project.locale, "events.edit")}</SecondaryButton> : null}
        </div>
      </div>
    </div>
  );
};