import { lazy, Suspense } from "react";
import { t } from "../../i18n/messages";
import { getConfiguredWeatherStateIcon, getConfiguredWeatherTrendIcon, getWeatherStateLabel, getWeatherTrendLabel } from "../../calendar/weatherAdvancedSettings";
import { absoluteDayToCalendarDate, calendarDateToAbsoluteDay } from "../../calendar/dateEngine";
import type { CalendarDate, CalendarProject, DayNote, LocaleCode } from "../../domain/types";
import type { DayDetails } from "../../calendar/dayDetails";
import { EventIcon } from "../EventIcon";
import { getTemperatureIcon, getWindDirectionIcon, getWindSpeedIcon } from "../today/weatherIcons";
import { Badge, EmptyState, PrimaryButton, SecondaryButton, SectionCard, SectionHeader } from "../ui";
import { formatEventTimeShort, formatEventVisibility } from "../../calendar/formatEvent";
import { getMoonEventRemainingDurationDays } from "../../calendar/moonEventsLogic";
import { formatRainTotal, formatTemperature, formatWindSpeed } from "../../calendar/weatherUnits";
import type { PublicMonthDaySnapshot } from "../../obr/publicSnapshot";
import type { PublicEventDetails } from "../player/PublicEventDetailsPopup";
import type { MonthLayoutVisibility } from "./MonthLayout";

const DayNotesEditor = lazy(() => import("./DayNotesEditor").then((module) => ({ default: module.DayNotesEditor })));

export const DayDetailsPanel = ({ project, locale, dayDetails, notes, onClose, onCreateEventForDate, onProjectUpdate, onOpenEvent, onOpenMoonEvent, mode = "gm", publicDay, visibility, onOpenPublicEvent }: { project?: CalendarProject; locale?: LocaleCode; dayDetails?: DayDetails; notes: DayNote[]; onClose: () => void; onCreateEventForDate?: (date: CalendarDate) => void; onProjectUpdate?: (project: CalendarProject) => void; onOpenEvent?: (eventId: string) => void; onOpenMoonEvent?: (eventId: string) => void; mode?: "gm" | "player"; readonly?: boolean; publicDay?: PublicMonthDaySnapshot; visibility?: Partial<MonthLayoutVisibility>; onOpenPublicEvent?: (event: PublicEventDetails) => void }) => {
  const displayLocale = project?.locale ?? locale ?? "en";
  if (mode === "player" && publicDay) {
    const hasContent = Boolean(publicDay.season || publicDay.weatherSummary || publicDay.events.length || publicDay.weatherEvents.length || publicDay.moonEvents.length || publicDay.dayNotes.length);
    const hasEventContent = Boolean(
      (visibility?.showPublicEvents && publicDay.events.length) ||
      (visibility?.showWeatherEvents && publicDay.weatherEvents.length) ||
      (visibility?.showMoonEvents && publicDay.moonEvents.length)
    );
    return (
      <div style={{ marginTop: 10, border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827" }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", minWidth: 0 }}>
            <span>{publicDay.dateLabel}</span>
            {visibility?.showWeatherSummary && publicDay.season ? <span>{publicDay.season.icon ?? "🍃"} {publicDay.season.name}</span> : null}
          </div>
          <button type="button" onClick={onClose} title={t(displayLocale, "month.closeDayDetails")} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb", fontSize: 18, lineHeight: 1, cursor: "pointer", flexShrink: 0 }}>×</button>
        </div>
        {visibility?.showWeatherSummary && publicDay.weatherSummary ? <div style={{ fontSize: 12, marginBottom: 4, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span>{publicDay.weatherSummary.stateIcon} {publicDay.weatherSummary.stateLabel}</span>
          {publicDay.weatherSummary.temperatureLabel ? <span>{publicDay.weatherSummary.temperatureLabel}</span> : null}
          {publicDay.weatherSummary.broadLabel ? <span>{publicDay.weatherSummary.broadLabel}</span> : null}
        </div> : null}
        <SectionCard style={{ marginTop: 8 }}>
          <SectionHeader title={t(displayLocale, "month.dayEvents")} />
          {!hasEventContent ? <EmptyState text={hasContent ? t(displayLocale, "month.noEventsForDay") : t(displayLocale, "player.noPublicDayDetails")} /> : <div style={{ display: "grid", gap: 4 }}>
            {visibility?.showPublicEvents ? <PublicEventSection title={t(displayLocale, "player.publicMonthEvents")} events={publicDay.events} locale={displayLocale} onOpenPublicEvent={onOpenPublicEvent} /> : null}
            {visibility?.showWeatherEvents && publicDay.weatherEvents.length > 0 ? <PublicEventSection title={t(displayLocale, "player.publicMonthWeatherEvents")} events={publicDay.weatherEvents} locale={displayLocale} onOpenPublicEvent={onOpenPublicEvent} /> : null}
            {visibility?.showMoonEvents && publicDay.moonEvents.length > 0 ? <PublicEventSection title={t(displayLocale, "player.publicMonthMoonEvents")} events={publicDay.moonEvents.map((event) => ({ ...event, subtitle: `${event.moonName} · ${t(displayLocale, `moon.phase.${event.phaseId}`)}` }))} locale={displayLocale} onOpenPublicEvent={onOpenPublicEvent} /> : null}
          </div>}
        </SectionCard>
        {visibility?.showDayNotes && publicDay.dayNotes.length > 0 ? <SectionCard style={{ marginTop: 8 }}>
          <SectionHeader title={t(displayLocale, "player.publicMonthNotes")} />
          <div style={{ display: "grid", gap: 6 }}>{publicDay.dayNotes.map((note) => <div key={note.id} style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827", fontSize: 12, whiteSpace: "pre-wrap" }}>{note.playerNote}</div>)}</div>
        </SectionCard> : null}
      </div>
    );
  }
  if (!project || !dayDetails) return null;
  const dayInternal = calendarDateToAbsoluteDay(dayDetails.date, project.calendarSystem);
  const displayDate = absoluteDayToCalendarDate(dayInternal, project.calendarSystem);
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
                  void import("../../obr/popupNotifications").then(({ sendPopupNotification }) => sendPopupNotification({
                    type: "event",
                    audience: "players",
                    title: event.name,
                    body: event.playerDescription?.trim() || event.summary || event.name,
                    date: `${displayDate.weekdayName} ${dayDetails.date.dayOfMonth} ${displayDate.monthName} ${dayDetails.date.year}`,
                    icon: event.icon,
                    summary: event.summary,
                    playerDescription: event.playerDescription,
                    timeLabel: formatEventTimeShort(project, event)
                  }));
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
                    void import("../../obr/popupNotifications").then(({ sendPopupNotification }) => sendPopupNotification({
                      type: "moon",
                      audience: "players",
                      title: event.name,
                      body: event.playerDescription?.trim() || event.summary || event.name,
                      date: `${displayDate.weekdayName} ${dayDetails.date.dayOfMonth} ${displayDate.monthName} ${dayDetails.date.year}`,
                      icon: event.icon,
                      summary: event.summary,
                      playerDescription: event.playerDescription,
                      timeLabel: durationLabel
                    }));
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
    <Suspense fallback={null}>
      <DayNotesEditor project={project} date={dayDetails.date} notes={notes} onProjectUpdate={onProjectUpdate} />
    </Suspense>
    </SectionCard>
  </div>
);
};

const PublicEventSection = ({ title, events, locale, onOpenPublicEvent }: { title: string; events: PublicEventDetails[]; locale: LocaleCode; onOpenPublicEvent?: (event: PublicEventDetails) => void }) => (
  <div>
    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{title}</div>
    {events.length === 0 ? <EmptyState text={t(locale, "player.noPublicEvents")} /> : <div style={{ display: "grid", gap: 4 }}>{events.map((event) => <button key={event.id} type="button" onClick={onOpenPublicEvent ? () => onOpenPublicEvent(event) : undefined} style={{ fontSize: 12, border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#0f172a", cursor: onOpenPublicEvent ? "pointer" : undefined, width: "100%", textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <EventIcon icon={event.icon} locale={locale} size={14} />
        <strong style={{ color: "#f3f4f6" }}>{event.name}</strong>
        {event.timeLabel ? <span style={{ marginLeft: "auto", color: "#cbd5e1", fontSize: 11 }}>{event.timeLabel}</span> : null}
      </div>
      {event.subtitle ? <div style={{ color: "#cbd5e1", marginTop: 4 }}>{event.subtitle}</div> : null}
      {event.summary ? <div style={{ color: "#cbd5e1", marginTop: 4 }}>{event.summary}</div> : null}
    </button>)}</div>}
  </div>
);