import type { CalendarProject, MoonPhase, Season, WeatherSnapshot } from "../../domain/types";
import { t } from "../../i18n/messages";
import { getWeatherStateIcon } from "../../calendar/weatherState";
import { EventIcon } from "../EventIcon";
import { Badge, EmptyState, Panel, SectionCard, SectionHeader } from "../ui";

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

const CurrentWeatherSummary = ({ project, currentSeason, currentWeather, weatherUnits }: Pick<Props, "project" | "currentSeason" | "currentWeather" | "weatherUnits">) => {
  const override = (project.weatherOverrides ?? []).find((o) => o.absoluteDay === project.currentTime.absoluteDay);

  return (
    <Panel style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: "#94a3b8" }}>{t(project.locale, "calendar.season")}</span>
        <span>
          {currentSeason ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <EventIcon icon={currentSeason.icon} locale={project.locale} size={16} /> {currentSeason.name}
            </span>
          ) : (
            t(project.locale, "calendar.noSeason")
          )}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: "#94a3b8" }}>{t(project.locale, "calendar.weather")}</span>
        <span>{currentWeather ? `${getWeatherStateIcon(currentWeather.state ?? "clear")} ${t(project.locale, `weather.state.${currentWeather.state ?? "clear"}`)}` : t(project.locale, "calendar.noWeather")}</span>
      </div>

      {override ? (
        <div style={{ marginBottom: 6 }}>
          <Badge tone="warning">{override.label?.trim() ? `${t(project.locale, "weatherOverride.active")}: ${override.label}` : t(project.locale, "weatherOverride.active")}</Badge>
        </div>
      ) : null}

      {currentWeather ? (
        <div style={{ display: "grid", gap: 2, fontSize: 12, color: "#cbd5e1" }}>
          <div>{currentWeather.temperature} {weatherUnits.temperature}</div>
          <div>{t(project.locale, "calendar.wind")}: {currentWeather.windDirection} {currentWeather.windSpeed} {weatherUnits.windSpeed}</div>
          <div>{t(project.locale, "calendar.rain")}: {currentWeather.rain} {weatherUnits.rain}</div>
          {currentWeather.dailyMinTemperature !== undefined && currentWeather.dailyMaxTemperature !== undefined ? <div>{t(project.locale, "weather.dailyMinMax")}: {currentWeather.dailyMinTemperature} / {currentWeather.dailyMaxTemperature} {weatherUnits.temperature}</div> : null}
          {currentWeather.dailyRainTotal !== undefined ? <div>{t(project.locale, "weather.dailyRainTotal")}: {currentWeather.dailyRainTotal} {weatherUnits.rain}</div> : null}
          {currentWeather.trendKind ? <div>{t(project.locale, "weather.trend")}: {t(project.locale, `weather.trend.${currentWeather.trendKind}`)}</div> : null}
          {currentWeather.dominantState ? <div>{t(project.locale, "weather.dominantState")}: {getWeatherStateIcon(currentWeather.dominantState)} {t(project.locale, `weather.state.${currentWeather.dominantState}`)}</div> : null}
        </div>
      ) : null}
    </Panel>
  );
};

const HourlyForecastList = ({ project, hourlyForecast, weatherUnits }: Pick<Props, "project" | "hourlyForecast" | "weatherUnits">) => (
  <Panel style={{ marginTop: 4 }}>
    <SectionHeader title={t(project.locale, "calendar.hourlyForecast")} />
    {hourlyForecast.length === 0 ? <EmptyState text={t(project.locale, "calendar.noForecast")} /> : (
      <div style={{ display: "grid", gap: 4, fontSize: 12 }}>
        {hourlyForecast.map((entry) => (
          <div key={entry.offsetHours} style={{ border: "1px solid #334155", borderRadius: 6, padding: 6 }}>
            +{entry.offsetHours} h · {getWeatherStateIcon(entry.weather.state ?? "clear")} {t(project.locale, `weather.state.${entry.weather.state ?? "clear"}`)} · {entry.weather.temperature} {weatherUnits.temperature} · {entry.weather.windDirection} {entry.weather.windSpeed} {weatherUnits.windSpeed} · {entry.weather.rain} {weatherUnits.rain}
          </div>
        ))}
      </div>
    )}
  </Panel>
);

const DailyForecastList = ({ project, dailyForecast, weatherUnits }: Pick<Props, "project" | "dailyForecast" | "weatherUnits">) => (
  <Panel style={{ marginTop: 6 }}>
    <SectionHeader title={t(project.locale, "calendar.dailyForecast")} />
    {dailyForecast.length === 0 ? <EmptyState text={t(project.locale, "calendar.noForecast")} /> : (
      <div style={{ display: "grid", gap: 6, fontSize: 12 }}>
        {dailyForecast.map((entry) => (
          <div key={entry.offsetDays} style={{ border: "1px solid #334155", borderRadius: 6, padding: 6 }}>
            <div>
              +{entry.offsetDays} {project.locale === "fr" ? "j" : "d"} · {getWeatherStateIcon(entry.weather.state ?? "clear")} {t(project.locale, `weather.state.${entry.weather.state ?? "clear"}`)} · {entry.weather.temperature} {weatherUnits.temperature} · {entry.weather.windDirection} {entry.weather.windSpeed} {weatherUnits.windSpeed} · {entry.weather.rain} {weatherUnits.rain}
            </div>
            <div style={{ color: "#94a3b8", marginTop: 2 }}>
              {entry.weather.trendKind ? `${t(project.locale, "weather.trend")} ${t(project.locale, `weather.trend.${entry.weather.trendKind}`)} · ` : ""}
              {entry.weather.dominantState ? `${t(project.locale, "weather.dominantState")} ${t(project.locale, `weather.state.${entry.weather.dominantState}`)} · ` : ""}
              {entry.weather.dailyMinTemperature !== undefined && entry.weather.dailyMaxTemperature !== undefined ? `${t(project.locale, "weather.dailyMinMax")} ${entry.weather.dailyMinTemperature} / ${entry.weather.dailyMaxTemperature} ${weatherUnits.temperature} · ` : ""}
              {entry.weather.dailyRainTotal !== undefined ? `${t(project.locale, "weather.dailyRainTotal")} ${entry.weather.dailyRainTotal} ${weatherUnits.rain}` : ""}
            </div>
          </div>
        ))}
      </div>
    )}
  </Panel>
);

const MoonsSummary = ({ project, currentMoonPhases }: Pick<Props, "project" | "currentMoonPhases">) => (
  <Panel style={{ marginTop: 6 }}>
    <SectionHeader title={t(project.locale, "calendar.moons")} />
    {currentMoonPhases.length === 0 ? <EmptyState text={t(project.locale, "calendar.noMoon")} /> : (
      <div style={{ display: "grid", gap: 2, fontSize: 12 }}>
        {currentMoonPhases.map(({ moon, phase }) => (
          <div key={moon.id}>{phase.icon} {moon.name} — {t(project.locale, `moon.phase.${phase.id}`)} — {phase.illumination} %</div>
        ))}
      </div>
    )}
  </Panel>
);

const ActiveWeatherEventsList = ({ project, triggeredWeatherEvents }: Pick<Props, "project" | "triggeredWeatherEvents">) => (
  <Panel style={{ marginTop: 8 }}>
    <SectionHeader title={t(project.locale, "calendar.weatherEvents")} />
    {triggeredWeatherEvents.length === 0 ? <EmptyState text={t(project.locale, "calendar.noActiveWeatherEvent")} /> : (
      <div style={{ display: "grid", gap: 6 }}>
        {triggeredWeatherEvents.map((event) => (
          <div key={event.id} style={{ border: "1px solid #334155", borderRadius: 6, padding: 6, background: "#1f2a40" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <EventIcon icon={event.icon} locale={project.locale} />
              <strong>{event.name}</strong>
            </div>
            {event.summary ? <div style={{ marginTop: 4, fontSize: 12, color: "#d1d5db" }}>{event.summary}</div> : null}
            {event.link?.trim() ? <a href={event.link} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 4, fontSize: 12, color: "#93c5fd" }}>{t(project.locale, "common.openLink")}</a> : null}
          </div>
        ))}
      </div>
    )}
  </Panel>
);

export const WeatherAndSeasonCard = ({
  project,
  currentSeason,
  currentWeather,
  hourlyForecast,
  dailyForecast,
  triggeredWeatherEvents,
  weatherUnits,
  currentMoonPhases
}: Props) => (
  <SectionCard>
    <SectionHeader title={t(project.locale, "today.context.title")} />
    <CurrentWeatherSummary project={project} currentSeason={currentSeason} currentWeather={currentWeather} weatherUnits={weatherUnits} />
    <HourlyForecastList project={project} hourlyForecast={hourlyForecast} weatherUnits={weatherUnits} />
    <DailyForecastList project={project} dailyForecast={dailyForecast} weatherUnits={weatherUnits} />
    <MoonsSummary project={project} currentMoonPhases={currentMoonPhases} />
    <ActiveWeatherEventsList project={project} triggeredWeatherEvents={triggeredWeatherEvents} />
  </SectionCard>
);