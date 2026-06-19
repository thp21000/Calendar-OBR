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
export const POPUP_NOTIFICATION_DEBUG_STORAGE_KEY = "calendar-obr.popupNotification.debug";
export const PUBLIC_PLAYER_NOTIFICATION_KEY = "com.gmtools.calendar-obr/publicPlayerNotificationLatest";
const SEEN_REMOTE_NOTIFICATION_STORAGE_PREFIX = "calendar-obr.popupNotification.remoteSeen.";
const NOTIFICATION_MODAL_WIDTH = 460;
const MIN_NOTIFICATION_MODAL_HEIGHT = 260;
const SHORT_NOTIFICATION_MODAL_HEIGHT = 320;
const MEDIUM_NOTIFICATION_MODAL_HEIGHT = 400;
const MAX_NOTIFICATION_MODAL_HEIGHT = 520;
const REMOTE_NOTIFICATION_DEDUP_MS = 5_000;
const recentRemoteNotificationKeys = new Map<string, number>();

const getStorage = (): Storage | undefined => {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
};

const isPopupNotificationDebugEnabled = (): boolean => {
  try {
    const storageEnabled = getStorage()?.getItem(POPUP_NOTIFICATION_DEBUG_STORAGE_KEY) === "1";
    const queryEnabled = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debugPopupNotifications") === "1";
    return storageEnabled || queryEnabled;
  } catch {
    return false;
  }
};

const debugPopupNotification = (message: string, details?: unknown): void => {
  if (!isPopupNotificationDebugEnabled()) return;
  if (details === undefined) console.debug(`[Calendar OBR popup] ${message}`);
  else console.debug(`[Calendar OBR popup] ${message}`, details);
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

export type PopupNotificationMessage = {
  type: "popup-notification";
  id: string;
  createdAt: number;
  payload: PopupNotificationPayload;
};

const isPopupNotificationMessage = (value: unknown): value is PopupNotificationMessage =>
  isRecord(value)
  && value.type === "popup-notification"
  && typeof value.id === "string"
  && value.id.trim().length > 0
  && typeof value.createdAt === "number"
  && Number.isFinite(value.createdAt)
  && isPopupNotificationPayload(value.payload);

const createPopupNotificationMessage = (payload: PopupNotificationPayload): PopupNotificationMessage => ({
  type: "popup-notification",
  id: `popup-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  createdAt: Date.now(),
  payload
});

const hasSeenRemoteNotification = (id: string): boolean =>
  getStorage()?.getItem(`${SEEN_REMOTE_NOTIFICATION_STORAGE_PREFIX}${id}`) === "1";

const markRemoteNotificationSeen = (id: string): void => {
  getStorage()?.setItem(`${SEEN_REMOTE_NOTIFICATION_STORAGE_PREFIX}${id}`, "1");
};

const getRemoteNotificationKey = (message: PopupNotificationMessage): string =>
  message.id || [message.payload.type, message.payload.audience, message.payload.title, message.payload.date, message.payload.timeLabel ?? "", message.payload.body, message.payload.playerDescription ?? ""].join("|");

const isDuplicateRemoteNotification = (message: PopupNotificationMessage, now = Date.now()): boolean => {
  for (const [key, timestamp] of recentRemoteNotificationKeys.entries()) {
    if (now - timestamp > REMOTE_NOTIFICATION_DEDUP_MS) recentRemoteNotificationKeys.delete(key);
  }

  const key = getRemoteNotificationKey(message);
  const previous = recentRemoteNotificationKeys.get(key);
  if (previous !== undefined && now - previous <= REMOTE_NOTIFICATION_DEDUP_MS) return true;
  recentRemoteNotificationKeys.set(key, now);
  return false;
};

const handleRemotePlayerNotification = async (message: PopupNotificationMessage, onNotification?: (payload: PopupNotificationPayload) => void): Promise<void> => {
  if (message.payload.audience !== "players") {
    debugPopupNotification("remote popup notification rejected: non-player audience", message.payload.audience);
    return;
  }
  if (hasSeenRemoteNotification(message.id) || isDuplicateRemoteNotification(message)) {
    debugPopupNotification("remote popup notification rejected: duplicate", message.payload.title);
    return;
  }

  markRemoteNotificationSeen(message.id);
  debugPopupNotification("remote popup notification accepted", { id: message.id, title: message.payload.title });
  onNotification?.(message.payload);
  try {
    debugPopupNotification("opening remote popup notification modal", message.id);
    await openLocalPopupNotification(message.payload);
  } catch (error) {
    debugPopupNotification("remote popup notification modal failed; integrated alert remains available", error);
  }
};

export const sendPopupNotificationToPlayers = async (payload: PopupNotificationPayload): Promise<void> => {
  if (payload.audience !== "players") {
    throw new Error("sendPopupNotificationToPlayers requires a players audience payload.");
  }

  const message = createPopupNotificationMessage(payload);

  if (!OBR.isAvailable) {
    console.info("[PopupNotification:players]", payload);
    return;
  }

  await OBR.room.setMetadata({ [PUBLIC_PLAYER_NOTIFICATION_KEY]: message });
  await OBR.broadcast.sendMessage(POPUP_NOTIFICATION_CHANNEL, message, { destination: "REMOTE" });
};

export const readLatestPlayerPopupNotification = async (): Promise<PopupNotificationMessage | null> => {
  if (!OBR.isAvailable) return null;

  return new Promise((resolve) => {
    OBR.onReady(async () => {
      try {
        const metadata = await OBR.room.getMetadata();
        const value = metadata[PUBLIC_PLAYER_NOTIFICATION_KEY];
        resolve(isPopupNotificationMessage(value) ? value : null);
      } catch (error) {
        debugPopupNotification("failed to read latest player popup notification", error);
        resolve(null);
      }
    });
  });
};

export const setupPopupNotificationListener = (viewerRole: ViewerRole, onNotification?: (payload: PopupNotificationPayload) => void): (() => void) => {
  debugPopupNotification("setupPopupNotificationListener", { viewerRole, obrAvailable: OBR.isAvailable });

  if (viewerRole === "gm") {
    debugPopupNotification("remote player notifications ignored on GM client");
    return () => undefined;
  }

  // Owlbear broadcasts are received only by clients that have loaded this addon code.
  // Cast/player clients count as non-GM listeners, but a Cast Receiver that never loads
  // the addon cannot open this modal from localStorage or a broadcast message.
  if (!OBR.isAvailable) {
    debugPopupNotification("remote player notification listener disabled outside OBR");
    return () => undefined;
  }

  let unsubscribe: () => void = () => undefined;
  OBR.onReady(() => {
    debugPopupNotification("subscribing to remote player popup notification channel", POPUP_NOTIFICATION_CHANNEL);
    const unsubscribeBroadcast = OBR.broadcast.onMessage(POPUP_NOTIFICATION_CHANNEL, (event) => {
      debugPopupNotification("remote popup notification message received", event.data);
      if (!isPopupNotificationMessage(event.data)) {
        debugPopupNotification("remote popup notification rejected: invalid message shape", event.data);
        return;
      }
      void handleRemotePlayerNotification(event.data, onNotification);
    });
    const unsubscribeMetadata = OBR.room.onMetadataChange((metadata) => {
      const message = metadata[PUBLIC_PLAYER_NOTIFICATION_KEY];
      debugPopupNotification("remote popup notification metadata received", message);
      if (!isPopupNotificationMessage(message)) {
        debugPopupNotification("remote popup notification metadata rejected: invalid message shape", message);
        return;
      }
      void handleRemotePlayerNotification(message, onNotification);
    });
    void readLatestPlayerPopupNotification().then((message) => {
      if (message) void handleRemotePlayerNotification(message, onNotification);
    });
    unsubscribe = () => {
      unsubscribeBroadcast();
      unsubscribeMetadata();
    };
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