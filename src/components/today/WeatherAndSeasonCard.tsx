import { getWeatherStateIcon } from "../../calendar/weatherState";
import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import type { CalendarProject, MoonPhase, Season, WeatherSnapshot } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";
import { Badge, Panel, SectionCard, SectionHeader } from "../ui";
import { ui } from "../ui/styles";
import { getRainIcon, getTemperatureIcon, getTrendIcon, getWindDirectionIcon, getWindSpeedIcon } from "./weatherIcons";

type Props = {
  project: CalendarProject;
  currentSeason: Season | undefined;
  currentWeather: WeatherSnapshot | undefined;
  hourlyForecast: Array<{ offsetHours: number; weather: WeatherSnapshot }>;
  triggeredWeatherEvents: CalendarProject["weatherEvents"];
  weatherUnits: { temperature: string; windSpeed: string; rain: string };
  currentMoonPhases: Array<{ moon: CalendarProject["moons"][number]; phase: MoonPhase }>;
};

export const TodayStatusSummary = ({ project, currentSeason, currentWeather, triggeredWeatherEvents, weatherUnits, currentMoonPhases }: Pick<Props, "project"|"currentSeason"|"currentWeather"|"triggeredWeatherEvents"|"weatherUnits"|"currentMoonPhases">) => {
  const override = (project.weatherOverrides ?? []).find((o) => o.absoluteDay === project.currentTime.absoluteDay);
  const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);

  return (
    <SectionCard>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 18, fontWeight: 800, lineHeight: 1.25 }}>
        <span style={{ whiteSpace: "nowrap" }}>{displayDate.weekdayName}</span>
        <span style={{ whiteSpace: "nowrap" }}>{displayDate.dayOfMonth}</span>
        <span style={{ whiteSpace: "nowrap" }}>{displayDate.monthName}</span>
        <span style={{ whiteSpace: "nowrap" }}>{displayDate.year}</span>
        <span style={{ whiteSpace: "nowrap" }}>{String(project.currentTime.hour).padStart(2, "0")}:{String(project.currentTime.minute).padStart(2, "0")}</span>
        {currentSeason ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{currentSeason.icon ?? "🍃"} {currentSeason.name}</span> : null}
        {currentMoonPhases.map(({ moon, phase }) => <span key={moon.id} title={t(project.locale, `moon.phase.${phase.id}`)} style={{ whiteSpace: "nowrap" }}>{moon.icon ?? phase.icon}</span>)}
      </div>

      <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 13 }}>
        {currentWeather ? (
          <>
            {currentWeather.state ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                {getWeatherStateIcon(currentWeather.state)} {t(project.locale, `weather.state.${currentWeather.state}`)}
              </span>
            ) : null}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
              {getTemperatureIcon(currentWeather.temperature)} {currentWeather.temperature} {weatherUnits.temperature}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
              {getWindSpeedIcon(currentWeather.windSpeed)} {currentWeather.windSpeed} {weatherUnits.windSpeed}
              {currentWeather.windDirection ? (
                <span title={currentWeather.windDirection}>{getWindDirectionIcon(currentWeather.windDirection)}</span>
              ) : null}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{getRainIcon(currentWeather)} {currentWeather.rain} {weatherUnits.rain}</span>
            {currentWeather.dailyRainTotal !== undefined ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>24 h: {currentWeather.dailyRainTotal} {weatherUnits.rain}</span> : null}
          </>
        ) : <span style={{ fontSize: 12, color: "#94a3b8" }}>{t(project.locale, "calendar.noWeather")}</span>}
      </div>

      {currentWeather?.trendKind || currentWeather?.dominantState ? (
        <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>
          {currentWeather?.trendKind ? `${getTrendIcon(currentWeather.trendKind)} ${t(project.locale, "weather.trend")}: ${t(project.locale, `weather.trend.${currentWeather.trendKind}`)}` : ""}
          {currentWeather?.trendKind && currentWeather?.dominantState ? " · " : ""}
          {currentWeather?.dominantState ? `${t(project.locale, "weather.dominantState")}: ${t(project.locale, `weather.state.${currentWeather.dominantState}`)}` : ""}
        </div>
      ) : null}

      {override ? <div style={{ marginTop: 6 }}><Badge tone="warning">{override.label?.trim() ? `${t(project.locale, "weatherOverride.active")}: ${override.label}` : t(project.locale, "weatherOverride.active")}</Badge></div> : null}

      {triggeredWeatherEvents.length > 0 ? <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
        {triggeredWeatherEvents.map((event) => (
          <Panel key={event.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><EventIcon icon={event.icon} locale={project.locale} /><strong>{event.name}</strong></div>
            {event.summary ? <div style={{ marginTop: 2, fontSize: 12, color: ui.colors.textSecondary }}>{event.summary}</div> : null}
            {event.link?.trim() ? <a href={event.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: ui.colors.accent }}>{t(project.locale, "common.openLink")}</a> : null}
          </Panel>
        ))}
      </div> : null}
    </SectionCard>
  );
};

export const WeatherForecastCard = ({ project, hourlyForecast, weatherUnits }: Pick<Props, "project"|"hourlyForecast"|"weatherUnits">) => (
  <SectionCard>
    <SectionHeader title={t(project.locale, "weather.forecast5h")} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(74px, 1fr))", gap: 6, width: "100%" }}>
      {hourlyForecast.map((entry) => (
        <Panel key={entry.offsetHours} style={{ padding: "6px 4px", textAlign: "center", fontSize: 11, display: "grid", gap: 3 }}>
          <div style={{ fontSize: 12, fontWeight: 800 }}>+{entry.offsetHours} h</div>
          <div>{getTemperatureIcon(entry.weather.temperature)} {entry.weather.temperature} {weatherUnits.temperature}</div>
          <div>
            {getWindSpeedIcon(entry.weather.windSpeed)} {entry.weather.windSpeed} {weatherUnits.windSpeed}
            {entry.weather.windDirection ? <span title={entry.weather.windDirection}> {getWindDirectionIcon(entry.weather.windDirection)}</span> : null}
          </div>
          <div>{getRainIcon(entry.weather)} {entry.weather.rain} {weatherUnits.rain}</div>
          {entry.weather.trendKind ? <div>{getTrendIcon(entry.weather.trendKind)} {t(project.locale, `weather.trend.${entry.weather.trendKind}`)}</div> : null}
        </Panel>
      ))}
    </div>
  </SectionCard>
);

export const WeatherAndSeasonCard = ({ project, currentSeason, currentWeather, hourlyForecast, triggeredWeatherEvents, weatherUnits, currentMoonPhases }: Props) => (
  <>
    <TodayStatusSummary project={project} currentSeason={currentSeason} currentWeather={currentWeather} triggeredWeatherEvents={triggeredWeatherEvents} weatherUnits={weatherUnits} currentMoonPhases={currentMoonPhases} />
    <WeatherForecastCard project={project} hourlyForecast={hourlyForecast} weatherUnits={weatherUnits} />
  </>
);