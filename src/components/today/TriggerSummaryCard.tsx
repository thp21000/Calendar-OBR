import type { CalendarEvent, LocaleCode, WeatherEvent } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";

export const TriggerSummaryCard = ({
  locale,
  triggeredEvents,
  triggeredWeatherEvents,
  onDismiss
}: {
  locale: LocaleCode;
  triggeredEvents: CalendarEvent[];
  triggeredWeatherEvents: WeatherEvent[];
  onDismiss: () => void;
}) => {
  if (triggeredEvents.length === 0 && triggeredWeatherEvents.length === 0) return null;

  return (
    <div style={{ border: "1px solid #7c3aed", borderRadius: 8, padding: 8, marginBottom: 10, background: "#1f1147" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <strong style={{ fontSize: 13 }}>{t(locale, "calendar.newTriggers")}</strong>
        <button
          type="button"
          onClick={onDismiss}
          style={{ border: "1px solid #6d28d9", borderRadius: 6, background: "#2e1065", color: "#ddd6fe", padding: "3px 8px", fontSize: 11, cursor: "pointer" }}
        >
          {t(locale, "common.dismiss")}
        </button>
      </div>
      {triggeredEvents.length > 0 ? <div style={{ fontSize: 12, color: "#ddd6fe", marginTop: 5 }}>{t(locale, "calendar.triggeredEventsCount")} {triggeredEvents.length}</div> : null}
      {triggeredWeatherEvents.length > 0 ? <div style={{ fontSize: 12, color: "#ddd6fe", marginTop: 2 }}>{t(locale, "calendar.triggeredWeatherAlertsCount")} {triggeredWeatherEvents.length}</div> : null}
      <div style={{ display: "grid", gap: 4, marginTop: 6 }}>
        {triggeredWeatherEvents.map((event) => (
          <div key={`weather-${event.id}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#f3e8ff" }}>
            <EventIcon icon={event.icon} locale={locale} size={16} />
            <span>⚠️ {t(locale, "calendar.triggerTypeWeather")} — {event.name}</span>
          </div>
        ))}
        {triggeredEvents.map((event) => (
          <div key={`event-${event.id}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#f3e8ff" }}>
            <EventIcon icon={event.icon} locale={locale} size={16} />
            <span>📅 {t(locale, "calendar.triggerTypeEvent")} — {event.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
