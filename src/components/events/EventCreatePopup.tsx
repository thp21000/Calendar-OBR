import type { CalendarDate, CalendarEvent, CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventForm } from "./EventForm";

export const EventCreatePopup = ({ project, date, onClose, onCreate }: { project: CalendarProject; date: CalendarDate; onClose: () => void; onCreate: (event: CalendarEvent) => void }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }} onClick={onClose}>
    <div style={{ width: "100%", maxWidth: 340, maxHeight: "85vh", overflow: "auto", border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#0f172a" }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <strong>{t(project.locale, "events.createTitle")}</strong>
        <button type="button" onClick={onClose} title={t(project.locale, "month.closeDayDetails")} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb", fontSize: 18, lineHeight: 1, cursor: "pointer" }}>×</button>
      </div>
      <EventForm
        project={project}
        mode="create"
        initialDate={date}
        onSubmit={onCreate}
        onCancel={onClose}
        hideTitle
        frameless
      />
    </div>
  </div>
);
