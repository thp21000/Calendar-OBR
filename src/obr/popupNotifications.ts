import OBR from "@owlbear-rodeo/sdk";
import { absoluteDayToCalendarDate } from "../calendar/dateEngine";
import type { CalendarNotification } from "../calendar/notifications";
import type { CalendarProject, InternalTime } from "../domain/types";
import type { ViewerRole } from "./playerRole";
import { t } from "../i18n/messages";

export type PopupNotificationType = "event" | "eventReminder" | "dayNote" | "weather" | "moon";

export type PopupNotificationPayload = {
  type: PopupNotificationType;
  audience: "gm" | "players";
  title: string;
  body: string;
  date: string;
  icon?: string;
  summary?: string;
  playerDescription?: string;
  gmDescription?: string;
  timeLabel?: string;
  link?: string;
};

export const POPUP_NOTIFICATION_CHANNEL = "com.gmtools.calendar-obr/popupNotification";
export const POPUP_NOTIFICATION_STORAGE_PREFIX = "calendar-obr.popupNotification.";
export const POPUP_NOTIFICATION_MODAL_ID_PREFIX = "calendar-obr-notification-modal";
const NOTIFICATION_MODAL_WIDTH = 460;
const MIN_NOTIFICATION_MODAL_HEIGHT = 260;
const SHORT_NOTIFICATION_MODAL_HEIGHT = 320;
const MEDIUM_NOTIFICATION_MODAL_HEIGHT = 400;
const MAX_NOTIFICATION_MODAL_HEIGHT = 520;

const getStorage = (): Storage | undefined => {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isPopupNotificationType = (value: unknown): value is PopupNotificationType =>
  value === "event" || value === "eventReminder" || value === "dayNote" || value === "weather" || value === "moon";

export const isPopupNotificationPayload = (value: unknown): value is PopupNotificationPayload =>
  isRecord(value)
  && isPopupNotificationType(value.type)
  && (value.audience === "gm" || value.audience === "players")
  && typeof value.title === "string"
  && typeof value.body === "string"
  && typeof value.date === "string";

export const savePopupNotificationPayload = (payload: PopupNotificationPayload): string => {
  const id = `notification-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  getStorage()?.setItem(`${POPUP_NOTIFICATION_STORAGE_PREFIX}${id}`, JSON.stringify(payload));
  return id;
};

export const readPopupNotificationPayload = (id: string): PopupNotificationPayload | undefined => {
  const raw = getStorage()?.getItem(`${POPUP_NOTIFICATION_STORAGE_PREFIX}${id}`);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isPopupNotificationPayload(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

export const clearPopupNotificationPayload = (id: string): void => {
  getStorage()?.removeItem(`${POPUP_NOTIFICATION_STORAGE_PREFIX}${id}`);
};

const getNotificationModalUrl = (notificationId: string, modalId: string): string => {
  const base = typeof window !== "undefined" ? window.location.href : "https://thp21000.github.io/Calendar-OBR/index.html";
  const url = new URL("index.html", base);
  url.searchParams.set("view", "notification");
  url.searchParams.set("notificationId", notificationId);
  url.searchParams.set("notificationModalId", modalId);
  return url.href;
};

export const estimateNotificationModalHeight = (payload: PopupNotificationPayload): number => {
  const textLength = [
    payload.title,
    payload.summary,
    payload.body,
    payload.playerDescription,
    payload.gmDescription,
    payload.link
  ].filter(Boolean).join(" ").length;

  if (textLength < 120) return MIN_NOTIFICATION_MODAL_HEIGHT;
  if (textLength < 300) return SHORT_NOTIFICATION_MODAL_HEIGHT;
  if (textLength < 600) return MEDIUM_NOTIFICATION_MODAL_HEIGHT;
  return MAX_NOTIFICATION_MODAL_HEIGHT;
};

export const openLocalPopupNotification = async (payload: PopupNotificationPayload): Promise<void> => {
  const notificationId = savePopupNotificationPayload(payload);
  const modalId = `${POPUP_NOTIFICATION_MODAL_ID_PREFIX}-${notificationId}`;

  if (!OBR.isAvailable) {
    console.info("[PopupNotification]", payload);
    return;
  }

  await OBR.modal.open({
    id: modalId,
    url: getNotificationModalUrl(notificationId, modalId),
    width: NOTIFICATION_MODAL_WIDTH,
    height: estimateNotificationModalHeight(payload)
  });
};

export const sendPopupNotification = openLocalPopupNotification;

type PopupNotificationMessage = {
  type: "popup-notification";
  payload: PopupNotificationPayload;
};

const isPopupNotificationMessage = (value: unknown): value is PopupNotificationMessage =>
  isRecord(value)
  && value.type === "popup-notification"
  && isPopupNotificationPayload(value.payload);

export const sendPopupNotificationToPlayers = async (payload: PopupNotificationPayload): Promise<void> => {
  if (payload.audience !== "players") {
    throw new Error("sendPopupNotificationToPlayers requires a players audience payload.");
  }

  if (!OBR.isAvailable) {
    console.info("[PopupNotification:players]", payload);
    return;
  }

  const message: PopupNotificationMessage = { type: "popup-notification", payload };
  await OBR.broadcast.sendMessage(POPUP_NOTIFICATION_CHANNEL, message, { destination: "REMOTE" });
};

export const setupPopupNotificationListener = (viewerRole: ViewerRole): (() => void) => {
  if (viewerRole !== "player" || !OBR.isAvailable) return () => undefined;

  let unsubscribe: () => void = () => undefined;
  OBR.onReady(() => {
    unsubscribe = OBR.broadcast.onMessage(POPUP_NOTIFICATION_CHANNEL, (event) => {
      if (!isPopupNotificationMessage(event.data)) return;
      if (event.data.payload.audience !== "players") return;
      void openLocalPopupNotification(event.data.payload);
    });
  });

  return () => unsubscribe();
};

const getCurrentDateLabel = (project: CalendarProject, time: InternalTime): string => {
  const date = absoluteDayToCalendarDate(time, project.calendarSystem);
  return `${date.weekdayName ?? ""} ${date.dayOfMonth} ${date.monthName} ${date.year}`.trim();
};

const getTimeLabel = (time: InternalTime): string => `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;

export const notificationToPopupPayload = (project: CalendarProject, notification: CalendarNotification, time: InternalTime): PopupNotificationPayload => {
  const date = getCurrentDateLabel(project, time);
  const timeLabel = getTimeLabel(time);

  if (notification.type === "event" || notification.type === "eventReminder") {
    const event = project.events.find((item) => item.id === notification.sourceId);
    const type = notification.type === "eventReminder" ? "eventReminder" : "event";
    return {
      type,
      audience: "gm",
      title: event?.name ?? notification.title,
      body: notification.type === "eventReminder"
        ? t(project.locale, "notifications.eventReminder")
        : event?.summary || notification.summary || event?.name || notification.title,
      date,
      timeLabel,
      icon: event?.icon,
      summary: event?.summary || notification.summary,
      playerDescription: event?.playerDescription,
      gmDescription: event?.gmDescription,
      link: event?.link
    };
  }

  if (notification.type === "weather") {
    const event = project.weatherEvents.find((item) => item.id === notification.sourceId);
    return {
      type: "weather",
      audience: "gm",
      title: event?.name ?? notification.title,
      body: event?.summary || notification.summary || event?.name || notification.title,
      date,
      timeLabel,
      icon: event?.icon,
      summary: event?.summary || notification.summary,
      playerDescription: event?.playerDescription,
      gmDescription: event?.gmDescription,
      link: event?.link
    };
  }

  const event = (project.moonEvents ?? []).find((item) => item.id === notification.sourceId);
  return {
    type: "moon",
    audience: "gm",
    title: event?.name ?? notification.title,
    body: event?.summary || notification.summary || event?.name || notification.title,
    date,
    timeLabel,
    icon: event?.icon,
    summary: event?.summary || notification.summary,
    playerDescription: event?.playerDescription,
    gmDescription: event?.gmDescription
  };
};