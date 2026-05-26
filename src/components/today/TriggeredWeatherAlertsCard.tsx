import type { LocaleCode, WeatherEvent } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";
import { Badge, SectionCard, SectionHeader } from "../ui";

export const TriggeredWeatherAlertsCard = ({ locale, weatherEvents }: { locale: LocaleCode; weatherEvents: WeatherEvent[] }) => {
  if (weatherEvents.length === 0) return null;

  return (
    <SectionCard>
      <SectionHeader title={t(locale, "calendar.triggeredWeatherAlerts")} />
      <div style={{ display: "grid", gap: 6 }}>
        {weatherEvents.map((event) => (
          <div key={event.id} style={{ border: "1px solid #334155", borderRadius: 6, padding: 6, background: "#1f2a40" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <EventIcon icon={event.icon} locale={locale} />
              <strong>{event.name}</strong>
              <span style={{ marginLeft: "auto" }}><Badge tone="warning">{t(locale, "calendar.triggeredWeatherAlerts")}</Badge></span>
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
    </SectionCard>
  );
};