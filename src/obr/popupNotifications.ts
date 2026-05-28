export type PopupNotificationPayload = {
  type: "event" | "dayNote" | "weather";
  audience: "gm" | "players";
  title: string;
  body: string;
  date: string;
  icon?: string;
  summary?: string;
  playerDescription?: string;
  timeLabel?: string;
};

export const sendPopupNotification = (payload: PopupNotificationPayload) => {
  console.info("[PopupPlaceholder]", payload);
};

