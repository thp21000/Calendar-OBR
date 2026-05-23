import { t } from "../../i18n/messages";

type MoonRow = { id: string; text: string };

export const PlayerOverviewCard = ({ locale, seasonName, seasonIcon, weatherLabel, moons }: { locale: "fr" | "en"; seasonName?: string; seasonIcon?: string; weatherLabel: string; moons: MoonRow[] }) => (
  <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
    <div><strong>{t(locale, "calendar.season")}:</strong> {seasonName ? `${seasonIcon ?? ""}${seasonIcon ? " " : ""}${seasonName}` : t(locale, "calendar.noSeason")}</div>
    <div><strong>{t(locale, "calendar.weather")}:</strong> {weatherLabel}</div>
    <div style={{ marginTop: 6 }}>
      <strong>{t(locale, "calendar.moons")}:</strong>
      {moons.length === 0 ? (
        <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(locale, "calendar.noMoon")}</div>
      ) : (
        moons.map((m) => <div key={m.id}>{m.text}</div>)
      )}
    </div>
  </div>
);
