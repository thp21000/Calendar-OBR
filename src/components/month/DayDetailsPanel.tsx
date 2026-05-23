import { t } from "../../i18n/messages";
import { getWeatherStateIcon } from "../../calendar/weatherState";
import type { CalendarDate, CalendarProject, DayNote } from "../../domain/types";
import type { DayDetails } from "../../calendar/dayDetails";
import { EventIcon } from "../EventIcon";
import { DayNotesEditor } from "./DayNotesEditor";

export const DayDetailsPanel = ({ project, dayDetails, notes, onClose, onCreateEventForDate, onProjectUpdate }: { project: CalendarProject; dayDetails: DayDetails; notes: DayNote[]; onClose: () => void; onCreateEventForDate?: (date: CalendarDate) => void; onProjectUpdate?: (project: CalendarProject) => void }) => (
  <div style={{ marginTop: 10, border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
      <strong>{t(project.locale, "month.dayDetailsTitle")}</strong>
      <button type="button" onClick={onClose} style={{ fontSize: 11 }}>{t(project.locale, "month.closeDayDetails")}</button>
    </div>
    <div style={{ fontSize: 12, marginBottom: 6 }}>{dayDetails.formattedDate}</div>
    <div style={{ fontSize: 12, marginBottom: 4 }}><strong>{t(project.locale, "calendar.season")}:</strong> {dayDetails.seasonName ?? t(project.locale, "calendar.noSeason")}</div>
    <div style={{ fontSize: 12, marginBottom: 4 }}><strong>{t(project.locale, "month.dayWeather")}:</strong> {dayDetails.weather ? `${getWeatherStateIcon(dayDetails.weather.state ?? "clear")} ${t(project.locale, `weather.state.${dayDetails.weather.state ?? "clear"}`)} · ${dayDetails.weather.temperature}° · ${t(project.locale, "calendar.wind")} ${dayDetails.weather.windSpeed} · ${t(project.locale, "calendar.rain")} ${dayDetails.weather.rain}` : t(project.locale, "calendar.noWeather")}</div>
    <div style={{ fontSize: 12, marginBottom: 4 }}><strong>{t(project.locale, "month.dayMoons")}:</strong> {dayDetails.moonPhases.length === 0 ? t(project.locale, "calendar.noMoon") : dayDetails.moonPhases.map((m) => `${m.phaseIcon} ${m.moonName}`).join(" · ")}</div>
    <div style={{ fontSize: 12, marginBottom: 4 }}><strong>{t(project.locale, "month.dayEvents")}:</strong></div>
    {dayDetails.events.length === 0 ? <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "month.noEventsForDay")}</div> : (
      <div style={{ display: "grid", gap: 4 }}>
        {dayDetails.events.map((event) => (
          <div key={event.id} style={{ fontSize: 12, border: "1px solid #374151", borderRadius: 6, padding: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><EventIcon icon={event.icon} locale={project.locale} size={14} /><strong>{event.name}</strong></div>
            {event.summary ? <div style={{ color: "#cbd5e1" }}>{event.summary}</div> : null}
          </div>
        ))}
      </div>
    )}
    {onCreateEventForDate ? <button type="button" onClick={() => onCreateEventForDate(dayDetails.date)} style={{ marginTop: 8, width: "100%" }}>{t(project.locale, "month.createEventForDay")}</button> : null}
    <div style={{ fontSize: 12, marginTop: 8, marginBottom: 4 }}><strong>{t(project.locale, "dayNotes.title")}:</strong></div>
    <DayNotesEditor project={project} date={dayDetails.date} notes={notes} onProjectUpdate={onProjectUpdate} />
  </div>
);
