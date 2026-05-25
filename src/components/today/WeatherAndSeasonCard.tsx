import type { CalendarProject, MoonPhase, Season, WeatherSnapshot } from "../../domain/types";
import { t } from "../../i18n/messages";
import { getWeatherStateIcon } from "../../calendar/weatherState";
import { EventIcon } from "../EventIcon";

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

const rowStyle: React.CSSProperties = { fontSize: 12, color: "#d1d5db" };

const CurrentWeatherSummary = ({ project, currentSeason, currentWeather, weatherUnits }: Pick<Props, "project" | "currentSeason" | "currentWeather" | "weatherUnits">) => {
  const override = (project.weatherOverrides ?? []).find((o) => o.absoluteDay === project.currentTime.absoluteDay);
  return (
  <>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span>{t(project.locale, "calendar.season")}:</span>
      {currentSeason ? (
        <>
          <EventIcon icon={currentSeason.icon} locale={project.locale} size={16} />
          <span>{currentSeason.name}</span>
        </>
      ) : (
        <span>{t(project.locale, "calendar.noSeason")}</span>
      )}
    </div>

    <div style={rowStyle}>
      {t(project.locale, "calendar.weather")}: {currentWeather ? `${getWeatherStateIcon(currentWeather.state ?? "clear")} ${t(project.locale, `weather.state.${currentWeather.state ?? "clear"}`)}` : t(project.locale, "calendar.noWeather")}
    </div>

    {override ? (
      <div style={rowStyle}>{override.label?.trim() ? `${t(project.locale, "weatherOverride.active")}: ${override.label}` : t(project.locale, "weatherOverride.active")}</div>
    ) : null}

    {currentWeather ? (
      <div style={{ display: "grid", gap: 2 }}>
        <div style={rowStyle}>{currentWeather.temperature} {weatherUnits.temperature}</div>
        <div style={rowStyle}>{t(project.locale, "calendar.wind")}: {currentWeather.windDirection} {currentWeather.windSpeed} {weatherUnits.windSpeed}</div>
        <div style={rowStyle}>{t(project.locale, "calendar.rain")}: {currentWeather.rain} {weatherUnits.rain}</div>
        {currentWeather.dailyMinTemperature !== undefined && currentWeather.dailyMaxTemperature !== undefined ? (
          <div style={rowStyle}>{t(project.locale, "weather.dailyMinMax")}: {currentWeather.dailyMinTemperature} / {currentWeather.dailyMaxTemperature} {weatherUnits.temperature}</div>
        ) : null}
        {currentWeather.dailyRainTotal !== undefined ? (
          <div style={rowStyle}>{t(project.locale, "weather.dailyRainTotal")}: {currentWeather.dailyRainTotal} {weatherUnits.rain}</div>
        ) : null}
        {currentWeather.trendKind ? (
          <div style={rowStyle}>{t(project.locale, "weather.trend")}: {t(project.locale, `weather.trend.${currentWeather.trendKind}`)}</div>
        ) : null}
        {currentWeather.dominantState ? (
          <div style={rowStyle}>{t(project.locale, "weather.dominantState")}: {getWeatherStateIcon(currentWeather.dominantState)} {t(project.locale, `weather.state.${currentWeather.dominantState}`)}</div>
        ) : null}
      </div>
    ) : null}
  </>
);
}

const HourlyForecastList = ({ project, hourlyForecast, weatherUnits }: Pick<Props, "project" | "hourlyForecast" | "weatherUnits">) => (
  <div style={{ marginTop: 4 }}>
    <div style={{ fontSize: 12, fontWeight: 700 }}>{t(project.locale, "calendar.hourlyForecast")}</div>
    {hourlyForecast.length === 0 ? (
      <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "calendar.noForecast")}</div>
    ) : (
      <div style={{ display: "grid", gap: 2, fontSize: 12 }}>
        {hourlyForecast.map((entry) => (
          <div key={entry.offsetHours}>
            +{entry.offsetHours} h · {getWeatherStateIcon(entry.weather.state ?? "clear")} {t(project.locale, `weather.state.${entry.weather.state ?? "clear"}`)} · {entry.weather.temperature} {weatherUnits.temperature} · {entry.weather.windDirection} {entry.weather.windSpeed} {weatherUnits.windSpeed} · {entry.weather.rain} {weatherUnits.rain}
          </div>
        ))}
      </div>
    )}
  </div>
);

const DailyForecastList = ({ project, dailyForecast, weatherUnits }: Pick<Props, "project" | "dailyForecast" | "weatherUnits">) => (
  <div style={{ marginTop: 6 }}>
    <div style={{ fontSize: 12, fontWeight: 700 }}>{t(project.locale, "calendar.dailyForecast")}</div>
    {dailyForecast.length === 0 ? (
      <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "calendar.noForecast")}</div>
    ) : (
      <div style={{ display: "grid", gap: 6, fontSize: 12 }}>
        {dailyForecast.map((entry) => (
          <div key={entry.offsetDays}>
            <div>
              +{entry.offsetDays} {project.locale === "fr" ? "j" : "d"} · {getWeatherStateIcon(entry.weather.state ?? "clear")} {t(project.locale, `weather.state.${entry.weather.state ?? "clear"}`)} · {entry.weather.temperature} {weatherUnits.temperature} · {entry.weather.windDirection} {entry.weather.windSpeed} {weatherUnits.windSpeed} · {entry.weather.rain} {weatherUnits.rain}
            </div>
            <div style={{ color: "#9ca3af" }}>
              {entry.weather.trendKind ? `${t(project.locale, "weather.trend")} ${t(project.locale, `weather.trend.${entry.weather.trendKind}`)} · ` : ""}
              {entry.weather.dominantState ? `${t(project.locale, "weather.dominantState")} ${t(project.locale, `weather.state.${entry.weather.dominantState}`)} · ` : ""}
              {entry.weather.dailyMinTemperature !== undefined && entry.weather.dailyMaxTemperature !== undefined ? `${t(project.locale, "weather.dailyMinMax")} ${entry.weather.dailyMinTemperature} / ${entry.weather.dailyMaxTemperature} ${weatherUnits.temperature} · ` : ""}
              {entry.weather.dailyRainTotal !== undefined ? `${t(project.locale, "weather.dailyRainTotal")} ${entry.weather.dailyRainTotal} ${weatherUnits.rain}` : ""}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const MoonsSummary = ({ project, currentMoonPhases }: Pick<Props, "project" | "currentMoonPhases">) => (
  <div style={{ marginTop: 6 }}>
    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{t(project.locale, "calendar.moons")}</div>
    {currentMoonPhases.length === 0 ? (
      <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "calendar.noMoon")}</div>
    ) : (
      <div style={{ display: "grid", gap: 2, fontSize: 12 }}>
        {currentMoonPhases.map(({ moon, phase }) => (
          <div key={moon.id}>{phase.icon} {moon.name} — {t(project.locale, `moon.phase.${phase.id}`)} — {phase.illumination} %</div>
        ))}
      </div>
    )}
  </div>
);

const ActiveWeatherEventsList = ({ project, triggeredWeatherEvents }: Pick<Props, "project" | "triggeredWeatherEvents">) => (
  <div style={{ marginTop: 8 }}>
    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{t(project.locale, "calendar.weatherEvents")}</div>
    {triggeredWeatherEvents.length === 0 ? (
      <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "calendar.noActiveWeatherEvent")}</div>
    ) : (
      <div style={{ display: "grid", gap: 6 }}>
        {triggeredWeatherEvents.map((event) => (
          <div key={event.id} style={{ border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#111827" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <EventIcon icon={event.icon} locale={project.locale} />
              <strong>{event.name}</strong>
            </div>
            {event.summary ? <div style={{ marginTop: 4, fontSize: 12, color: "#d1d5db" }}>{event.summary}</div> : null}
            {event.link?.trim() ? (
              <a href={event.link} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 4, fontSize: 12, color: "#93c5fd" }}>
                {t(project.locale, "common.openLink")}
              </a>
            ) : null}
          </div>
        ))}
      </div>
    )}
  </div>
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
  <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
    <CurrentWeatherSummary project={project} currentSeason={currentSeason} currentWeather={currentWeather} weatherUnits={weatherUnits} />
    <HourlyForecastList project={project} hourlyForecast={hourlyForecast} weatherUnits={weatherUnits} />
    <DailyForecastList project={project} dailyForecast={dailyForecast} weatherUnits={weatherUnits} />
    <MoonsSummary project={project} currentMoonPhases={currentMoonPhases} />
    <ActiveWeatherEventsList project={project} triggeredWeatherEvents={triggeredWeatherEvents} />
  </div>
);