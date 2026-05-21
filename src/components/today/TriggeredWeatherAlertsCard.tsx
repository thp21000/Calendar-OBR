import type { LocaleCode, WeatherEvent } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";

export const TriggeredWeatherAlertsCard = ({ locale, weatherEvents }: { locale: LocaleCode; weatherEvents: WeatherEvent[] }) => (
  <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
    <div style={{ fontWeight: 700, marginBottom: 6 }}>{t(locale, "calendar.triggeredWeatherAlerts")}</div>
    {weatherEvents.length === 0 ? (
      <div style={{ color: "#9ca3af", fontSize: 12 }}>{t(locale, "calendar.noTriggeredWeatherAlerts")}</div>
    ) : (
      <div style={{ display: "grid", gap: 6 }}>
        {weatherEvents.map((event) => (
          <div key={event.id} style={{ border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#111827" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <EventIcon icon={event.icon} locale={locale} />
              <strong>{event.name}</strong>
            </div>
            {event.summary ? <div style={{ marginTop: 4, fontSize: 12, color: "#d1d5db" }}>{event.summary}</div> : null}
            {event.link?.trim() ? (
              <a href={event.link} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 4, fontSize: 12, color: "#93c5fd" }}>
                {t(locale, "common.openLink")}
              </a>
            ) : null}
          </div>
        ))}
      </div>
    )}
  </div>
);
