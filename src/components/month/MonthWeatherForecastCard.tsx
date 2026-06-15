import { useState } from "react";
import type { DailyWeatherForecastEntry } from "../../calendar/dayDetails";
import { getConfiguredWeatherStateIcon, getConfiguredWeatherTrendIcon, getWeatherStateLabel, getWeatherTrendLabel } from "../../calendar/weatherAdvancedSettings";
import { formatRainTotal, formatTemperature, formatWindSpeed } from "../../calendar/weatherUnits";
import type { CalendarProject, LocaleCode } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EmptyState, Panel, SectionCard } from "../ui";
import { ui } from "../ui/styles";
import { getTemperatureIcon, getWindDirectionIcon, getWindSpeedIcon } from "../today/weatherIcons";
import type { PublicMonthSnapshot } from "../../obr/publicSnapshot";
import type { PlayerForecastDetailLevel } from "../../domain/types";

const getForecastDateLabel = (project: CalendarProject, entry: DailyWeatherForecastEntry): string => {
  if (entry.offsetDays === 0) return t(project.locale, "common.today");
  const weekday = entry.date.weekdayName?.trim() ?? "";
  const month = entry.date.monthName?.trim() ?? "";
  const compactWeekday = weekday.length > 4 ? weekday.slice(0, 3) : weekday;
  const compactMonth = month.length > 4 ? month.slice(0, 3) : month;
  return `${compactWeekday} ${entry.date.dayOfMonth}${compactMonth ? ` ${compactMonth}` : ""}`.trim();
};

export const MonthWeatherForecastCard = ({ project, locale, forecast, mode = "gm", detailLevel = "precise", publicMonth }: { project?: CalendarProject; locale?: LocaleCode; forecast: DailyWeatherForecastEntry[]; mode?: "gm" | "player"; detailLevel?: PlayerForecastDetailLevel; readonly?: boolean; publicMonth?: PublicMonthSnapshot }) => {
  const [open, setOpen] = useState(false);
  const displayLocale = project?.locale ?? locale ?? "en";

  return (
    <SectionCard style={{ marginTop: 8 }}>
      <button type="button" onClick={() => setOpen((value) => !value)} style={forecastHeaderButtonStyle}>
        <span>{t(displayLocale, "weather.forecast5d")}</span>
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {open ? (
        mode === "player" ? ((publicMonth?.dailyForecast ?? []).length === 0 ? <EmptyState text={t(displayLocale, "calendar.noForecast")} /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(86px, 1fr))", gap: 6, width: "100%" }}>
            {(publicMonth?.dailyForecast ?? []).map((entry) => (
              <Panel key={entry.absoluteDay} style={{ background: ui.colors.surfaceSoft, minHeight: 110, padding: "6px 4px", textAlign: "center", fontSize: 11, display: "grid", alignContent: "center", gap: 3 }}>
                <div style={{ fontSize: 12, fontWeight: 800 }}>{entry.dateLabel}</div>
                <div>{entry.stateIcon} {entry.stateLabel}</div>
                {detailLevel === "precise" ? (
                  <>
                    {entry.averageTemperature !== undefined ? <div>{entry.averageTemperature} {entry.units.temperature}</div> : null}
                    {entry.averageWindSpeed !== undefined ? <div>{entry.averageWindSpeed} {entry.units.windSpeed}</div> : null}
                    {entry.rainTotal24h !== undefined ? <div>{t(displayLocale, "weather.rainAccumulation")}: {entry.rainTotal24h} {entry.units.rainTotal}</div> : null}
                  </>
                ) : entry.broadLabel ? <div>{entry.broadLabel}</div> : null}
              </Panel>
            ))}
          </div>
        )) : !project || forecast.length === 0 ? <EmptyState text={t(displayLocale, "calendar.noForecast")} /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(86px, 1fr))", gap: 6, width: "100%" }}>
            {forecast.map((entry) => (
              <Panel key={entry.absoluteDay} style={{ background: ui.colors.surfaceSoft, minHeight: 110, padding: "6px 4px", textAlign: "center", fontSize: 11, display: "grid", alignContent: "center", gap: 3 }}>
                <div style={{ fontSize: 12, fontWeight: 800 }}>{getForecastDateLabel(project, entry)}</div>
                {entry.dailyWeather ? (
                  <>
                    <div>{getConfiguredWeatherStateIcon(project, entry.dailyWeather.dominantState)} {getWeatherStateLabel(project, entry.dailyWeather.dominantState)}</div>
                    <div>{getTemperatureIcon(entry.dailyWeather.averageTemperature)} {formatTemperature(entry.dailyWeather.averageTemperature, project.units, project.locale)}</div>
                    <div>
                      {getWindSpeedIcon(entry.dailyWeather.averageWindSpeed)} {formatWindSpeed(entry.dailyWeather.averageWindSpeed, project.units, project.locale)}
                      {entry.dailyWeather.dominantWindDirection ? <span title={entry.dailyWeather.dominantWindDirection}> {getWindDirectionIcon(entry.dailyWeather.dominantWindDirection)}</span> : null}
                    </div>
                    <div>{t(project.locale, "weather.rainAccumulation")}: {formatRainTotal(entry.dailyWeather.rainTotal24h, project.units, project.locale)}</div>
                    {entry.dailyWeather.trendKind ? <div>{getConfiguredWeatherTrendIcon(project, entry.dailyWeather.trendKind)} {getWeatherTrendLabel(project, entry.dailyWeather.trendKind)}</div> : null}
                  </>
                ) : <div style={{ color: ui.colors.textMuted }}>{t(project.locale, "calendar.noWeather")}</div>}
              </Panel>
            ))}
          </div>
        )
      ) : null}
    </SectionCard>
  );
};

const forecastHeaderButtonStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  border: 0,
  background: "transparent",
  color: ui.colors.textPrimary,
  fontWeight: 800,
  cursor: "pointer",
  padding: 0,
  marginBottom: 4,
  textAlign: "left" as const
};
