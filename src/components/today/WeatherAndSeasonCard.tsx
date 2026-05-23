import type { CalendarProject, MoonPhase, Season, WeatherSnapshot } from "../../domain/types";
import { t } from "../../i18n/messages";
import { getWeatherStateIcon } from "../../calendar/weatherState";
import { EventIcon } from "../EventIcon";

export const WeatherAndSeasonCard = ({
  project,
  currentSeason,
  currentWeather,
  hourlyForecast,
  dailyForecast,
  triggeredWeatherEvents,
  weatherUnits,
  currentMoonPhases
}: {
  project: CalendarProject;
  currentSeason: Season | undefined;
  currentWeather: WeatherSnapshot | undefined;
  hourlyForecast: Array<{ offsetHours: number; weather: WeatherSnapshot }>;
  dailyForecast: Array<{ offsetDays: number; weather: WeatherSnapshot }>;
  triggeredWeatherEvents: CalendarProject["weatherEvents"];
  weatherUnits: { temperature: string; windSpeed: string; rain: string };
  currentMoonPhases: Array<{ moon: CalendarProject["moons"][number]; phase: MoonPhase }>;
}) => (
  <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span>{t(project.locale, "calendar.season")}:</span>
      {currentSeason ? <><EventIcon icon={currentSeason.icon} locale={project.locale} size={16} /><span>{currentSeason.name}</span></> : <span>{t(project.locale, "calendar.noSeason")}</span>}
    </div>
    <div>
      {t(project.locale, "calendar.weather")}: {currentWeather
        ? `${getWeatherStateIcon(currentWeather.state ?? "clear")} ${t(project.locale, `weather.state.${currentWeather.state ?? "clear"}`)} · ${currentWeather.temperature} ${weatherUnits.temperature} · ${t(project.locale, "calendar.wind")} ${currentWeather.windDirection} ${currentWeather.windSpeed} ${weatherUnits.windSpeed} · ${t(project.locale, "calendar.rain")} ${currentWeather.rain} ${weatherUnits.rain}`
        : t(project.locale, "calendar.noWeather")}
    </div>
    {currentWeather?.dailyMinTemperature !== undefined && currentWeather?.dailyMaxTemperature !== undefined ? (
      <div style={{ fontSize: 12, color: "#d1d5db" }}>
        {t(project.locale, "weather.dailyMinMax")}: {currentWeather.dailyMinTemperature} / {currentWeather.dailyMaxTemperature} {weatherUnits.temperature}
      </div>
    ) : null}
    {currentWeather?.dailyRainTotal !== undefined ? (
      <div style={{ fontSize: 12, color: "#d1d5db" }}>
        {t(project.locale, "weather.dailyRainTotal")}: {currentWeather.dailyRainTotal} {weatherUnits.rain}
      </div>
    ) : null}
    {currentWeather?.dominantState ? (
      <div style={{ fontSize: 12, color: "#d1d5db" }}>
        {t(project.locale, "weather.dominantState")}: {getWeatherStateIcon(currentWeather.dominantState)} {t(project.locale, `weather.state.${currentWeather.dominantState}`)}
      </div>
    ) : null}
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 700 }}>{t(project.locale, "calendar.hourlyForecast")}</div>
      {hourlyForecast.length === 0 ? (
        <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "calendar.noForecast")}</div>
      ) : (
        <div style={{ display: "grid", gap: 2, fontSize: 12 }}>
          {hourlyForecast.map((entry) => (
            <div key={entry.offsetHours}>
             +{entry.offsetHours} h · {getWeatherStateIcon(entry.weather.state ?? "clear")} {t(project.locale, `weather.state.${entry.weather.state ?? "clear"}`)} · {entry.weather.temperature} {weatherUnits.temperature} · {entry.weather.windDirection}{" "}
              {entry.weather.windSpeed} {weatherUnits.windSpeed} · {entry.weather.rain} {weatherUnits.rain}
            </div>
          ))}
        </div>
      )}
    </div>
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 700 }}>{t(project.locale, "calendar.dailyForecast")}</div>
      {dailyForecast.length === 0 ? (
        <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "calendar.noForecast")}</div>
      ) : (
        <div style={{ display: "grid", gap: 2, fontSize: 12 }}>
          {dailyForecast.map((entry) => (
            <div key={entry.offsetDays}>
              +{entry.offsetDays} {project.locale === "fr" ? "j" : "d"} · {getWeatherStateIcon(entry.weather.state ?? "clear")} {t(project.locale, `weather.state.${entry.weather.state ?? "clear"}`)} · {entry.weather.temperature} {weatherUnits.temperature} ·{" "}
              {entry.weather.windDirection} {entry.weather.windSpeed} {weatherUnits.windSpeed} · {entry.weather.rain} {weatherUnits.rain}
            </div>
          ))}
        </div>
      )}
    </div>
    <div style={{ marginTop: 6 }}>
      <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{t(project.locale, "calendar.moons")}</div>
      {currentMoonPhases.length === 0 ? (
        <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "calendar.noMoon")}</div>
      ) : (
        <div style={{ display: "grid", gap: 2, fontSize: 12 }}>
          {currentMoonPhases.map(({ moon, phase }) => (
            <div key={moon.id}>
              {phase.icon} {moon.name} — {t(project.locale, `moon.phase.${phase.id}`)} — {phase.illumination} %
            </div>
          ))}
        </div>
      )}
    </div>
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
  </div>
);
