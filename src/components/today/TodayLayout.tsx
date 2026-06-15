import type { ReactNode } from "react";
import type { LocaleCode } from "../../domain/types";

export type TodayLayoutVisibility = {
  showStatus: boolean;
  showDate: boolean;
  showSeason: boolean;
  showWeather: boolean;
  showBiome: boolean;
  showMoons: boolean;
  showWeatherEvents: boolean;
  showEvents: boolean;
  showMoonEvents: boolean;
  showDayNotes: boolean;
  showHourlyForecast: boolean;
  showQuickActions: boolean;
};

export type TodayLayoutActions = {
  canEdit: boolean;
  canCreate: boolean;
  canChangeTime: boolean;
  canChangeBiome: boolean;
  canReset: boolean;
  canOpenGmDetails: boolean;
};

export const TodayLayout = ({
  status,
  events,
  forecast,
  quickActions,
  visibility,
  actions: actionPermissions
}: {
  locale: LocaleCode;
  status?: ReactNode;
  events?: ReactNode;
  forecast?: ReactNode;
  quickActions?: ReactNode;
  visibility: TodayLayoutVisibility;
  actions: TodayLayoutActions;
}) => (
  <>
    {visibility.showStatus ? status : null}
    {visibility.showEvents || visibility.showMoonEvents || visibility.showDayNotes ? events : null}
    {visibility.showHourlyForecast ? forecast : null}
    {visibility.showQuickActions && (actionPermissions.canChangeTime || actionPermissions.canChangeBiome || actionPermissions.canReset) ? quickActions : null}
  </>
);
