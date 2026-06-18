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
import { isLunarEventManuallyPublished } from "../../calendar/eventPublicationLogic";
import { getMoonEventRemainingDurationDays } from "../../calendar/moonEventsLogic";
import { formatRainTotal, formatTemperature, formatWindSpeed } from "../../calendar/weatherUnits";
import type { PublicMonthDaySnapshot } from "../../obr/publicSnapshot";
import type { PublicEventDetails } from "../player/PublicEventDetailsPopup";
import type { MonthLayoutVisibility } from "./MonthLayout";
import { notifyMoonEventToPlayers, setMoonEventPublicationFromUi } from "../events/manualEventPublication";

const DayNotesEditor = lazy(() => import("./DayNotesEditor").then((module) => ({ default: module.DayNotesEditor })));

export const DayDetailsPanel = ({ project, locale, dayDetails, notes, onClose, onCreateEventForDate, onProjectUpdate, onOpenEvent, onOpenMoonEvent, mode = "gm", publicDay, visibility, onOpenPublicEvent }: { project?: CalendarProject; locale?: LocaleCode; dayDetails?: DayDetails; notes: DayNote[]; onClose: () => void; onCreateEventForDate?: (date: CalendarDate) => void; onProjectUpdate?: (project: CalendarProject) => void; onOpenEvent?: (eventId: string) => void; onOpenMoonEvent?: (eventId: string) => void; mode?: "gm" | "player"; readonly?: boolean; publicDay?: PublicMonthDaySnapshot; visibility?: Partial<MonthLayoutVisibility>; onOpenPublicEvent?: (event: PublicEventDetails) => void }) => {
  const displayLocale = project?.locale ?? locale ?? "en";
  const isPlayer = mode === "player" && Boolean(publicDay);
  if (!isPlayer && (!project || !dayDetails)) return null;

  const dayInternal = !isPlayer && project && dayDetails ? calendarDateToAbsoluteDay(dayDetails.date, project.calendarSystem) : undefined;
  const displayDate = !isPlayer && project && dayInternal ? absoluteDayToCalendarDate(dayInternal, project.calendarSystem) : undefined;
  const headerItems = isPlayer && publicDay ? [
    <span key="date">{publicDay.dateLabel}</span>,
    visibility?.showWeatherSummary && publicDay.season ? <span key="season">{publicDay.season.icon ?? "🍃"} {publicDay.season.name}</span> : undefined
  ].filter((item): item is JSX.Element => Boolean(item)) : project && dayDetails && displayDate ? [
    <span key="weekday">{displayDate.weekdayName}</span>,
    <span key="day">{dayDetails.date.dayOfMonth}</span>,
    <span key="month">{displayDate.monthName}</span>,
    <span key="year">{dayDetails.date.year}</span>,
    dayDetails.seasonName ? <span key="season">{dayDetails.seasonIcon ?? "🍃"} {dayDetails.seasonName}</span> : undefined,
    ...dayDetails.moonPhases.map((moon) => <span key={moon.moonId} title={t(project.locale, `moon.phase.${moon.phaseId}`)}>{moon.moonIcon ?? moon.phaseIcon}</span>)
  ].filter((item): item is JSX.Element => Boolean(item)) : [];

  const weatherLine = isPlayer && publicDay ? (visibility?.showWeatherSummary && publicDay.weatherSummary ? [
    publicDay.weatherSummary.narrativeLabel ? <span key="narrative" style={{ whiteSpace: "normal" }}>{publicDay.weatherSummary.narrativeLabel}</span> : <span key="state">{publicDay.weatherSummary.stateIcon} {publicDay.weatherSummary.stateLabel}</span>,
    !publicDay.weatherSummary.narrativeLabel && publicDay.weatherSummary.temperatureLabel && publicDay.weatherSummary.temperatureCelsius !== undefined ? <span key="temp">{getTemperatureIcon(publicDay.weatherSummary.temperatureCelsius)} {publicDay.weatherSummary.temperatureLabel}</span> : undefined,
    !publicDay.weatherSummary.narrativeLabel && publicDay.weatherSummary.windSpeedLabel && publicDay.weatherSummary.windSpeedKmh !== undefined ? <span key="wind">{getWindSpeedIcon(publicDay.weatherSummary.windSpeedKmh)} {publicDay.weatherSummary.windSpeedLabel}{publicDay.weatherSummary.windDirection ? <span title={publicDay.weatherSummary.windDirection}> {getWindDirectionIcon(publicDay.weatherSummary.windDirection)}</span> : null}</span> : undefined,
    !publicDay.weatherSummary.narrativeLabel && publicDay.weatherSummary.rainTotalLabel ? <span key="rain">24 h: {publicDay.weatherSummary.rainTotalLabel}</span> : undefined,
    !publicDay.weatherSummary.narrativeLabel && publicDay.weatherSummary.broadTemperature ? <span key="broad-temp">{publicDay.weatherSummary.broadTemperature}</span> : undefined,
    !publicDay.weatherSummary.narrativeLabel && publicDay.weatherSummary.broadWind ? <span key="broad-wind">{publicDay.weatherSummary.broadWind}</span> : undefined,
    !publicDay.weatherSummary.narrativeLabel && publicDay.weatherSummary.broadRain ? <span key="broad-rain">{publicDay.weatherSummary.broadRain}</span> : undefined,
    !publicDay.weatherSummary.narrativeLabel && publicDay.weatherSummary.broadSoil ? <span key="broad-soil">{publicDay.weatherSummary.broadSoil}</span> : undefined,
    !publicDay.weatherSummary.narrativeLabel && publicDay.weatherSummary.broadTrend ? <span key="broad-trend">{publicDay.weatherSummary.broadTrend}</span> : undefined,
    !publicDay.weatherSummary.narrativeLabel && publicDay.weatherSummary.broadDominant ? <span key="broad-dominant">{publicDay.weatherSummary.broadDominant}</span> : undefined,
    !publicDay.weatherSummary.narrativeLabel && !publicDay.weatherSummary.broadTemperature && publicDay.weatherSummary.broadLabel ? <span key="broad">{publicDay.weatherSummary.broadLabel}</span> : undefined
  ].filter((item): item is JSX.Element => Boolean(item)) : []) : project && dayDetails ? (dayDetails.dailyWeather ? [
    <span key="state">{getConfiguredWeatherStateIcon(project, dayDetails.dailyWeather.dominantState)} {getWeatherStateLabel(project, dayDetails.dailyWeather.dominantState)}</span>,
    <span key="temp">{getTemperatureIcon(dayDetails.dailyWeather.averageTemperature)} {formatTemperature(dayDetails.dailyWeather.averageTemperature, project.units, project.locale)}</span>,
    <span key="wind">{getWindSpeedIcon(dayDetails.dailyWeather.averageWindSpeed)} {formatWindSpeed(dayDetails.dailyWeather.averageWindSpeed, project.units, project.locale)} <span title={dayDetails.dailyWeather.dominantWindDirection}>{getWindDirectionIcon(dayDetails.dailyWeather.dominantWindDirection)}</span></span>,
    <span key="rain">24 h: {formatRainTotal(dayDetails.dailyWeather.rainTotal24h, project.units, project.locale)}</span>
  ] : [<span key="empty">{t(project.locale, "calendar.noWeather")}</span>]) : [];

  const playerWeatherUsesInlineDetail = isPlayer && publicDay?.weatherSummary && (publicDay.weatherSummary.narrativeLabel || publicDay.weatherSummary.broadTrend || publicDay.weatherSummary.broadDominant);
  const trendText = !playerWeatherUsesInlineDetail && isPlayer && publicDay?.weatherSummary && (publicDay.weatherSummary.trendLabel || publicDay.weatherSummary.dominantStateLabel)
    ? `${publicDay.weatherSummary.trendIcon && publicDay.weatherSummary.trendLabel ? `${publicDay.weatherSummary.trendIcon} ${t(displayLocale, "weather.trend")}: ${publicDay.weatherSummary.trendLabel}` : ""}${publicDay.weatherSummary.trendLabel && publicDay.weatherSummary.dominantStateLabel ? " · " : ""}${publicDay.weatherSummary.dominantState && publicDay.weatherSummary.dominantStateLabel ? `${t(displayLocale, "weather.dominantState")}: ${publicDay.weatherSummary.dominantStateIcon ?? publicDay.weatherSummary.stateIcon} ${publicDay.weatherSummary.dominantStateLabel}` : ""}`
    : !isPlayer && project && dayDetails && (dayDetails.dailyWeather?.trendKind || dayDetails.dailyWeather?.dominantState)
      ? `${dayDetails.dailyWeather?.trendKind ? `${getConfiguredWeatherTrendIcon(project, dayDetails.dailyWeather.trendKind)} ${t(project.locale, "weather.trend")}: ${getWeatherTrendLabel(project, dayDetails.dailyWeather.trendKind)}` : ""}${dayDetails.dailyWeather?.trendKind && dayDetails.dailyWeather?.dominantState ? " · " : ""}${dayDetails.dailyWeather?.dominantState ? `${t(project.locale, "weather.dominantState")}: ${getWeatherStateLabel(project, dayDetails.dailyWeather.dominantState)}` : ""}`
      : "";

  const eventRows = isPlayer && publicDay ? [
    ...(visibility?.showPublicEvents ? publicDay.events.map((event) => <PublicMonthEventRow key={`event-${event.id}`} event={event} locale={displayLocale} onOpenPublicEvent={onOpenPublicEvent} />) : []),
    ...(visibility?.showWeatherEvents ? publicDay.weatherEvents.map((event) => <PublicMonthEventRow key={`weather-${event.id}`} event={event} locale={displayLocale} onOpenPublicEvent={onOpenPublicEvent} />) : []),
    ...(visibility?.showMoonEvents ? publicDay.moonEvents.map((event) => <PublicMonthEventRow key={`moon-${event.id}`} event={{ ...event, subtitle: `${event.moonName} · ${t(displayLocale, `moon.phase.${event.phaseId}`)}` }} locale={displayLocale} onOpenPublicEvent={onOpenPublicEvent} />) : [])
  ] : project && dayDetails && dayInternal && displayDate ? [
    ...dayDetails.events.map((event) => <div key={`event-${event.id}`} role={onOpenEvent ? "button" : undefined} tabIndex={onOpenEvent ? 0 : undefined} onClick={() => onOpenEvent?.(event.id)} onKeyDown={(keyEvent) => { if (!onOpenEvent || (keyEvent.key !== "Enter" && keyEvent.key !== " ")) return; keyEvent.preventDefault(); onOpenEvent(event.id); }} style={{ fontSize: 12, border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#0f172a", cursor: onOpenEvent ? "pointer" : undefined }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><EventIcon icon={event.icon} locale={project.locale} size={14} /><strong style={{ color: "#f3f4f6" }}>{event.name}</strong><span style={{ marginLeft: "auto", color: "#cbd5e1", fontSize: 11 }}>{formatEventTimeShort(project, event)}</span><SecondaryButton type="button" style={{ padding: "4px 8px", fontSize: 11 }} onClick={(clickEvent) => { clickEvent.stopPropagation(); void import("../../obr/popupNotifications").then(({ sendPopupNotification }) => sendPopupNotification({ type: "event", audience: "players", title: event.name, body: event.playerDescription?.trim() || event.summary || event.name, date: `${displayDate.weekdayName} ${dayDetails.date.dayOfMonth} ${displayDate.monthName} ${dayDetails.date.year}`, icon: event.icon, summary: event.summary, playerDescription: event.playerDescription, timeLabel: formatEventTimeShort(project, event) })); }}>{t(project.locale, "common.send")}</SecondaryButton></div>{event.summary ? <div style={{ color: "#cbd5e1", marginTop: 4 }}>{event.summary}</div> : null}<div style={{ marginTop: 4, opacity: 0.86 }}><Badge>{t(project.locale, "events.visibility")}: {formatEventVisibility(project, event.visibility)}</Badge></div></div>),
    ...dayDetails.moonEvents.map((event) => {
      const moon = project.moons.find((item) => item.id === event.moonId);
      const remainingDays = getMoonEventRemainingDurationDays(project, event, dayInternal.absoluteDay);
      const durationLabel = remainingDays <= 1 ? t(project.locale, "events.allDay") : t(project.locale, "moonEvents.remainingDurationDays").replace("{count}", String(remainingDays));
      const dateLabel = `${displayDate.weekdayName} ${dayDetails.date.dayOfMonth} ${displayDate.monthName} ${dayDetails.date.year}`;
      const isManualPublication = event.visibilityMode === "manual";
      const isPublished = isLunarEventManuallyPublished(project, event.id);
      return <div key={`moon-${event.id}`} role={onOpenMoonEvent ? "button" : undefined} tabIndex={onOpenMoonEvent ? 0 : undefined} onClick={() => onOpenMoonEvent?.(event.id)} onKeyDown={(keyEvent) => { if (!onOpenMoonEvent || (keyEvent.key !== "Enter" && keyEvent.key !== " ")) return; keyEvent.preventDefault(); onOpenMoonEvent(event.id); }} style={{ fontSize: 12, border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#0f172a", cursor: onOpenMoonEvent ? "pointer" : undefined }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><span>{event.icon || "🌕"}</span><strong style={{ color: "#f3f4f6" }}>{event.name}</strong><span style={{ marginLeft: "auto", color: "#cbd5e1", fontSize: 11 }}>{durationLabel}</span><SecondaryButton type="button" style={{ padding: "4px 8px", fontSize: 11 }} onClick={(clickEvent) => { clickEvent.stopPropagation(); if (isManualPublication && onProjectUpdate) setMoonEventPublicationFromUi(project, event, !isPublished, onProjectUpdate, dateLabel); else notifyMoonEventToPlayers(project, event, dateLabel); }}>{isManualPublication && onProjectUpdate ? t(project.locale, isPublished ? "eventPublication.removeFromPlayers" : "eventPublication.sendToPlayers") : t(project.locale, "common.send")}</SecondaryButton></div><div style={{ color: "#cbd5e1", marginTop: 4 }}>{moon?.name ?? t(project.locale, "moonEvents.unknownMoon")} · {t(project.locale, `moon.phase.${event.phaseId}`)}</div>{event.summary ? <div style={{ color: "#cbd5e1", marginTop: 4 }}>{event.summary}</div> : null}<div style={{ marginTop: 4, opacity: 0.86, display: "flex", gap: 6, flexWrap: "wrap" }}><Badge>{t(project.locale, "moonEvents.eventKind")}</Badge><Badge>{t(project.locale, "events.visibility")}: {formatEventVisibility(project, event.visibility)}</Badge>{isManualPublication ? <Badge>{t(project.locale, isPublished ? "eventPublication.published" : "eventPublication.notPublished")}</Badge> : null}</div></div>;
    })
  ] : [];

  const publicNotes = isPlayer && publicDay && visibility?.showDayNotes ? publicDay.dayNotes : [];
  const showGmNotes = !isPlayer && project && dayDetails;
  const showCreateButton = !isPlayer && project && dayDetails && onCreateEventForDate;

  return (
    <div style={{ marginTop: 10, border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827" }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", minWidth: 0 }}>{headerItems}</div>
        <button type="button" onClick={onClose} title={t(displayLocale, "month.closeDayDetails")} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb", fontSize: 18, lineHeight: 1, cursor: "pointer", flexShrink: 0 }}>×</button>
      </div>
      {weatherLine.length > 0 ? <div style={{ fontSize: 12, marginBottom: 4, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>{weatherLine}</div> : null}
      {trendText ? <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>{trendText}</div> : null}
      <SectionCard style={{ marginTop: 8 }}>
        <SectionHeader title={t(displayLocale, "month.dayEvents")} />
        {eventRows.length === 0 ? <EmptyState text={isPlayer && publicDay && (publicDay.season || publicDay.weatherSummary || publicDay.dayNotes.length) ? t(displayLocale, "month.noEventsForDay") : t(displayLocale, isPlayer ? "player.noPublicDayDetails" : "month.noEventsForDay")} /> : <div style={{ display: "grid", gap: 4 }}>{eventRows}</div>}
        {showCreateButton && dayDetails ? <PrimaryButton type="button" onClick={() => onCreateEventForDate(dayDetails.date)} style={{ marginTop: 8, width: "100%" }}>{t(displayLocale, "month.createEventForDay")}</PrimaryButton> : null}
      </SectionCard>
      {publicNotes.length > 0 ? <SectionCard style={{ marginTop: 8 }}><SectionHeader title={t(displayLocale, "player.publicMonthNotes")} /><div style={{ display: "grid", gap: 6 }}>{publicNotes.map((note) => <div key={note.id} style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827", fontSize: 12, whiteSpace: "pre-wrap" }}>{note.playerNote}</div>)}</div></SectionCard> : null}
      {showGmNotes && project && dayDetails ? <SectionCard style={{ marginTop: 8 }}><SectionHeader title={t(displayLocale, "dayNotes.title")} /><Suspense fallback={null}><DayNotesEditor project={project} date={dayDetails.date} notes={notes} onProjectUpdate={onProjectUpdate} /></Suspense></SectionCard> : null}
    </div>
  );
};
const PublicMonthEventRow = ({ event, locale, onOpenPublicEvent }: { event: PublicEventDetails; locale: LocaleCode; onOpenPublicEvent?: (event: PublicEventDetails) => void }) => (
  <button key={event.id} type="button" onClick={onOpenPublicEvent ? () => onOpenPublicEvent(event) : undefined} style={{ fontSize: 12, border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#0f172a", cursor: onOpenPublicEvent ? "pointer" : undefined, width: "100%", textAlign: "left" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <EventIcon icon={event.icon} locale={locale} size={14} />
      <strong style={{ color: "#f3f4f6" }}>{event.name}</strong>
      {event.timeLabel ? <span style={{ marginLeft: "auto", color: "#cbd5e1", fontSize: 11 }}>{event.timeLabel}</span> : null}
    </div>
    {event.subtitle ? <div style={{ color: "#cbd5e1", marginTop: 4 }}>{event.subtitle}</div> : null}
    {event.summary ? <div style={{ color: "#cbd5e1", marginTop: 4 }}>{event.summary}</div> : null}
  </button>
);