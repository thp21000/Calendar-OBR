import type { LocaleCode } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EmptyState, Panel, SectionCard, SectionHeader } from "../ui";
import type { PlayerHourlyForecastEntry } from "./playerViewModel";

export const PlayerHourlyForecastCard = ({ locale, forecast }: { locale: LocaleCode; forecast: PlayerHourlyForecastEntry[] }) => (
  <SectionCard>
    <SectionHeader title={t(locale, "player.hourlyForecast")} />
    {forecast.length === 0 ? <EmptyState text={t(locale, "calendar.noWeather")} /> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(74px, 1fr))", gap: 6 }}>
      {forecast.map((entry) => <Panel key={`${entry.offsetHours}:${entry.timeLabel}`} style={{ background: "#111827", minHeight: 94, padding: "6px 4px", textAlign: "center", fontSize: 11, display: "grid", alignContent: "center", gap: 3 }}>
        <div style={{ fontSize: 12, fontWeight: 800 }}>{entry.timeLabel}</div>
        <div title={entry.stateLabel}>{entry.stateIcon} {entry.stateLabel}</div>
        {entry.detailLevel === "precise" ? <>
          {entry.temperature ? <div>{entry.temperature}</div> : null}
          {entry.wind ? <div>{entry.wind}</div> : null}
          {entry.rain ? <div>{entry.rain}</div> : null}
        </> : <>
          {entry.broadTemperature ? <div>{entry.broadTemperature}</div> : null}
          {entry.broadWind ? <div>{entry.broadWind}</div> : null}
          {entry.broadRain ? <div>{entry.broadRain}</div> : null}
        </>}
      </Panel>)}
    </div>}
  </SectionCard>
);
