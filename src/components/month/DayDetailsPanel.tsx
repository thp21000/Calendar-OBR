import { t } from "../../i18n/messages";
import { getConfiguredWeatherStateIcon, getConfiguredWeatherTrendIcon, getWeatherStateLabel, getWeatherTrendLabel } from "../../calendar/weatherAdvancedSettings";
import { absoluteDayToCalendarDate, calendarDateToAbsoluteDay } from "../../calendar/dateEngine";
import type { CalendarDate, CalendarProject, DayNote } from "../../domain/types";
import type { DayDetails } from "../../calendar/dayDetails";
import { EventIcon } from "../EventIcon";
import { DayNotesEditor } from "./DayNotesEditor";
import { getTemperatureIcon, getWindDirectionIcon, getWindSpeedIcon } from "../today/weatherIcons";
import { Badge, EmptyState, PrimaryButton, SecondaryButton, SectionCard, SectionHeader } from "../ui";
import { formatEventTimeShort, formatEventVisibility } from "../../calendar/formatEvent";
import { sendPopupNotification } from "../../obr/popupNotifications";
import { getMoonEventRemainingDurationDays } from "../../calendar/moonEventsLogic";
import { formatRainTotal, formatTemperature, formatWindSpeed } from "../../calendar/weatherUnits";

export const DayDetailsPanel = ({ project, dayDetails, notes, onClose, onCreateEventForDate, onProjectUpdate, onOpenEvent, onOpenMoonEvent }: { project: CalendarProject; dayDetails: DayDetails; notes: DayNote[]; onClose: () => void; onCreateEventForDate?: (date: CalendarDate) => void; onProjectUpdate?: (project: CalendarProject) => void; onOpenEvent?: (eventId: string) => void; onOpenMoonEvent?: (eventId: string) => void }) => {
  const dayInternal = calendarDateToAbsoluteDay(dayDetails.date, project.calendarSystem);
  const displayDate = absoluteDayToCalendarDate(dayInternal, project.calendarSystem);
  const weatherUnits = getWeatherUnitLabels(project.locale);
  return (
  <div style={{ marginTop: 10, border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827" }}>
    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", minWidth: 0 }}>
        <span>{displayDate.weekdayName}</span>
        <span>{dayDetails.date.dayOfMonth}</span>
        <span>{displayDate.monthName}</span>
        <span>{dayDetails.date.year}</span>
        {dayDetails.seasonName ? <span>{dayDetails.seasonIcon ?? "🍃"} {dayDetails.seasonName}</span> : null}
        {dayDetails.moonPhases.map((moon) => <span key={moon.moonId} title={t(project.locale, `moon.phase.${moon.phaseId}`)}>{moon.moonIcon ?? moon.phaseIcon}</span>)}
      </div>
      <button type="button" onClick={onClose} title={t(project.locale, "month.closeDayDetails")} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb", fontSize: 18, lineHeight: 1, cursor: "pointer", flexShrink: 0 }}>×</button>
    </div>
    <div style={{ fontSize: 12, marginBottom: 4, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      {dayDetails.dailyWeather ? (
        <>
          <span>{getConfiguredWeatherStateIcon(project, dayDetails.dailyWeather.dominantState)} {getWeatherStateLabel(project, dayDetails.dailyWeather.dominantState)}</span>
          <span>{getTemperatureIcon(dayDetails.dailyWeather.averageTemperature)} {formatTemperature(dayDetails.dailyWeather.averageTemperature, project.units, project.locale)}</span>
          <span>{getWindSpeedIcon(dayDetails.dailyWeather.averageWindSpeed)} {formatWindSpeed(dayDetails.dailyWeather.averageWindSpeed, project.units, project.locale)} <span title={dayDetails.dailyWeather.dominantWindDirection}>{getWindDirectionIcon(dayDetails.dailyWeather.dominantWindDirection)}</span></span>
          <span>24 h: {formatRainTotal(dayDetails.dailyWeather.rainTotal24h, project.units, project.locale)}</span>
        </>
      ) : t(project.locale, "calendar.noWeather")}
    </div>
    {dayDetails.dailyWeather?.trendKind || dayDetails.dailyWeather?.dominantState ? (
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>
        {dayDetails.dailyWeather?.trendKind ? `${getConfiguredWeatherTrendIcon(project, dayDetails.dailyWeather.trendKind)} ${t(project.locale, "weather.trend")}: ${getWeatherTrendLabel(project, dayDetails.dailyWeather.trendKind)}` : ""}
        {dayDetails.dailyWeather?.trendKind && dayDetails.dailyWeather?.dominantState ? " · " : ""}
        {dayDetails.dailyWeather?.dominantState ? `${t(project.locale, "weather.dominantState")}: ${getWeatherStateLabel(project, dayDetails.dailyWeather.dominantState)}` : ""}
      </div>
    ) : null}
    <SectionCard style={{ marginTop: 8 }}>
      <SectionHeader title={t(project.locale, "month.dayEvents")} />
    {dayDetails.events.length === 0 && dayDetails.moonEvents.length === 0 ? <EmptyState text={t(project.locale, "month.noEventsForDay")} /> : (
      <div style={{ display: "grid", gap: 4 }}>
        {dayDetails.events.map((event) => (
          <div
            key={event.id}
            role={onOpenEvent ? "button" : undefined}
            tabIndex={onOpenEvent ? 0 : undefined}
            onClick={() => onOpenEvent?.(event.id)}
            onKeyDown={(keyEvent) => {
              if (!onOpenEvent || (keyEvent.key !== "Enter" && keyEvent.key !== " ")) return;
              keyEvent.preventDefault();
              onOpenEvent(event.id);
            }}
            style={{ fontSize: 12, border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#0f172a", cursor: onOpenEvent ? "pointer" : undefined }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <EventIcon icon={event.icon} locale={project.locale} size={14} />
              <strong style={{ color: "#f3f4f6" }}>{event.name}</strong>
              <span style={{ marginLeft: "auto", color: "#cbd5e1", fontSize: 11 }}>{formatEventTimeShort(project, event)}</span>
              <SecondaryButton
                type="button"
                style={{ padding: "4px 8px", fontSize: 11 }}
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  sendPopupNotification({
                    type: "event",
                    audience: "players",
                    title: event.name,
                    body: event.playerDescription?.trim() || event.summary || event.name,
                    date: `${displayDate.weekdayName} ${dayDetails.date.dayOfMonth} ${displayDate.monthName} ${dayDetails.date.year}`,
                    icon: event.icon,
                    summary: event.summary,
                    playerDescription: event.playerDescription,
                    timeLabel: formatEventTimeShort(project, event)
                  });
                }}
              >
                {t(project.locale, "common.send")}
              </SecondaryButton>
            </div>
            {event.summary ? <div style={{ color: "#cbd5e1", marginTop: 4 }}>{event.summary}</div> : null}
            <div style={{ marginTop: 4, opacity: 0.86 }}>
              <Badge>{t(project.locale, "events.visibility")}: {formatEventVisibility(project, event.visibility)}</Badge>
            </div>
          </div>
        ))}
        {dayDetails.moonEvents.map((event) => {
          const moon = project.moons.find((item) => item.id === event.moonId);
          const remainingDays = getMoonEventRemainingDurationDays(project, event, dayInternal.absoluteDay);
          const durationLabel = remainingDays <= 1
            ? t(project.locale, "events.allDay")
            : t(project.locale, "moonEvents.remainingDurationDays").replace("{count}", String(remainingDays));
          return (
            <div
              key={event.id}
              role={onOpenMoonEvent ? "button" : undefined}
              tabIndex={onOpenMoonEvent ? 0 : undefined}
              onClick={() => onOpenMoonEvent?.(event.id)}
              onKeyDown={(keyEvent) => {
                if (!onOpenMoonEvent || (keyEvent.key !== "Enter" && keyEvent.key !== " ")) return;
                keyEvent.preventDefault();
                onOpenMoonEvent(event.id);
              }}
              style={{ fontSize: 12, border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#0f172a", cursor: onOpenMoonEvent ? "pointer" : undefined }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>{event.icon || "🌕"}</span>
                <strong style={{ color: "#f3f4f6" }}>{event.name}</strong>
                <span style={{ marginLeft: "auto", color: "#cbd5e1", fontSize: 11 }}>{durationLabel}</span>
                <SecondaryButton
                  type="button"
                  style={{ padding: "4px 8px", fontSize: 11 }}
                  onClick={(clickEvent) => {
                    clickEvent.stopPropagation();
                    sendPopupNotification({
                      type: "event",
                      audience: "players",
                      title: event.name,
                      body: event.playerDescription?.trim() || event.summary || event.name,
                      date: `${displayDate.weekdayName} ${dayDetails.date.dayOfMonth} ${displayDate.monthName} ${dayDetails.date.year}`,
                      icon: event.icon,
                      summary: event.summary,
                      playerDescription: event.playerDescription,
                      timeLabel: durationLabel
                    });
                  }}
                >
                  {t(project.locale, "common.send")}
                </SecondaryButton>
              </div>
              <div style={{ color: "#cbd5e1", marginTop: 4 }}>
                {moon?.name ?? t(project.locale, "moonEvents.unknownMoon")} · {t(project.locale, `moon.phase.${event.phaseId}`)}
              </div>
              {event.summary ? <div style={{ color: "#cbd5e1", marginTop: 4 }}>{event.summary}</div> : null}
              <div style={{ marginTop: 4, opacity: 0.86, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge>{t(project.locale, "moonEvents.eventKind")}</Badge>
                <Badge>{t(project.locale, "events.visibility")}: {formatEventVisibility(project, event.visibility)}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    )}
    {onCreateEventForDate ? <PrimaryButton type="button" onClick={() => onCreateEventForDate(dayDetails.date)} style={{ marginTop: 8, width: "100%" }}>{t(project.locale, "month.createEventForDay")}</PrimaryButton> : null}
    </SectionCard>

    <SectionCard style={{ marginTop: 8 }}>
      <SectionHeader title={t(project.locale, "dayNotes.title")} />
    <DayNotesEditor project={project} date={dayDetails.date} notes={notes} onProjectUpdate={onProjectUpdate} />
    </SectionCard>
  </div>
);
};