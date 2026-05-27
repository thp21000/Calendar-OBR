import { useState } from "react";
import type { CalendarProject, MoonEvent } from "../../domain/types";
import { t } from "../../i18n/messages";
import { getNextMoonEventActivationDays } from "../../calendar/moonEventsLogic";
import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import { MoonEventForm } from "./MoonEventForm";

export const MoonEventPopup = ({ project, event, mode, onClose, onSubmit }: { project: CalendarProject; event: MoonEvent; mode: "create" | "edit"; onClose: () => void; onSubmit: (event: MoonEvent) => void }) => {
  const [previewEvent, setPreviewEvent] = useState(event);
  const nextActivationDays = getNextMoonEventActivationDays(project, previewEvent, project.currentTime.absoluteDay, 3);
  const nextActivationLabels = nextActivationDays.map((absoluteDay) => {
    const date = absoluteDayToCalendarDate({ absoluteDay, hour: 0, minute: 0 }, project.calendarSystem);
    const month = project.calendarSystem.months.find((item) => item.id === date.monthId);
    return `${date.dayOfMonth} ${month?.name ?? date.monthId} ${date.year}`;
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 340, maxHeight: "85vh", overflow: "auto", border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#0f172a" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <strong>{mode === "create" ? t(project.locale, "moonEvents.createTitle") : t(project.locale, "moonEvents.editTitle")}</strong>
          <button type="button" onClick={onClose} title={t(project.locale, "common.close")} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb", fontSize: 18, lineHeight: 1, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ border: "1px solid #374151", borderRadius: 6, padding: 6, marginBottom: 8, fontSize: 12, color: "#d1d5db" }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{t(project.locale, "moonEvents.nextActivationsTitle")}</div>
          {nextActivationLabels.length === 0 ? <div>{t(project.locale, "moonEvents.nextActivationUnknown")}</div> : <ul style={{ margin: 0, paddingLeft: 16 }}>{nextActivationLabels.map((label) => <li key={label}>{label}</li>)}</ul>}
        </div>
        <MoonEventForm project={project} event={event} mode={mode} onSubmit={onSubmit} onCancel={onClose} onDraftChange={setPreviewEvent} />
      </div>
    </div>
  );
};