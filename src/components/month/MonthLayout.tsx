import type { ReactNode } from "react";
import type { LocaleCode } from "../../domain/types";
import { t } from "../../i18n/messages";
import { SecondaryButton } from "../ui";

export type MonthLayoutVisibility = {
  showMonthGrid: boolean;
  showPublicEvents: boolean;
  showWeatherEvents: boolean;
  showMoonEvents: boolean;
  showDayNotes: boolean;
  showWeatherSummary: boolean;
  showFiveDayForecast: boolean;
};

export type MonthLayoutActions = {
  canNavigatePreviousNext: boolean;
  canGoToday: boolean;
  canSelectDay: boolean;
  canCreateEvent: boolean;
  canEditEvent: boolean;
  canOpenGmDetails: boolean;
};

export type MonthLayoutNavigation = {
  currentLabel: string;
  previousLabel: string;
  nextLabel: string;
  showTodayButton: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onToday?: () => void;
};

export const MonthLayout = ({
  locale,
  navigation,
  grid,
  forecast,
  selectedDay,
  visibility,
  actions
}: {
  locale: LocaleCode;
  navigation: MonthLayoutNavigation;
  grid?: ReactNode;
  forecast?: ReactNode;
  selectedDay?: ReactNode;
  visibility: MonthLayoutVisibility;
  actions: MonthLayoutActions;
}) => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 6, marginBottom: 8 }}>
      {actions.canNavigatePreviousNext ? <SecondaryButton type="button" title={t(locale, "month.previousMonth")} onClick={navigation.onPrevious} style={{ justifySelf: "start", padding: "6px 8px", fontSize: 12 }}>
        ‹ {navigation.previousLabel}
      </SecondaryButton> : <div />}
      <div style={{ textAlign: "center", display: "grid", justifyItems: "center", gap: 4 }}>
        <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: "nowrap" }}>{navigation.currentLabel}</div>
        {actions.canGoToday && navigation.showTodayButton ? <SecondaryButton type="button" onClick={navigation.onToday} style={{ padding: "2px 8px", fontSize: 11, lineHeight: 1.2 }}>
          {t(locale, "common.today")}
        </SecondaryButton> : null}
      </div>
      {actions.canNavigatePreviousNext ? <SecondaryButton type="button" title={t(locale, "month.nextMonth")} onClick={navigation.onNext} style={{ justifySelf: "end", padding: "6px 8px", fontSize: 12 }}>
        {navigation.nextLabel} ›
      </SecondaryButton> : <div />}
    </div>
    {visibility.showMonthGrid ? grid : null}
    {visibility.showFiveDayForecast ? forecast : null}
    {selectedDay}
  </>
);
