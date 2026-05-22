import type { LocaleCode } from "../../domain/types";
import type { CalendarNotification } from "../../calendar/notifications";
import { t } from "../../i18n/messages";

export const getNotificationLabelKey = (type: CalendarNotification["type"]): string => {
  if (type === "event") return "notifications.eventTriggered";
  if (type === "eventReminder") return "notifications.eventReminder";
  if (type === "weather") return "notifications.weatherTriggered";
  return "notifications.moonTriggered";
};

export const TriggerSummaryCard = ({
  locale,
  notifications,
  onDismiss,
  onOpen
}: {
  locale: LocaleCode;
  notifications: CalendarNotification[];
  onDismiss: (id: string) => void;
  onOpen?: (notification: CalendarNotification) => void;
}) => {
  if (notifications.length === 0) {
    return (
      <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
        <strong style={{ fontSize: 13 }}>{t(locale, "notifications.title")}</strong>
        <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>{t(locale, "notifications.empty")}</div>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #7c3aed", borderRadius: 8, padding: 8, marginBottom: 10, background: "#1f1147" }}>
      <strong style={{ fontSize: 13 }}>{t(locale, "notifications.title")}</strong>
      <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
        {notifications.map((notification) => (
          <div key={notification.id} style={{ border: "1px solid #6d28d9", borderRadius: 6, padding: 6, background: "#2e1065" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <strong style={{ fontSize: 12 }}>
                {t(locale, getNotificationLabelKey(notification.type))} — {notification.title}
              </strong>
              <button type="button" onClick={() => onDismiss(notification.id)} style={{ border: "1px solid #6d28d9", borderRadius: 6, background: "#1f1147", color: "#ddd6fe", padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>
                {t(locale, "notifications.dismiss")}
              </button>
              {onOpen ? <button type="button" onClick={() => onOpen(notification)} style={{ border: "1px solid #6d28d9", borderRadius: 6, background: "#1f1147", color: "#ddd6fe", padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>{t(locale, "notifications.open")}</button> : null}
            </div>
            {notification.summary ? <div style={{ fontSize: 12, color: "#e9d5ff", marginTop: 4 }}>{notification.summary}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
};