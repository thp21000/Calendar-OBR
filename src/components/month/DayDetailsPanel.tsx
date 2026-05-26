import { t } from "../../i18n/messages";
import { getWeatherStateIcon } from "../../calendar/weatherState";
import { absoluteDayToCalendarDate, calendarDateToAbsoluteDay } from "../../calendar/dateEngine";
import type { CalendarDate, CalendarProject, DayNote } from "../../domain/types";
import type { DayDetails } from "../../calendar/dayDetails";
import { EventIcon } from "../EventIcon";
import { DayNotesEditor } from "./DayNotesEditor";
import { getRainIcon, getTemperatureIcon, getTrendIcon, getWindDirectionIcon, getWindSpeedIcon } from "../today/weatherIcons";

export const DayDetailsPanel = ({ project, dayDetails, notes, onClose, onCreateEventForDate, onProjectUpdate, onOpenEvent }: { project: CalendarProject; dayDetails: DayDetails; notes: DayNote[]; onClose: () => void; onCreateEventForDate?: (date: CalendarDate) => void; onProjectUpdate?: (project: CalendarProject) => void; onOpenEvent?: (eventId: string) => void }) => {
  const dayInternal = calendarDateToAbsoluteDay(dayDetails.date, project.calendarSystem);
  const displayDate = absoluteDayToCalendarDate(dayInternal, project.calendarSystem);
  return (
  <div style={{ marginTop: 10, border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
      <strong>{t(project.locale, "month.dayDetailsTitle")}</strong>
      <button type="button" onClick={onClose} title={t(project.locale, "month.closeDayDetails")} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb", fontSize: 18, lineHeight: 1, cursor: "pointer" }}>×</button>
    </div>
    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      <span>{displayDate.weekdayName}</span>
      <span>{dayDetails.date.dayOfMonth}</span>
      <span>{displayDate.monthName}</span>
      <span>{dayDetails.date.year}</span>
      <span>{String(dayDetails.date.hour).padStart(2, "0")}:{String(dayDetails.date.minute).padStart(2, "0")}</span>
      {dayDetails.seasonName ? <span>{dayDetails.seasonIcon ?? "🍃"} {dayDetails.seasonName}</span> : null}
      {dayDetails.moonPhases.map((moon) => <span key={moon.moonId} title={t(project.locale, `moon.phase.${moon.phaseId}`)}>{moon.moonIcon ?? moon.phaseIcon}</span>)}
    </div>
    <div style={{ fontSize: 12, marginBottom: 4, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      {dayDetails.weather ? (
        <>
          <span>{getWeatherStateIcon(dayDetails.weather.state ?? "clear")} {t(project.locale, `weather.state.${dayDetails.weather.state ?? "clear"}`)}</span>
          <span>{getTemperatureIcon(dayDetails.weather.temperature)} {dayDetails.weather.temperature} °C</span>
          <span>{getWindSpeedIcon(dayDetails.weather.windSpeed)} {dayDetails.weather.windSpeed} km/h {dayDetails.weather.windDirection ? <span title={dayDetails.weather.windDirection}>{getWindDirectionIcon(dayDetails.weather.windDirection)}</span> : null}</span>
          <span>{getRainIcon(dayDetails.weather)} {dayDetails.weather.rain} mm/h</span>
          {dayDetails.weather.dailyRainTotal !== undefined ? <span>24 h: {dayDetails.weather.dailyRainTotal} mm/h</span> : null}
        </>
      ) : t(project.locale, "calendar.noWeather")}
    </div>
    {dayDetails.weather?.trendKind || dayDetails.weather?.dominantState ? (
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>
        {dayDetails.weather?.trendKind ? `${getTrendIcon(dayDetails.weather.trendKind)} ${t(project.locale, "weather.trend")}: ${t(project.locale, `weather.trend.${dayDetails.weather.trendKind}`)}` : ""}
        {dayDetails.weather?.trendKind && dayDetails.weather?.dominantState ? " · " : ""}
        {dayDetails.weather?.dominantState ? `${t(project.locale, "weather.dominantState")}: ${t(project.locale, `weather.state.${dayDetails.weather.dominantState}`)}` : ""}
      </div>
    ) : null}
    <div style={{ fontSize: 12, marginBottom: 4 }}><strong>{t(project.locale, "month.dayEvents")}:</strong></div>
    {dayDetails.events.length === 0 ? <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "month.noEventsForDay")}</div> : (
      <div style={{ display: "grid", gap: 4 }}>
        {dayDetails.events.map((event) => (
          <div key={event.id} style={{ fontSize: 12, border: "1px solid #374151", borderRadius: 6, padding: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <EventIcon icon={event.icon} locale={project.locale} size={14} />
              <strong>{event.name}</strong>
              {onOpenEvent ? <button type="button" style={{ marginLeft: "auto", fontSize: 11 }} onClick={() => onOpenEvent(event.id)}>{t(project.locale, "globalSearch.open")}</button> : null}
            </div>
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
};