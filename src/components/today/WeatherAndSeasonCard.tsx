import { useState } from "react";
import { getConfiguredWeatherStateIcon, getConfiguredWeatherTrendIcon, getWeatherStateLabel, getWeatherTrendLabel } from "../../calendar/weatherAdvancedSettings";
import { formatRain, formatRainTotal, formatTemperature, formatWindSpeed } from "../../calendar/weatherUnits";
import { getWeatherOverrideForTime } from "../../calendar/weatherOverrides";
import { getCurrentWeatherBiomeDefinition } from "../../calendar/weather/biomes";
import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import type { CalendarProject, MoonPhase, Season, WeatherOverride, WeatherSnapshot } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";
import { Badge, Panel, SectionCard } from "../ui";
import { ui } from "../ui/styles";
import { getRainIcon, getTemperatureIcon, getWindDirectionIcon, getWindSpeedIcon } from "./weatherIcons";

type WeatherUnits = { temperature: string; windSpeed: string; rain: string; rainTotal: string };

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
  if (override.state) values.push(`${t(project.locale, "weatherOverride.state")} = ${getWeatherStateLabel(project, override.state)}`);
  if (override.dominantState) values.push(`${t(project.locale, "weatherOverride.dominantState")} = ${getWeatherStateLabel(project, override.dominantState)}`);
  if (typeof override.temperature === "number") values.push(`${t(project.locale, "weatherOverride.temperature")} = ${formatTemperature(override.temperature, project.units, project.locale)}`);
  if (typeof override.rain === "number") values.push(`${t(project.locale, "weatherOverride.rain")} = ${formatRain(override.rain, project.units, project.locale)}`);
  if (typeof override.dailyRainTotal === "number") values.push(`${t(project.locale, "weather.rainAccumulation")} = ${formatRainTotal(override.dailyRainTotal, project.units, project.locale)}`);
  if (typeof override.windSpeed === "number") values.push(`${t(project.locale, "weatherOverride.wind")} = ${formatWindSpeed(override.windSpeed, project.units, project.locale)}`);
  if (override.windDirection) values.push(`${t(project.locale, "weatherOverride.windDirection")} = ${override.windDirection}`);
  if (override.trendKind) values.push(`${t(project.locale, "weather.trend")} = ${getWeatherTrendLabel(project, override.trendKind)}`);
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
  const activeOverride = getWeatherOverrideForTime(project, project.currentTime.absoluteDay, project.currentTime.hour, project.currentTime.minute);
  const sceneWeatherOverride = activeOverride?.source === "sceneWeather" ? activeOverride : undefined;
  const override = activeOverride?.source === "sceneWeather" ? undefined : activeOverride;
  const forcedOverrideValues = override ? getForcedOverrideValues(project, override, weatherUnits) : [];
  const overrideIsTimed = isTimedOverride(override);
  const overrideTimeRange = overrideIsTimed ? `${formatMinuteOfDay(override.startMinuteOfDay)}–${formatMinuteOfDay(override.endMinuteOfDay)}` : undefined;
  const overrideName = override?.label?.trim();
  const overrideLabel = `${t(project.locale, "weatherOverride.active")}${overrideName ? `: ${overrideName}` : ""}${overrideTimeRange ? `${overrideName ? " · " : ": "}${overrideTimeRange}` : ""}`;
  const sceneWeatherLabel = sceneWeatherOverride?.label?.trim() || t(project.locale, "sceneWeather.title");
  const [sceneWeatherIconCandidate, ...sceneWeatherNameParts] = sceneWeatherLabel.split(" ");
  const sceneWeatherIcon = sceneWeatherNameParts.length > 0 ? sceneWeatherIconCandidate : "🎬";
  const sceneWeatherName = sceneWeatherNameParts.length > 0 ? sceneWeatherNameParts.join(" ") : sceneWeatherLabel;
  const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  const biome = getCurrentWeatherBiomeDefinition(project);

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

      <div style={biomeInlineStyle}>
        <span style={biomeIconStyle}>{biome.icon}</span>
        <div style={biomeTextStyle}>
          <strong>{t(project.locale, "weatherBiome.label")} {t(project.locale, biome.nameKey)}</strong>
          <span style={biomeDescriptionStyle}>{t(project.locale, biome.descriptionKey)}</span>
        </div>
      </div>

      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, rowGap: 6, fontSize: 13 }}>
        {currentWeather ? (
          <>
            {currentWeather.state ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                {getConfiguredWeatherStateIcon(project, currentWeather.state)} {getWeatherStateLabel(project, currentWeather.state)}
              </span>
            ) : null}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
              {getTemperatureIcon(currentWeather.temperature)} {formatTemperature(currentWeather.temperature, project.units, project.locale)}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
              {getWindSpeedIcon(currentWeather.windSpeed)} {formatWindSpeed(currentWeather.windSpeed, project.units, project.locale)}
              {currentWeather.windDirection ? (
                <span title={currentWeather.windDirection}>{getWindDirectionIcon(currentWeather.windDirection)}</span>
              ) : null}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{getRainIcon(currentWeather)} {formatRain(currentWeather.rain, project.units, project.locale)}</span>
            {currentWeather.dailyRainTotal !== undefined ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{t(project.locale, "weather.rainAccumulation")}: {formatRainTotal(currentWeather.dailyRainTotal, project.units, project.locale)}</span> : null}
          </>
        ) : <span style={{ fontSize: 12, color: "#94a3b8" }}>{t(project.locale, "calendar.noWeather")}</span>}
      </div>

      {currentWeather?.trendKind || currentWeather?.dominantState ? (
        <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>
          {currentWeather?.trendKind ? `${getConfiguredWeatherTrendIcon(project, currentWeather.trendKind)} ${t(project.locale, "weather.trend")}: ${getWeatherTrendLabel(project, currentWeather.trendKind)}` : ""}
          {currentWeather?.trendKind && currentWeather?.dominantState ? " · " : ""}
          {currentWeather?.dominantState ? `${t(project.locale, "weather.dominantState")}: ${getWeatherStateLabel(project, currentWeather.dominantState)}` : ""}
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

      {sceneWeatherOverride || triggeredWeatherEvents.length > 0 ? <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
        {sceneWeatherOverride ? (
          <div style={{ background: ui.colors.surface, border: `1px solid ${ui.colors.border}`, borderRadius: ui.radius.md, padding: ui.spacing.sm }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <EventIcon icon={sceneWeatherIcon} locale={project.locale} />
              <strong>{sceneWeatherName}</strong>
            </div>
            <div style={{ marginTop: 2, fontSize: 12, color: ui.colors.textSecondary }}>{t(project.locale, "sceneWeather.activeAlert")}</div>
          </div>
        ) : null}
        {triggeredWeatherEvents.map((event) => (
          <div
            key={event.id}
            role={onSelectWeatherEvent ? "button" : undefined}
            tabIndex={onSelectWeatherEvent ? 0 : undefined}
            onClick={() => onSelectWeatherEvent?.(event.id)}
            onKeyDown={(keyEvent) => {
              if (!onSelectWeatherEvent || (keyEvent.key !== "Enter" && keyEvent.key !== " ")) return;
              keyEvent.preventDefault();
              onSelectWeatherEvent(event.id);
            }}
            style={{ background: ui.colors.surface, border: `1px solid ${ui.colors.border}`, borderRadius: ui.radius.md, padding: ui.spacing.sm, cursor: onSelectWeatherEvent ? "pointer" : undefined }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><EventIcon icon={event.icon} locale={project.locale} /><strong>{event.name}</strong></div>
            {event.summary ? <div style={{ marginTop: 2, fontSize: 12, color: ui.colors.textSecondary }}>{event.summary}</div> : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 4 }} onClick={(clickEvent) => clickEvent.stopPropagation()} onKeyDown={(keyEvent) => keyEvent.stopPropagation()}>
              {event.link?.trim() ? <a href={event.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: ui.colors.accent }}>{t(project.locale, "common.openLink")}</a> : null}
            </div>
          </div>
        ))}
      </div> : null}
    </SectionCard>
  );
};

const biomeInlineStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  color: ui.colors.textPrimary,
  display: "grid",
  gridTemplateColumns: "30px minmax(0, 1fr)",
  columnGap: 8,
  alignItems: "center"
};

const biomeIconStyle: React.CSSProperties = {
  width: 30,
  fontSize: 28,
  lineHeight: "30px",
  textAlign: "center",
  alignSelf: "center"
};

const biomeTextStyle: React.CSSProperties = {
  display: "grid",
  gap: 2,
  lineHeight: 1.25
};

const biomeDescriptionStyle: React.CSSProperties = {
  fontSize: 11,
  color: ui.colors.textSecondary,
  lineHeight: 1.25
};

const forecastHeaderButtonStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: ui.spacing.sm,
  padding: 0,
  border: 0,
  background: "transparent",
  color: ui.colors.textPrimary,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 700
};

export const WeatherForecastCard = ({ project, hourlyForecast, weatherUnits }: Pick<Props, "project"|"hourlyForecast"|"weatherUnits">) => {
  const [open, setOpen] = useState(true);
  return (
    <SectionCard>
      <button type="button" onClick={() => setOpen((value) => !value)} style={forecastHeaderButtonStyle}>
        <span>{t(project.locale, "weather.forecast5h")}</span>
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {open ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(74px, 1fr))", gap: 6, width: "100%" }}>
        {hourlyForecast.map((entry) => (
          <Panel key={entry.offsetHours} style={{ background: ui.colors.surfaceSoft, minHeight: 96, padding: "6px 4px", textAlign: "center", fontSize: 11, display: "grid", alignContent: "center", gap: 3 }}>
            <div style={{ fontSize: 12, fontWeight: 800 }}>+{entry.offsetHours} h</div>
            <div>{getTemperatureIcon(entry.weather.temperature)} {formatTemperature(entry.weather.temperature, project.units, project.locale)}</div>
            <div>
              {getWindSpeedIcon(entry.weather.windSpeed)} {formatWindSpeed(entry.weather.windSpeed, project.units, project.locale)}
              {entry.weather.windDirection ? <span title={entry.weather.windDirection}> {getWindDirectionIcon(entry.weather.windDirection)}</span> : null}
            </div>
            <div>{getRainIcon(entry.weather)} {formatRain(entry.weather.rain, project.units, project.locale)}</div>
            {entry.weather.trendKind ? <div>{getConfiguredWeatherTrendIcon(project, entry.weather.trendKind)} {getWeatherTrendLabel(project, entry.weather.trendKind)}</div> : null}
          </Panel>
        ))}
      </div> : null}
    </SectionCard>
  );
};

export const WeatherAndSeasonCard = ({ project, currentSeason, currentWeather, hourlyForecast, triggeredWeatherEvents, weatherUnits, currentMoonPhases, onSelectWeatherEvent }: Props) => (
  <>
    <TodayStatusSummary project={project} currentSeason={currentSeason} currentWeather={currentWeather} triggeredWeatherEvents={triggeredWeatherEvents} weatherUnits={weatherUnits} currentMoonPhases={currentMoonPhases} onSelectWeatherEvent={onSelectWeatherEvent} />
    <WeatherForecastCard project={project} hourlyForecast={hourlyForecast} weatherUnits={weatherUnits} />
  </>
);