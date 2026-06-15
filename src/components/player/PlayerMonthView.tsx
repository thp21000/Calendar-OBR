import { useMemo, useState } from "react";
import type { CalendarProject, InternalTime, LocaleCode, PlayerViewSettings } from "../../domain/types";
import { t } from "../../i18n/messages";
import { buildPublicMonthSnapshot, type PublicMonthDaySnapshot, type PublicMonthSnapshot } from "../../obr/publicSnapshot";
import type { PublicEventDetails } from "./PublicEventDetailsPopup";
import { EmptyState, SecondaryButton, SectionCard, SectionHeader } from "../ui";
import { PlayerPublicEventButton } from "./PlayerPublicEventsCard";

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

  return <div style={{ display: "grid", gap: 8 }}>
    <SectionCard>
      <SectionHeader title={t(locale, "player.monthTitle")} subtitle={month.monthLabel} />
      {!isSnapshotMode || showTodayButton ? <div style={{ display: "grid", gridTemplateColumns: isSnapshotMode ? "1fr" : "1fr auto 1fr", gap: 6, alignItems: "center", marginBottom: 8 }}>
        {!isSnapshotMode ? <SecondaryButton type="button" onClick={() => selectMonth(month.previousViewedTime)} style={{ justifySelf: "start", padding: "5px 8px", fontSize: 11 }}>‹ {month.previousMonthLabel}</SecondaryButton> : null}
        {showTodayButton ? <SecondaryButton type="button" onClick={selectToday} style={{ justifySelf: "center", padding: "3px 8px", fontSize: 11 }}>{t(locale, "common.today")}</SecondaryButton> : null}
        {!isSnapshotMode ? <SecondaryButton type="button" onClick={() => selectMonth(month.nextViewedTime)} style={{ justifySelf: "end", padding: "5px 8px", fontSize: 11 }}>{month.nextMonthLabel} ›</SecondaryButton> : null}
      </div> : null}
      {settings.month.showMonthGrid ? <PlayerMonthGrid month={month} selectedAbsoluteDay={selectedDay?.absoluteDay ?? null} onSelectDay={setSelectedAbsoluteDay} /> : <EmptyState text={t(locale, "player.monthHidden")} />}
    </SectionCard>
    {settings.month.showFiveDayForecast && month.dailyForecast && month.dailyForecast.length > 0 ? <PlayerFiveDayForecastCard month={month} detailLevel={settings.month.forecastDetailLevel} locale={locale} /> : null}
    {selectedDay ? <PlayerMonthDayDetails day={selectedDay} settings={settings} locale={locale} onSelectEvent={onSelectEvent} /> : null}
  </div>;
};

const PlayerMonthGrid = ({ month, selectedAbsoluteDay, onSelectDay }: { month: PublicMonthSnapshot; selectedAbsoluteDay: number | null; onSelectDay: (absoluteDay: number) => void }) => (
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
        const visibleMarkers = day.markers.slice(0, 2);
        const hiddenMarkers = Math.max(0, day.markers.length - visibleMarkers.length);
        return <button key={day.key} type="button" title={[day.dateLabel, ...day.markers.map((marker) => marker.label)].join(" — ")} onClick={() => onSelectDay(day.absoluteDay)} style={{ minHeight: 48, borderRadius: 8, border, background, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "4px 2px", width: "100%", cursor: "pointer", color: "#f3f4f6" }}>
          <span style={{ fontWeight: 700, lineHeight: 1 }}>{day.dayOfMonth}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 2, minHeight: 16 }}>
            {visibleMarkers.map((marker) => <span key={marker.id} title={marker.label} style={{ fontSize: 12, lineHeight: 1 }}>{marker.icon}</span>)}
            {hiddenMarkers > 0 ? <span style={{ fontSize: 10, lineHeight: 1, color: "#cbd5e1" }}>+{hiddenMarkers}</span> : null}
          </div>
        </button>;
      })}
    </div>
  </>
);

const PlayerMonthDayDetails = ({ day, settings, locale, onSelectEvent }: { day: PublicMonthDaySnapshot; settings: PlayerViewSettings; locale: LocaleCode; onSelectEvent: (event: PublicEventDetails) => void }) => {
  const hasContent = Boolean(day.season || day.weatherSummary || day.events.length || day.weatherEvents.length || day.moonEvents.length || day.dayNotes.length);
  return <SectionCard>
    <SectionHeader title={t(locale, "player.monthDayDetails")} subtitle={day.dateLabel} />
    {!hasContent ? <EmptyState text={t(locale, "player.noPublicDayDetails")} /> : <div style={{ display: "grid", gap: 8 }}>
      {settings.month.showWeatherSummary && day.season ? <InfoLine label={t(locale, "calendar.season")} value={`${day.season.icon ?? ""}${day.season.icon ? " " : ""}${day.season.name}`} /> : null}
      {settings.month.showWeatherSummary && day.weatherSummary ? <InfoLine label={t(locale, "player.weatherSummary")} value={`${day.weatherSummary.stateIcon} ${day.weatherSummary.stateLabel}${day.weatherSummary.temperatureLabel ? ` · ${day.weatherSummary.temperatureLabel}` : day.weatherSummary.broadLabel ? ` · ${day.weatherSummary.broadLabel}` : ""}`} /> : null}
      {settings.month.showPublicEvents ? <EventSection title={t(locale, "player.publicMonthEvents")} events={day.events} locale={locale} onSelectEvent={onSelectEvent} /> : null}
      {settings.month.showWeatherEvents && day.weatherEvents.length > 0 ? <EventSection title={t(locale, "player.publicMonthWeatherEvents")} events={day.weatherEvents} locale={locale} onSelectEvent={onSelectEvent} /> : null}
      {settings.month.showMoonEvents && day.moonEvents.length > 0 ? <EventSection title={t(locale, "player.publicMonthMoonEvents")} events={day.moonEvents.map((event) => ({ ...event, subtitle: `${event.moonName} · ${t(locale, `moon.phase.${event.phaseId}`)}` }))} locale={locale} onSelectEvent={onSelectEvent} /> : null}
      {settings.month.showDayNotes && day.dayNotes.length > 0 ? <div><div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{t(locale, "player.publicMonthNotes")}</div>{day.dayNotes.map((note) => <div key={note.id} style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827", fontSize: 12, whiteSpace: "pre-wrap" }}>{note.playerNote}</div>)}</div> : null}
    </div>}
  </SectionCard>;
};

const PlayerFiveDayForecastCard = ({ month, detailLevel, locale }: { month: PublicMonthSnapshot; detailLevel: PlayerViewSettings["month"]["forecastDetailLevel"]; locale: LocaleCode }) => (
  <SectionCard>
    <SectionHeader title={t(locale, "player.fiveDayForecast")} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(86px, 1fr))", gap: 6 }}>
      {(month.dailyForecast ?? []).map((entry) => <div key={entry.absoluteDay} style={{ border: "1px solid #374151", borderRadius: 8, padding: 6, background: "#111827", fontSize: 11, textAlign: "center", display: "grid", gap: 3 }}>
        <strong>{entry.dateLabel}</strong>
        <span>{entry.stateIcon} {entry.stateLabel}</span>
        {detailLevel === "precise" ? <>
          {entry.averageTemperature !== undefined ? <span>{entry.averageTemperature} {entry.units.temperature}</span> : null}
          {entry.averageWindSpeed !== undefined ? <span>{entry.averageWindSpeed} {entry.units.windSpeed}</span> : null}
          {entry.rainTotal24h !== undefined ? <span>{entry.rainTotal24h} {entry.units.rainTotal}</span> : null}
        </> : entry.broadLabel ? <span>{entry.broadLabel}</span> : null}
      </div>)}
    </div>
  </SectionCard>
);

const EventSection = ({ title, events, locale, onSelectEvent }: { title: string; events: PublicEventDetails[]; locale: LocaleCode; onSelectEvent: (event: PublicEventDetails) => void }) => (
  <div>
    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{title}</div>
    {events.length === 0 ? <EmptyState text={t(locale, "player.noPublicEvents")} /> : <div style={{ display: "grid", gap: 6 }}>{events.map((event) => <PlayerPublicEventButton key={event.id} event={event} onSelectEvent={onSelectEvent} />)}</div>}
  </div>
);

const InfoLine = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}><span style={{ color: "#9ca3af" }}>{label}</span><strong style={{ textAlign: "right" }}>{value}</strong></div>
);
