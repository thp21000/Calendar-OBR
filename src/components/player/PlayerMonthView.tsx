import { useMemo, useState } from "react";
import type { CalendarProject, InternalTime, LocaleCode, PlayerViewSettings } from "../../domain/types";
import { t } from "../../i18n/messages";
import { buildPublicMonthSnapshot, type PublicMonthDaySnapshot, type PublicMonthSnapshot } from "../../obr/publicSnapshot";
import type { PublicEventDetails } from "./PublicEventDetailsPopup";
import { EmptyState, Panel, SecondaryButton, SectionCard, SectionHeader } from "../ui";
import { ui } from "../ui/styles";
import { EventIcon } from "../EventIcon";

export const PlayerMonthView = ({
  project,
  snapshotMonth,
  isSnapshotMode,
  settings,
  locale,
  onSelectEvent
}: {
  project?: CalendarProject;
  snapshotMonth?: PublicMonthSnapshot;
  isSnapshotMode: boolean;
  settings: PlayerViewSettings;
  locale: LocaleCode;
  onSelectEvent: (event: PublicEventDetails) => void;
}) => {
  const [viewedTime, setViewedTime] = useState<InternalTime | undefined>(snapshotMonth?.viewedTime);
  const month = useMemo(
    () => isSnapshotMode
      ? snapshotMonth
      : project
        ? buildPublicMonthSnapshot(project, settings, viewedTime)
        : undefined,
    [isSnapshotMode, project, settings, snapshotMonth, viewedTime]
  );
  const [selectedAbsoluteDay, setSelectedAbsoluteDay] = useState<number | null>(month?.days.find((day) => day.isToday)?.absoluteDay ?? month?.days[0]?.absoluteDay ?? null);
  const selectedDay = useMemo(() => month?.days.find((day) => day.absoluteDay === selectedAbsoluteDay) ?? month?.days.find((day) => day.isToday) ?? month?.days[0], [month, selectedAbsoluteDay]);
  const monthHasAnyBlock = settings.month.showMonthGrid || settings.month.showPublicEvents || settings.month.showWeatherEvents || settings.month.showMoonEvents || settings.month.showDayNotes || settings.month.showWeatherSummary || settings.month.showFiveDayForecast;

  if (!monthHasAnyBlock) return <SectionCard><EmptyState text={t(locale, "player.noVisibleContent")} /></SectionCard>;
  if (!month) return <SectionCard><EmptyState text={t(locale, "player.monthUnavailable")} /></SectionCard>;

  const selectMonth = (nextViewedTime: InternalTime) => {
    const nextMonth = project ? buildPublicMonthSnapshot(project, settings, nextViewedTime) : month;
    setViewedTime(nextViewedTime);
    setSelectedAbsoluteDay(nextMonth.days.find((day) => day.isToday)?.absoluteDay ?? nextMonth.days[0]?.absoluteDay ?? null);
  };
  const todayInPublishedMonth = month.days.find((day) => day.isToday);
  const showTodayButton = !isSnapshotMode || Boolean(todayInPublishedMonth);
  const selectToday = () => {
    if (isSnapshotMode) {
      setSelectedAbsoluteDay(todayInPublishedMonth?.absoluteDay ?? null);
      return;
    }
    if (project) selectMonth(project.currentTime);
  };

  return <>
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 6, marginBottom: 8 }}>
      {!isSnapshotMode ? <SecondaryButton type="button" title={t(locale, "month.previousMonth")} onClick={() => selectMonth(month.previousViewedTime)} style={{ justifySelf: "start", padding: "6px 8px", fontSize: 12 }}>
        ‹ {month.previousMonthLabel}
      </SecondaryButton> : <div />}
      <div style={{ textAlign: "center", display: "grid", justifyItems: "center", gap: 4 }}>
        <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: "nowrap" }}>{month.monthLabel}</div>
        {showTodayButton ? <SecondaryButton type="button" onClick={selectToday} style={{ padding: "2px 8px", fontSize: 11, lineHeight: 1.2 }}>{t(locale, "common.today")}</SecondaryButton> : null}
      </div>
      {!isSnapshotMode ? <SecondaryButton type="button" title={t(locale, "month.nextMonth")} onClick={() => selectMonth(month.nextViewedTime)} style={{ justifySelf: "end", padding: "6px 8px", fontSize: 12 }}>
        {month.nextMonthLabel} ›
      </SecondaryButton> : <div />}
    </div>
    {settings.month.showMonthGrid ? <PlayerMonthGrid month={month} locale={locale} selectedAbsoluteDay={selectedDay?.absoluteDay ?? null} onSelectDay={setSelectedAbsoluteDay} /> : null}
    {settings.month.showFiveDayForecast ? <PlayerMonthWeatherForecastCard month={month} detailLevel={settings.month.forecastDetailLevel} locale={locale} /> : null}
    {selectedDay ? <PlayerDayDetailsPanel day={selectedDay} settings={settings} locale={locale} onSelectEvent={onSelectEvent} /> : null}
  </>;
};

const FALLBACK_EVENT_ICON = "◆";

const PlayerMonthGrid = ({ month, locale, selectedAbsoluteDay, onSelectDay }: { month: PublicMonthSnapshot; locale: LocaleCode; selectedAbsoluteDay: number | null; onSelectDay: (absoluteDay: number) => void }) => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${month.weekdays.length}, 1fr)`, gap: 4, marginBottom: 4 }}>
      {month.weekdays.map((weekday) => <div key={weekday} style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>{weekday}</div>)}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${month.weekdays.length}, 1fr)`, gap: 4 }}>
      {Array.from({ length: month.leadingEmptyDays }, (_, index) => <div key={`lead-${index}`} />)}
      {month.days.map((day) => {
        const isSelected = day.absoluteDay === selectedAbsoluteDay;
        const border = day.isToday && isSelected ? "2px solid #8b7cf6" : day.isToday ? "1px solid #94a3b8" : isSelected ? "1px solid #8b7cf6" : "1px solid rgba(255,255,255,0.14)";
        const background = day.isToday && isSelected ? "rgba(139,124,246,0.22)" : day.isToday ? "rgba(148,163,184,0.18)" : isSelected ? "rgba(139,124,246,0.12)" : "rgba(255,255,255,0.04)";
        const firstPublicEvent = day.events[0] ?? day.weatherEvents[0];
        const firstMoonEvent = day.moonEvents[0];
        const hasDayNotes = day.dayNotes.length > 0;
        const markerCount = day.events.length + day.weatherEvents.length + day.moonEvents.length + (day.season ? 1 : 0) + (hasDayNotes ? 1 : 0);
        const extraMarkers = markerCount > 2 ? markerCount - 2 : 0;
        return <button key={day.key} type="button" title={[day.dateLabel, ...day.markers.map((marker) => marker.label)].join(" — ")} onClick={() => onSelectDay(day.absoluteDay)} style={{ minHeight: 44, borderRadius: 8, border, background, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "4px 2px", width: "100%", cursor: "pointer", color: "#f3f4f6" }}>
          <span style={{ fontWeight: 700, lineHeight: 1 }}>{day.dayOfMonth}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 2, minHeight: 16 }}>
            {firstPublicEvent ? <EventIcon icon={firstPublicEvent.icon || FALLBACK_EVENT_ICON} locale={locale} size={14} /> : null}
            {!firstPublicEvent && firstMoonEvent ? <EventIcon icon={firstMoonEvent.icon || "🌕"} locale={locale} size={14} /> : null}
            {day.season ? <EventIcon icon={day.season.icon ?? "🍃"} locale={locale} size={14} /> : null}
            {hasDayNotes ? <span style={{ fontSize: 11, lineHeight: 1 }}>📝</span> : null}
            {extraMarkers > 0 ? <span style={{ fontSize: 10, lineHeight: 1, color: "#cbd5e1", opacity: 0.9 }}>+{extraMarkers}</span> : null}
          </div>
        </button>;
      })}
    </div>
  </>
);

const PlayerDayDetailsPanel = ({ day, settings, locale, onSelectEvent }: { day: PublicMonthDaySnapshot; settings: PlayerViewSettings; locale: LocaleCode; onSelectEvent: (event: PublicEventDetails) => void }) => {
  const hasContent = Boolean(day.season || day.weatherSummary || day.events.length || day.weatherEvents.length || day.moonEvents.length || day.dayNotes.length);
  const hasEventContent = Boolean(
    (settings.month.showPublicEvents && day.events.length) ||
    (settings.month.showWeatherEvents && day.weatherEvents.length) ||
    (settings.month.showMoonEvents && day.moonEvents.length)
  );
  return <div style={{ marginTop: 10, border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827" }}>
    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", minWidth: 0 }}>
        <span>{day.dateLabel}</span>
        {settings.month.showWeatherSummary && day.season ? <span>{day.season.icon ?? "🍃"} {day.season.name}</span> : null}
      </div>
    </div>
    {settings.month.showWeatherSummary && day.weatherSummary ? <div style={{ fontSize: 12, marginBottom: 4, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      <span>{day.weatherSummary.stateIcon} {day.weatherSummary.stateLabel}</span>
      {day.weatherSummary.temperatureLabel ? <span>{day.weatherSummary.temperatureLabel}</span> : null}
      {day.weatherSummary.broadLabel ? <span>{day.weatherSummary.broadLabel}</span> : null}
    </div> : null}
    <SectionCard style={{ marginTop: 8 }}>
      <SectionHeader title={t(locale, "month.dayEvents")} />
      {!hasEventContent ? <EmptyState text={hasContent ? t(locale, "month.noEventsForDay") : t(locale, "player.noPublicDayDetails")} /> : <div style={{ display: "grid", gap: 4 }}>
        {settings.month.showPublicEvents ? <EventSection title={t(locale, "player.publicMonthEvents")} events={day.events} locale={locale} onSelectEvent={onSelectEvent} /> : null}
        {settings.month.showWeatherEvents && day.weatherEvents.length > 0 ? <EventSection title={t(locale, "player.publicMonthWeatherEvents")} events={day.weatherEvents} locale={locale} onSelectEvent={onSelectEvent} /> : null}
        {settings.month.showMoonEvents && day.moonEvents.length > 0 ? <EventSection title={t(locale, "player.publicMonthMoonEvents")} events={day.moonEvents.map((event) => ({ ...event, subtitle: `${event.moonName} · ${t(locale, `moon.phase.${event.phaseId}`)}` }))} locale={locale} onSelectEvent={onSelectEvent} /> : null}
      </div>}
    </SectionCard>
    {settings.month.showDayNotes && day.dayNotes.length > 0 ? <SectionCard style={{ marginTop: 8 }}>
      <SectionHeader title={t(locale, "player.publicMonthNotes")} />
      <div style={{ display: "grid", gap: 6 }}>{day.dayNotes.map((note) => <div key={note.id} style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827", fontSize: 12, whiteSpace: "pre-wrap" }}>{note.playerNote}</div>)}</div>
    </SectionCard> : null}
  </div>;
};

const PlayerMonthWeatherForecastCard = ({ month, detailLevel, locale }: { month: PublicMonthSnapshot; detailLevel: PlayerViewSettings["month"]["forecastDetailLevel"]; locale: LocaleCode }) => {
  const [open, setOpen] = useState(false);
  return <SectionCard style={{ marginTop: 8 }}>
    <button type="button" onClick={() => setOpen((value) => !value)} style={monthForecastHeaderButtonStyle}>
      <span>{t(locale, "weather.forecast5d")}</span>
      <span aria-hidden="true">{open ? "▾" : "▸"}</span>
    </button>
    {open ? (month.dailyForecast ?? []).length === 0 ? <EmptyState text={t(locale, "calendar.noForecast")} /> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(86px, 1fr))", gap: 6, width: "100%" }}>
      {(month.dailyForecast ?? []).map((entry) => <Panel key={entry.absoluteDay} style={{ background: ui.colors.surfaceSoft, minHeight: 110, padding: "6px 4px", textAlign: "center", fontSize: 11, display: "grid", alignContent: "center", gap: 3 }}>
        <div style={{ fontSize: 12, fontWeight: 800 }}>{entry.dateLabel}</div>
        <div>{entry.stateIcon} {entry.stateLabel}</div>
        {detailLevel === "precise" ? <>
          {entry.averageTemperature !== undefined ? <div>{entry.averageTemperature} {entry.units.temperature}</div> : null}
          {entry.averageWindSpeed !== undefined ? <div>{entry.averageWindSpeed} {entry.units.windSpeed}</div> : null}
          {entry.rainTotal24h !== undefined ? <div>{t(locale, "weather.rainAccumulation")}: {entry.rainTotal24h} {entry.units.rainTotal}</div> : null}
        </> : entry.broadLabel ? <div>{entry.broadLabel}</div> : null}
      </Panel>)}
    </div> : null}
  </SectionCard>;
};

const EventSection = ({ title, events, locale, onSelectEvent }: { title: string; events: PublicEventDetails[]; locale: LocaleCode; onSelectEvent: (event: PublicEventDetails) => void }) => (
  <div>
    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{title}</div>
    {events.length === 0 ? <EmptyState text={t(locale, "player.noPublicEvents")} /> : <div style={{ display: "grid", gap: 4 }}>{events.map((event) => <button key={event.id} type="button" onClick={() => onSelectEvent(event)} style={{ fontSize: 12, border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#0f172a", cursor: "pointer", width: "100%", textAlign: "left" }}>
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

const monthForecastHeaderButtonStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  border: 0,
  background: "transparent",
  color: ui.colors.textPrimary,
  fontWeight: 800,
  cursor: "pointer",
  padding: 0,
  marginBottom: 4,
  textAlign: "left" as const
};