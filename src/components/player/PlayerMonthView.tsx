import { useEffect, useMemo, useState } from "react";
import type { CalendarProject, InternalTime, LocaleCode, PlayerViewSettings } from "../../domain/types";
import { t } from "../../i18n/messages";
import { buildPublicMonthSnapshot, type PublicMonthSnapshot } from "../../obr/publicSnapshot";
import type { PublicEventDetails } from "./PublicEventDetailsPopup";
import { EmptyState, SectionCard } from "../ui";
import { DayDetailsPanel } from "../month/DayDetailsPanel";
import { MonthGrid } from "../month/MonthGrid";
import { MonthLayout } from "../month/MonthLayout";
import { MonthWeatherForecastCard } from "../month/MonthWeatherForecastCard";

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
  const [selectedAbsoluteDay, setSelectedAbsoluteDay] = useState<number | null>(null);
  const selectedDay = useMemo(() => selectedAbsoluteDay === null ? undefined : month?.days.find((day) => day.absoluteDay === selectedAbsoluteDay), [month, selectedAbsoluteDay]);
  
  useEffect(() => {
    if (isSnapshotMode) setViewedTime(snapshotMonth?.viewedTime);
  }, [isSnapshotMode, snapshotMonth?.viewedTime?.absoluteDay, snapshotMonth?.viewedTime?.hour, snapshotMonth?.viewedTime?.minute]);

  useEffect(() => {
    if (selectedAbsoluteDay !== null && month && !month.days.some((day) => day.absoluteDay === selectedAbsoluteDay)) {
      setSelectedAbsoluteDay(null);
    }
  }, [month, selectedAbsoluteDay]);

  const monthHasAnyBlock = settings.month.showMonthGrid || settings.month.showPublicEvents || settings.month.showWeatherEvents || settings.month.showMoonEvents || settings.month.showDayNotes || settings.month.showWeatherSummary || settings.month.showFiveDayForecast;

  if (!monthHasAnyBlock) return <SectionCard><EmptyState text={t(locale, "player.noVisibleContent")} /></SectionCard>;
  if (!month) return <SectionCard><EmptyState text={t(locale, "player.monthUnavailable")} /></SectionCard>;

  const selectMonth = (nextViewedTime: InternalTime) => {
    setViewedTime(nextViewedTime);
    setSelectedAbsoluteDay(null);
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

  return <MonthLayout
    locale={locale}
    navigation={{
      currentLabel: month.monthLabel,
      previousLabel: month.previousMonthLabel,
      nextLabel: month.nextMonthLabel,
      showTodayButton,
      onPrevious: () => selectMonth(month.previousViewedTime),
      onNext: () => selectMonth(month.nextViewedTime),
      onToday: selectToday
    }}
    visibility={{
      showMonthGrid: settings.month.showMonthGrid,
      showPublicEvents: settings.month.showPublicEvents,
      showWeatherEvents: settings.month.showWeatherEvents,
      showMoonEvents: settings.month.showMoonEvents,
      showDayNotes: settings.month.showDayNotes,
      showWeatherSummary: settings.month.showWeatherSummary,
      showFiveDayForecast: settings.month.showFiveDayForecast
    }}
    actions={{
      canNavigatePreviousNext: !isSnapshotMode,
      canGoToday: showTodayButton,
      canSelectDay: true,
      canCreateEvent: false,
      canEditEvent: false,
      canOpenGmDetails: false
    }}
    grid={<MonthGrid mode="player" readonly publicMonth={month} locale={locale} selectedAbsoluteDay={selectedDay?.absoluteDay ?? null} onSelectPublicDay={setSelectedAbsoluteDay} />}
    forecast={<MonthWeatherForecastCard locale={locale} mode="player" readonly publicMonth={month} detailLevel={settings.month.forecastDetailLevel} forecast={[]} />}
    selectedDay={selectedDay ? <DayDetailsPanel
      locale={locale}
      mode="player"
      readonly
      publicDay={selectedDay}
      visibility={{
        showPublicEvents: settings.month.showPublicEvents,
        showWeatherEvents: settings.month.showWeatherEvents,
        showMoonEvents: settings.month.showMoonEvents,
        showDayNotes: settings.month.showDayNotes,
        showWeatherSummary: settings.month.showWeatherSummary
      }}
      notes={[]}
      onClose={() => setSelectedAbsoluteDay(null)}
      onOpenPublicEvent={onSelectEvent}
    /> : null}
  />;
};