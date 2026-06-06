import type { LocaleCode } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EmptyState, InfoRow, SectionCard, SectionHeader } from "../ui";
import type { PlayerViewModel } from "./playerViewModel";

export const PlayerWeatherCard = ({ locale, model }: { locale: LocaleCode; model: Pick<PlayerViewModel, "weather" | "biome"> }) => (
  <SectionCard>
    <SectionHeader title={t(locale, "player.weatherSummary")} />
    {!model.weather ? <EmptyState text={t(locale, "calendar.noWeather")} /> : <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#1f2937", display: "grid", placeItems: "center", fontSize: 24, border: "1px solid #374151" }}>{model.weather.stateIcon}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>{model.weather.stateLabel}</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(locale, "player.visibleToPlayers")}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, marginBottom: 10 }}>
        <Metric label={t(locale, "weather.temperature")} value={model.weather.temperature} />
        <Metric label={t(locale, "calendar.wind")} value={model.weather.wind} />
        <Metric label={t(locale, "calendar.rain")} value={model.weather.rain} />
      </div>
      {model.biome ? <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 8, background: "#0f172a" }}>
        <div style={{ fontSize: 12, fontWeight: 700 }}>{model.biome.icon} {t(locale, "player.currentBiome")}: {model.biome.name}</div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>{model.biome.description}</div>
      </div> : null}
      <InfoRow label={t(locale, "weather.dailyMinMax")} value={model.weather.dailyMinMax} />
      <InfoRow label={t(locale, "weather.rainAccumulation")} value={model.weather.dailyRainTotal} />
      <InfoRow label={t(locale, "weather.trend")} value={model.weather.trend} />
      <InfoRow label={t(locale, "weather.dominantState")} value={model.weather.dominantState} />
    </>}
  </SectionCard>
);

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 7, background: "#111827", minWidth: 0 }}>
    <div style={{ color: "#9ca3af", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
    <div style={{ color: "#e5e7eb", fontSize: 12, fontWeight: 700, overflowWrap: "anywhere" }}>{value}</div>
  </div>
);
