import type { CalendarProject, MoonPhase, Season, WeatherSnapshot } from "../../domain/types";
import { t } from "../../i18n/messages";
import { getWeatherStateIcon } from "../../calendar/weatherState";
import { EventIcon } from "../EventIcon";
import { Badge, Panel, SectionCard, SectionHeader } from "../ui";

type Props = {
  project: CalendarProject;
  currentSeason: Season | undefined;
  currentWeather: WeatherSnapshot | undefined;
  hourlyForecast: Array<{ offsetHours: number; weather: WeatherSnapshot }>;
  dailyForecast: Array<{ offsetDays: number; weather: WeatherSnapshot }>;
  triggeredWeatherEvents: CalendarProject["weatherEvents"];
  weatherUnits: { temperature: string; windSpeed: string; rain: string };
  currentMoonPhases: Array<{ moon: CalendarProject["moons"][number]; phase: MoonPhase }>;
};

const StatusSummary = ({ project, currentSeason, currentWeather, triggeredWeatherEvents, weatherUnits, currentMoonPhases }: Pick<Props, "project"|"currentSeason"|"currentWeather"|"triggeredWeatherEvents"|"weatherUnits"|"currentMoonPhases">) => {
  const override = (project.weatherOverrides ?? []).find((o) => o.absoluteDay === project.currentTime.absoluteDay);
  return (
    <SectionCard>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 13 }}>
        {currentSeason ? <span style={{ whiteSpace: "nowrap" }}>{currentSeason.icon ?? "🍃"} {currentSeason.name}</span> : null}
        {currentMoonPhases.map(({ moon, phase }) => <span key={moon.id} title={moon.name}>{moon.icon ?? phase.icon}</span>)}
      </div>
      <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 8, fontSize: 13 }}>
        {currentWeather ? (
          <>
            <span style={{ whiteSpace: "nowrap" }}>🌡️ {currentWeather.temperature} {weatherUnits.temperature}</span>
            <span style={{ whiteSpace: "nowrap" }}>💨 {currentWeather.windSpeed} {weatherUnits.windSpeed} {currentWeather.windDirection ?? ""}</span>
            <span style={{ whiteSpace: "nowrap" }}>🌧️ {currentWeather.rain} {weatherUnits.rain}</span>
            {currentWeather.dailyRainTotal !== undefined ? <span style={{ whiteSpace: "nowrap" }}>24 h: {currentWeather.dailyRainTotal} {weatherUnits.rain}</span> : null}
          </>
        ) : <span style={{ fontSize: 12, color: "#94a3b8" }}>{t(project.locale, "calendar.noWeather")}</span>}
      </div>
      {currentWeather?.trendKind || currentWeather?.dominantState ? (
        <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>
          {currentWeather?.trendKind ? `${t(project.locale, "weather.trend")}: ${t(project.locale, `weather.trend.${currentWeather.trendKind}`)}` : ""}
          {currentWeather?.trendKind && currentWeather?.dominantState ? " · " : ""}
          {currentWeather?.dominantState ? `${t(project.locale, "weather.dominantState")}: ${t(project.locale, `weather.state.${currentWeather.dominantState}`)}` : ""}
        </div>
      ) : null}
      {override ? <div style={{ marginTop: 6 }}><Badge tone="warning">{override.label?.trim() ? `${t(project.locale, "weatherOverride.active")}: ${override.label}` : t(project.locale, "weatherOverride.active")}</Badge></div> : null}

      {triggeredWeatherEvents.length > 0 ? <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
        {triggeredWeatherEvents.map((event) => (
          <Panel key={event.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><EventIcon icon={event.icon} locale={project.locale} /><strong>{event.name}</strong></div>
            {event.summary ? <div style={{ marginTop: 2, fontSize: 12, color: "#d1d5db" }}>{event.summary}</div> : null}
            {event.link?.trim() ? <a href={event.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#93c5fd" }}>{t(project.locale, "common.openLink")}</a> : null}
          </Panel>
        ))}
      </div> : null}
    </SectionCard>
  );
};

const ForecastCard = ({ project, hourlyForecast, dailyForecast, weatherUnits }: Pick<Props, "project"|"hourlyForecast"|"dailyForecast"|"weatherUnits">) => (
  <SectionCard>
    <SectionHeader title={t(project.locale, "calendar.forecast")} />
    <div style={{ display: "grid", gap: 4, fontSize: 12 }}>
      {hourlyForecast.map((entry) => <Panel key={entry.offsetHours}>+{entry.offsetHours} h · {getWeatherStateIcon(entry.weather.state ?? "clear")} {t(project.locale, `weather.state.${entry.weather.state ?? "clear"}`)} · {entry.weather.temperature} {weatherUnits.temperature} · {entry.weather.windDirection} {entry.weather.windSpeed} {weatherUnits.windSpeed} · {entry.weather.rain} {weatherUnits.rain}</Panel>)}
    </div>
    <div style={{ display: "grid", gap: 6, fontSize: 12, marginTop: 8 }}>
      {dailyForecast.map((entry) => <Panel key={entry.offsetDays}>
        <div>+{entry.offsetDays} {project.locale === "fr" ? "j" : "d"} · {getWeatherStateIcon(entry.weather.state ?? "clear")} {t(project.locale, `weather.state.${entry.weather.state ?? "clear"}`)} · {entry.weather.temperature} {weatherUnits.temperature}</div>
        <div style={{ color: "#94a3b8", marginTop: 2 }}>{entry.weather.dailyMinTemperature !== undefined && entry.weather.dailyMaxTemperature !== undefined ? `${t(project.locale, "weather.dailyMinMax")} ${entry.weather.dailyMinTemperature} / ${entry.weather.dailyMaxTemperature} ${weatherUnits.temperature} · ` : ""}{entry.weather.dailyRainTotal !== undefined ? `${t(project.locale, "weather.dailyRainTotal")} ${entry.weather.dailyRainTotal} ${weatherUnits.rain}` : ""}{entry.weather.trendKind ? ` · ${t(project.locale, "weather.trend")} ${t(project.locale, `weather.trend.${entry.weather.trendKind}`)}` : ""}{entry.weather.dominantState ? ` · ${t(project.locale, "weather.dominantState")} ${t(project.locale, `weather.state.${entry.weather.dominantState}`)}` : ""}</div>
      </Panel>)}
    </div>
  </SectionCard>
);

export const WeatherAndSeasonCard = ({ project, currentSeason, currentWeather, hourlyForecast, dailyForecast, triggeredWeatherEvents, weatherUnits, currentMoonPhases }: Props) => (
  <>
    <StatusSummary project={project} currentSeason={currentSeason} currentWeather={currentWeather} triggeredWeatherEvents={triggeredWeatherEvents} weatherUnits={weatherUnits} currentMoonPhases={currentMoonPhases} />
    <ForecastCard project={project} hourlyForecast={hourlyForecast} dailyForecast={dailyForecast} weatherUnits={weatherUnits} />
  </>
);