import type { LocaleCode } from "../../domain/types";
import type { CalendarNotification } from "../../calendar/notifications";
import { t } from "../../i18n/messages";
import { Badge, EmptyState, SecondaryButton, SectionCard, SectionHeader } from "../ui";

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
      <SectionCard>
        <SectionHeader title={t(locale, "notifications.title")} />
        <EmptyState text={t(locale, "notifications.empty")} />
      </SectionCard>
    );
  }

  return (
    <SectionCard style={{ borderColor: "#7c3aed", background: "#1f1147" }}>
      <SectionHeader title={t(locale, "notifications.title")} />
      <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
        {notifications.map((notification) => (
          <div key={notification.id} style={{ border: "1px solid #6d28d9", borderRadius: 6, padding: 6, background: "#2e1065" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <strong style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
                <Badge tone="warning">{t(locale, getNotificationLabelKey(notification.type))}</Badge>
                <span>
                {notification.title}
                </span>
              </strong>
              <SecondaryButton type="button" onClick={() => onDismiss(notification.id)} style={{ borderColor: "#6d28d9", background: "#1f1147", color: "#ddd6fe", padding: "3px 8px", fontSize: 11 }}>
                {t(locale, "notifications.dismiss")}
              </SecondaryButton>
              {onOpen ? <SecondaryButton type="button" onClick={() => onOpen(notification)} style={{ borderColor: "#6d28d9", background: "#1f1147", color: "#ddd6fe", padding: "3px 8px", fontSize: 11 }}>{t(locale, "notifications.open")}</SecondaryButton> : null}
            </div>
            {notification.summary ? <div style={{ fontSize: 12, color: "#e9d5ff", marginTop: 4 }}>{notification.summary}</div> : null}
          </div>
        ))}
      </div>
    </SectionCard>
  );
};