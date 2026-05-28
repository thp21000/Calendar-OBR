import type { CalendarProject, WeatherEvent } from "../../domain/types";
import { t } from "../../i18n/messages";
import { WeatherEventForm } from "./WeatherEventForm";

export const WeatherEventPopup = ({ project, event, mode, onClose, onSubmit }: { project: CalendarProject; event: WeatherEvent; mode: "create" | "edit"; onClose: () => void; onSubmit: (event: WeatherEvent) => void; }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }} onClick={onClose}>
    <div style={{ width: "100%", maxWidth: 380, maxHeight: "85vh", overflow: "auto", border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#0f172a" }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <strong>{mode === "create" ? t(project.locale, "weatherEvents.createTitle") : t(project.locale, "weatherEvents.editTitle")}</strong>
        <button type="button" onClick={onClose} title={t(project.locale, "common.close")} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb", fontSize: 18, lineHeight: 1, cursor: "pointer" }}>×</button>
      </div>
      <WeatherEventForm project={project} event={event} mode={mode} onSubmit={onSubmit} onCancel={onClose} />
    </div>
  </div>
);
