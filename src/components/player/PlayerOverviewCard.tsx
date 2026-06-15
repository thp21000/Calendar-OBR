import type { LocaleCode } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EmptyState, SectionCard, SectionHeader } from "../ui";
import type { PlayerViewModel } from "./playerViewModel";

type Props = {
  locale: LocaleCode;
  model: Pick<PlayerViewModel, "season" | "biome" | "weather" | "moons">;
  visibleBlocks: {
    season: boolean;
    weather: boolean;
    biome: boolean;
    moons: boolean;
  };
};

export const PlayerOverviewCard = ({ locale, model, visibleBlocks }: Props) => {
  const hasVisibleLine = visibleBlocks.season || visibleBlocks.weather || visibleBlocks.biome || visibleBlocks.moons;
  if (!hasVisibleLine) return null;

  return <SectionCard>
    <SectionHeader title={t(locale, "player.todaySummary")} />
    <div style={{ display: "grid", gap: 8 }}>
      {visibleBlocks.season ? <SummaryLine label={t(locale, "calendar.season")} value={model.season ? `${model.season.icon ?? ""}${model.season.icon ? " " : ""}${model.season.name}` : t(locale, "calendar.noSeason")} /> : null}
      {visibleBlocks.biome ? <SummaryLine label={t(locale, "player.currentBiome")} value={model.biome ? `${model.biome.icon} ${model.biome.name}` : "—"} /> : null}
      {visibleBlocks.weather ? <SummaryLine label={t(locale, "calendar.weather")} value={model.weather ? `${model.weather.stateIcon} ${model.weather.stateLabel}${model.weather.temperature ? ` · ${model.weather.temperature}` : ""}` : t(locale, "calendar.noWeather")} /> : null}
      {visibleBlocks.moons ? <div>
        <div style={{ color: "#9ca3af", fontSize: 11, marginBottom: 3 }}>{t(locale, "calendar.moons")}</div>
        {model.moons.length === 0 ? <EmptyState text={t(locale, "calendar.noMoon")} /> : <div style={{ display: "grid", gap: 4 }}>
          {model.moons.map((moon) => <div key={moon.id} style={{ fontSize: 12, color: "#e5e7eb" }}>{moon.icon} {moon.name} — {moon.phaseLabel}</div>)}
        </div>}
      </div> : null}
    </div>
  </SectionCard>;
};

const SummaryLine = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
    <span style={{ color: "#9ca3af" }}>{label}</span>
    <span style={{ color: "#e5e7eb", textAlign: "right", fontWeight: 700 }}>{value}</span>
  </div>
);