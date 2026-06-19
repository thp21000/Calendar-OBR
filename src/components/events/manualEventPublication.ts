import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import { setLunarEventManualPublication, setWeatherEventManualPublication } from "../../calendar/eventPublicationLogic";
import type { CalendarProject, MoonEvent, WeatherEvent } from "../../domain/types";
import { t } from "../../i18n/messages";

export const getCurrentDateLabel = (project: CalendarProject): string => {
  const date = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  return `${date.weekdayName ?? ""} ${date.dayOfMonth} ${date.monthName} ${date.year}`.trim();
};

const confirmSentToGm = (project: CalendarProject, eventName: string): void => {
  void import("../../obr/popupNotifications").then(({ openLocalPopupNotification }) => openLocalPopupNotification({
    type: "event",
    audience: "gm",
    title: t(project.locale, "eventPublication.sentToPlayersTitle").replace("{name}", eventName),
    body: t(project.locale, "eventPublication.sentToPlayersBody"),
    date: getCurrentDateLabel(project)
  }));
};

export const notifyWeatherEventToPlayers = (project: CalendarProject, event: WeatherEvent): void => {
  void import("../../obr/popupNotifications").then(({ sendPopupNotificationToPlayers }) => sendPopupNotificationToPlayers({
    type: "weather",
    audience: "players",
    title: event.name,
    body: event.playerDescription?.trim() || event.summary || event.name,
    date: getCurrentDateLabel(project),
    icon: event.icon,
    summary: event.summary,
    playerDescription: event.playerDescription,
    timeLabel: t(project.locale, "weatherEvents.activeWhileConditionsMet")
  }));
};

export const notifyMoonEventToPlayers = (project: CalendarProject, event: MoonEvent, contextDateLabel?: string): void => {
  void import("../../obr/popupNotifications").then(({ sendPopupNotificationToPlayers }) => sendPopupNotificationToPlayers({
    type: "moon",
    audience: "players",
    title: event.name,
    body: event.playerDescription?.trim() || event.summary || event.name,
    date: contextDateLabel ?? getCurrentDateLabel(project),
    icon: event.icon,
    summary: event.summary,
    playerDescription: event.playerDescription
  }));
};

export const setWeatherEventPublicationFromUi = (project: CalendarProject, event: WeatherEvent, published: boolean, onProjectUpdate: (project: CalendarProject) => void): void => {
  onProjectUpdate(setWeatherEventManualPublication(project, event.id, published));
  if (published) {
    notifyWeatherEventToPlayers(project, event);
    confirmSentToGm(project, event.name);
  }
};

export const setMoonEventPublicationFromUi = (project: CalendarProject, event: MoonEvent, published: boolean, onProjectUpdate: (project: CalendarProject) => void, contextDateLabel?: string): void => {
  onProjectUpdate(setLunarEventManualPublication(project, event.id, published));
  if (published) {
    notifyMoonEventToPlayers(project, event, contextDateLabel);
    confirmSentToGm(project, event.name);
  }
};
