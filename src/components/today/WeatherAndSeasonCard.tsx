import { getWeatherStateIcon } from "../../calendar/weatherState";
import { getWeatherOverrideForTime } from "../../calendar/weatherOverrides";
import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import type { CalendarProject, MoonPhase, Season, WeatherOverride, WeatherSnapshot } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";
import { Badge, Panel, SecondaryButton, SectionCard, SectionHeader } from "../ui";
import { ui } from "../ui/styles";
import { getRainIcon, getTemperatureIcon, getTrendIcon, getWindDirectionIcon, getWindSpeedIcon } from "./weatherIcons";

type WeatherUnits = { temperature: string; windSpeed: string; rain: string };

const formatMinuteOfDay = (minutes: number): string => {
  const safeMinutes = Math.max(0, Math.min(1440, Math.trunc(minutes)));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const isTimedOverride = (override: WeatherOverride | undefined): override is WeatherOverride & { startMinuteOfDay: number; endMinuteOfDay: number } =>
  typeof override?.startMinuteOfDay === "number" && typeof override.endMinuteOfDay === "number";

const getForcedOverrideValues = (project: CalendarProject, override: WeatherOverride, weatherUnits: WeatherUnits): string[] => {
  const values: string[] = [];
  if (override.state) values.push(`${t(project.locale, "weatherOverride.state")} = ${t(project.locale, `weather.state.${override.state}`)}`);
  if (override.dominantState) values.push(`${t(project.locale, "weatherOverride.dominantState")} = ${t(project.locale, `weather.state.${override.dominantState}`)}`);
  if (typeof override.temperature === "number") values.push(`${t(project.locale, "weatherOverride.temperature")} = ${override.temperature} ${weatherUnits.temperature}`);
  if (typeof override.rain === "number") values.push(`${t(project.locale, "weatherOverride.rain")} = ${override.rain} ${weatherUnits.rain}`);
  if (typeof override.dailyRainTotal === "number") values.push(`24 h = ${override.dailyRainTotal} ${weatherUnits.rain}`);
  if (typeof override.windSpeed === "number") values.push(`${t(project.locale, "weatherOverride.wind")} = ${override.windSpeed} ${weatherUnits.windSpeed}`);
  if (override.windDirection) values.push(`${t(project.locale, "weatherOverride.windDirection")} = ${override.windDirection}`);
  if (override.trendKind) values.push(`${t(project.locale, "weather.trend")} = ${t(project.locale, `weather.trend.${override.trendKind}`)}`);
  return values;
};

type Props = {
  project: CalendarProject;
  currentSeason: Season | undefined;
  currentWeather: WeatherSnapshot | undefined;
  hourlyForecast: Array<{ offsetHours: number; weather: WeatherSnapshot }>;
  triggeredWeatherEvents: CalendarProject["weatherEvents"];
  weatherUnits: WeatherUnits;
  currentMoonPhases: Array<{ moon: CalendarProject["moons"][number]; phase: MoonPhase }>;
  onSelectWeatherEvent?: (eventId: string) => void;
};

export const TodayStatusSummary = ({ project, currentSeason, currentWeather, triggeredWeatherEvents, weatherUnits, currentMoonPhases, onSelectWeatherEvent }: Pick<Props, "project"|"currentSeason"|"currentWeather"|"triggeredWeatherEvents"|"weatherUnits"|"currentMoonPhases"|"onSelectWeatherEvent">) => {
  const override = getWeatherOverrideForTime(project, project.currentTime.absoluteDay, project.currentTime.hour, project.currentTime.minute);
  const forcedOverrideValues = override ? getForcedOverrideValues(project, override, weatherUnits) : [];
  const overrideIsTimed = isTimedOverride(override);
  const overrideTimeRange = overrideIsTimed ? `${formatMinuteOfDay(override.startMinuteOfDay)}–${formatMinuteOfDay(override.endMinuteOfDay)}` : undefined;
  const overrideName = override?.label?.trim();
  const overrideLabel = `${t(project.locale, "weatherOverride.active")}${overrideName ? `: ${overrideName}` : ""}${overrideTimeRange ? `${overrideName ? " · " : ": "}${overrideTimeRange}` : ""}`;
  const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);

  return (
    <SectionCard style={{ background: ui.colors.surfaceElevated, borderColor: "#475569", boxShadow: "0 2px 10px rgba(2,6,23,0.22)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 18, fontWeight: 800, lineHeight: 1.25 }}>
        <span style={{ whiteSpace: "nowrap" }}>{displayDate.weekdayName}</span>
        <span style={{ whiteSpace: "nowrap" }}>{displayDate.dayOfMonth}</span>
        <span style={{ whiteSpace: "nowrap" }}>{displayDate.monthName}</span>
        <span style={{ whiteSpace: "nowrap" }}>{displayDate.year}</span>
        <span style={{ whiteSpace: "nowrap" }}>{String(project.currentTime.hour).padStart(2, "0")}:{String(project.currentTime.minute).padStart(2, "0")}</span>
        {currentSeason ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{currentSeason.icon ?? "🍃"} {currentSeason.name}</span> : null}
        {currentMoonPhases.map(({ moon, phase }) => <span key={moon.id} title={t(project.locale, `moon.phase.${phase.id}`)} style={{ whiteSpace: "nowrap" }}>{moon.icon ?? phase.icon}</span>)}
      </div>

      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, rowGap: 6, fontSize: 13 }}>
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

      {override ? (
        <div style={{ marginTop: 6, display: "grid", gap: 4 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <Badge tone="warning">{overrideLabel}</Badge>
            {overrideIsTimed ? <Badge>{t(project.locale, "weatherOverride.activeTimedEffect")}</Badge> : null}
          </div>
          {forcedOverrideValues.length > 0 ? (
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {t(project.locale, "weatherOverride.forcedValues")}: {forcedOverrideValues.join(" · ")}
            </div>
          ) : null}
        </div>
      ) : null}

      {triggeredWeatherEvents.length > 0 ? <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
        {triggeredWeatherEvents.map((event) => (
          <Panel key={event.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><EventIcon icon={event.icon} locale={project.locale} /><strong>{event.name}</strong></div>
            {event.summary ? <div style={{ marginTop: 2, fontSize: 12, color: ui.colors.textSecondary }}>{event.summary}</div> : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 4 }}>
              {event.link?.trim() ? <a href={event.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: ui.colors.accent }}>{t(project.locale, "common.openLink")}</a> : null}
              {onSelectWeatherEvent ? <SecondaryButton type="button" onClick={() => onSelectWeatherEvent(event.id)} style={{ padding: "4px 8px", fontSize: 11 }}>{t(project.locale, "weatherEvents.openDetails")}</SecondaryButton> : null}
            </div>
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
        <Panel key={entry.offsetHours} style={{ background: ui.colors.surfaceSoft, minHeight: 96, padding: "6px 4px", textAlign: "center", fontSize: 11, display: "grid", alignContent: "center", gap: 3 }}>
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

export const WeatherAndSeasonCard = ({ project, currentSeason, currentWeather, hourlyForecast, triggeredWeatherEvents, weatherUnits, currentMoonPhases, onSelectWeatherEvent }: Props) => (
  <>
    <TodayStatusSummary project={project} currentSeason={currentSeason} currentWeather={currentWeather} triggeredWeatherEvents={triggeredWeatherEvents} weatherUnits={weatherUnits} currentMoonPhases={currentMoonPhases} onSelectWeatherEvent={onSelectWeatherEvent} />
    <WeatherForecastCard project={project} hourlyForecast={hourlyForecast} weatherUnits={weatherUnits} />
  </>
);