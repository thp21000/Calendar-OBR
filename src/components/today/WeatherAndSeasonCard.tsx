import { useState } from "react";
import { getConfiguredWeatherStateIcon, getConfiguredWeatherTrendIcon, getWeatherStateLabel, getWeatherTrendLabel } from "../../calendar/weatherAdvancedSettings";
import { formatRain, formatRainTotal, formatTemperature, formatWindSpeed } from "../../calendar/weatherUnits";
import { getWeatherOverrideForTime } from "../../calendar/weatherOverrides";
import { getCurrentWeatherBiomeDefinition } from "../../calendar/weather/biomes";
import { getAdventureContextById, getAdventureContextLabel, normalizeAdventureContext } from "../../calendar/adventureContext";
import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import type { CalendarProject, MoonPhase, Season, WeatherOverride, WeatherSnapshot } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";
import { Badge, Panel, SectionCard } from "../ui";
import { ui } from "../ui/styles";
import { getRainIcon, getTemperatureIcon, getWindDirectionIcon, getWindSpeedIcon } from "./weatherIcons";
import type { PlayerHourlyForecastEntry, PlayerViewModel } from "../player/playerViewModel";
import type { PublicEventDetails } from "../player/PublicEventDetailsPopup";
import type { TodayLayoutVisibility } from "./TodayLayout";

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
  visibleWeatherEvents?: CalendarProject["weatherEvents"];
  hiddenWeatherEvents?: CalendarProject["weatherEvents"];
  hiddenWeatherEventReasons?: Record<string, string>;
  weatherUnits: WeatherUnits;
  currentMoonPhases: Array<{ moon: CalendarProject["moons"][number]; phase: MoonPhase }>;
  onSelectWeatherEvent?: (eventId: string) => void;
};

export const TodayStatusSummary = ({
  project,
  currentSeason,
  currentWeather,
  triggeredWeatherEvents,
  visibleWeatherEvents,
  hiddenWeatherEvents,
  hiddenWeatherEventReasons,
  weatherUnits,
  currentMoonPhases,
  onSelectWeatherEvent,
  mode = "gm",
  visibility,
  playerModel,
  onSelectPublicWeatherEvent
}: Pick<Props, "project"|"currentSeason"|"currentWeather"|"triggeredWeatherEvents"|"weatherUnits"|"currentMoonPhases"|"onSelectWeatherEvent"> & {
  visibleWeatherEvents?: CalendarProject["weatherEvents"];
  hiddenWeatherEvents?: CalendarProject["weatherEvents"];
  hiddenWeatherEventReasons?: Record<string, string>;
  mode?: "gm" | "player";
  readonly?: boolean;
  visibility?: Partial<TodayLayoutVisibility>;
  playerModel?: PlayerViewModel;
  onSelectPublicWeatherEvent?: (event: PublicEventDetails) => void;
}) => {
  const isPlayer = mode === "player" && Boolean(playerModel);
  const locale = playerModel?.locale ?? project.locale;
  const activeOverride = isPlayer ? undefined : getWeatherOverrideForTime(project, project.currentTime.absoluteDay, project.currentTime.hour, project.currentTime.minute);
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
  const showDate = isPlayer ? Boolean(visibility?.showDate) : true;
  const showSeason = isPlayer ? Boolean(visibility?.showSeason) : true;
  const showWeather = isPlayer ? Boolean(visibility?.showWeather) : true;
  const showBiome = isPlayer ? Boolean(visibility?.showBiome) : true;
  const showMoons = isPlayer ? Boolean(visibility?.showMoons) : true;
  const showWeatherEvents = isPlayer ? Boolean(visibility?.showWeatherEvents) : true;

  const topLineItems = [
    ...(showDate ? (isPlayer && playerModel ? playerModel.dateParts.map((part, index) => <span key={`date-${index}`} style={{ whiteSpace: "nowrap" }}>{part}</span>) : [
      <span key="weekday" style={{ whiteSpace: "nowrap" }}>{displayDate.weekdayName}</span>,
      <span key="day" style={{ whiteSpace: "nowrap" }}>{displayDate.dayOfMonth}</span>,
      <span key="month" style={{ whiteSpace: "nowrap" }}>{displayDate.monthName}</span>,
      <span key="year" style={{ whiteSpace: "nowrap" }}>{displayDate.year}</span>,
      <span key="time" style={{ whiteSpace: "nowrap" }}>{String(project.currentTime.hour).padStart(2, "0")}:{String(project.currentTime.minute).padStart(2, "0")}</span>
    ]) : []),
    showSeason && (isPlayer ? playerModel?.season : currentSeason) ? <span key="season" style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{isPlayer ? (playerModel?.season?.icon ?? "🍃") : (currentSeason?.icon ?? "🍃")} {isPlayer ? playerModel?.season?.name : currentSeason?.name}</span> : undefined,
    ...(showMoons ? (isPlayer && playerModel ? playerModel.moons.map((moon) => <span key={moon.id} title={`${moon.name} — ${moon.phaseLabel}`} style={{ whiteSpace: "nowrap" }}>{moon.icon}</span>) : currentMoonPhases.map(({ moon, phase }) => <span key={moon.id} title={t(project.locale, `moon.phase.${phase.id}`)} style={{ whiteSpace: "nowrap" }}>{moon.icon ?? phase.icon}</span>)) : [])
  ].filter((item): item is JSX.Element => Boolean(item));

  const adventureContextState = normalizeAdventureContext(project.adventureContext);
  const activeAdventureContexts = !isPlayer ? adventureContextState.activeContextIds.map((id) => getAdventureContextById({ ...project, adventureContext: adventureContextState }, id)).filter((context): context is NonNullable<typeof context> => Boolean(context)) : [];

  const biomeView = showBiome ? (isPlayer && playerModel?.biome ? {
    icon: playerModel.biome.icon,
    label: `${t(locale, "weatherBiome.label")} ${playerModel.biome.name}`,
    description: playerModel.biome.description
  } : !isPlayer ? {
    icon: biome.icon,
    label: `${t(project.locale, "weatherBiome.label")} ${t(project.locale, biome.nameKey)}`,
    description: t(project.locale, biome.descriptionKey)
  } : undefined) : undefined;

  const weatherNodes = showWeather ? (isPlayer && playerModel ? (playerModel.weather ? [
    <span key="state" style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{playerModel.weather.stateIcon} {playerModel.weather.stateLabel}</span>,
    ...(playerModel.weather.detailLevel === "precise" ? [
      playerModel.weather.temperature && playerModel.weather.temperatureCelsius !== undefined ? <span key="temp" style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{getTemperatureIcon(playerModel.weather.temperatureCelsius)} {playerModel.weather.temperature}</span> : undefined,
      playerModel.weather.windSpeed && playerModel.weather.windSpeedKmh !== undefined ? <span key="wind" style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{getWindSpeedIcon(playerModel.weather.windSpeedKmh)} {playerModel.weather.windSpeed}{playerModel.weather.windDirection ? <span title={playerModel.weather.windDirection}>{getWindDirectionIcon(playerModel.weather.windDirection)}</span> : null}</span> : undefined,
      playerModel.weather.rain && playerModel.weather.rainMm !== undefined ? <span key="rain" style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{getRainIcon({ rain: playerModel.weather.rainMm, state: playerModel.weather.state } as Parameters<typeof getRainIcon>[0])} {playerModel.weather.rain}</span> : undefined,
      playerModel.weather.dailyRainTotal ? <span key="rain-total" style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{t(locale, "weather.rainAccumulation")}: {playerModel.weather.dailyRainTotal}</span> : undefined
      ] : playerModel.weather.detailLevel === "narrative" ? [
      playerModel.weather.narrativeLabel ? <span key="narrative" style={{ whiteSpace: "normal" }}>{playerModel.weather.narrativeLabel}</span> : undefined
    ] : [
      playerModel.weather.broadTemperature ? <span key="broad-temp" style={{ whiteSpace: "nowrap" }}>{playerModel.weather.broadTemperature}</span> : undefined,
      playerModel.weather.broadWind ? <span key="broad-wind" style={{ whiteSpace: "nowrap" }}>{playerModel.weather.broadWind}</span> : undefined,
      playerModel.weather.broadRain ? <span key="broad-rain" style={{ whiteSpace: "nowrap" }}>{playerModel.weather.broadRain}</span> : undefined,
      playerModel.weather.broadSoil ? <span key="broad-soil" style={{ whiteSpace: "nowrap" }}>{playerModel.weather.broadSoil}</span> : undefined,
      playerModel.weather.broadTrend ? <span key="broad-trend" style={{ whiteSpace: "nowrap" }}>{playerModel.weather.broadTrend}</span> : undefined,
      playerModel.weather.broadDominant ? <span key="broad-dominant" style={{ whiteSpace: "nowrap" }}>{playerModel.weather.broadDominant}</span> : undefined
    ])
  ].filter((item): item is JSX.Element => Boolean(item)) : [<span key="empty" style={{ fontSize: 12, color: "#94a3b8" }}>{t(locale, "calendar.noWeather")}</span>]) : currentWeather ? [
    currentWeather.state ? <span key="state" style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{getConfiguredWeatherStateIcon(project, currentWeather.state)} {getWeatherStateLabel(project, currentWeather.state)}</span> : undefined,
    <span key="temp" style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{getTemperatureIcon(currentWeather.temperature)} {formatTemperature(currentWeather.temperature, project.units, project.locale)}</span>,
    <span key="wind" style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{getWindSpeedIcon(currentWeather.windSpeed)} {formatWindSpeed(currentWeather.windSpeed, project.units, project.locale)}{currentWeather.windDirection ? <span title={currentWeather.windDirection}>{getWindDirectionIcon(currentWeather.windDirection)}</span> : null}</span>,
    <span key="rain" style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{getRainIcon(currentWeather)} {formatRain(currentWeather.rain, project.units, project.locale)}</span>,
    currentWeather.dailyRainTotal !== undefined ? <span key="rain-total" style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{t(project.locale, "weather.rainAccumulation")}: {formatRainTotal(currentWeather.dailyRainTotal, project.units, project.locale)}</span> : undefined
  ].filter((item): item is JSX.Element => Boolean(item)) : [<span key="empty" style={{ fontSize: 12, color: "#94a3b8" }}>{t(project.locale, "calendar.noWeather")}</span>]) : [];

  const trendText = showWeather ? (isPlayer && playerModel?.weather?.detailLevel === "precise" && (playerModel.weather.trend || playerModel.weather.dominantStateLabel)
    ? `${playerModel.weather.trendKind && playerModel.weather.trend ? `${getConfiguredWeatherTrendIcon(project, playerModel.weather.trendKind)} ${t(locale, "weather.trend")}: ${playerModel.weather.trend}` : ""}${playerModel.weather.trend && playerModel.weather.dominantStateLabel ? " · " : ""}${playerModel.weather.dominantStateKind && playerModel.weather.dominantStateLabel ? `${t(locale, "weather.dominantState")}: ${getConfiguredWeatherStateIcon(project, playerModel.weather.dominantStateKind)} ${playerModel.weather.dominantStateLabel}` : ""}`
    : !isPlayer && (currentWeather?.trendKind || currentWeather?.dominantState)
      ? `${currentWeather?.trendKind ? `${getConfiguredWeatherTrendIcon(project, currentWeather.trendKind)} ${t(project.locale, "weather.trend")}: ${getWeatherTrendLabel(project, currentWeather.trendKind)}` : ""}${currentWeather?.trendKind && currentWeather?.dominantState ? " · " : ""}${currentWeather?.dominantState ? `${t(project.locale, "weather.dominantState")}: ${getWeatherStateLabel(project, currentWeather.dominantState)}` : ""}`
      : "") : "";

  const weatherEventsToDisplay = visibleWeatherEvents ?? triggeredWeatherEvents;
  const hiddenWeatherEventsToDisplay = hiddenWeatherEvents ?? [];
  const weatherEventRows = showWeatherEvents ? [
    ...(!isPlayer && sceneWeatherOverride ? [<div key="scene" style={{ background: ui.colors.surface, border: `1px solid ${ui.colors.border}`, borderRadius: ui.radius.md, padding: ui.spacing.sm }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><EventIcon icon={sceneWeatherIcon} locale={project.locale} /><strong>{sceneWeatherName}</strong></div><div style={{ marginTop: 2, fontSize: 12, color: ui.colors.textSecondary }}>{t(project.locale, "sceneWeather.activeAlert")}</div></div>] : []),
    ...(isPlayer && playerModel ? playerModel.weatherEvents.map((event) => <PublicWeatherEventRow key={event.id} locale={playerModel.locale} event={event} onSelectEvent={onSelectPublicWeatherEvent} />) : weatherEventsToDisplay.map((event) => <div key={event.id} role={onSelectWeatherEvent ? "button" : undefined} tabIndex={onSelectWeatherEvent ? 0 : undefined} onClick={() => onSelectWeatherEvent?.(event.id)} onKeyDown={(keyEvent) => { if (!onSelectWeatherEvent || (keyEvent.key !== "Enter" && keyEvent.key !== " ")) return; keyEvent.preventDefault(); onSelectWeatherEvent(event.id); }} style={{ background: ui.colors.surface, border: `1px solid ${ui.colors.border}`, borderRadius: ui.radius.md, padding: ui.spacing.sm, cursor: onSelectWeatherEvent ? "pointer" : undefined }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><EventIcon icon={event.icon} locale={project.locale} /><strong>{event.name}</strong></div>{event.summary ? <div style={{ marginTop: 2, fontSize: 12, color: ui.colors.textSecondary }}>{event.summary}</div> : null}<div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 4 }} onClick={(clickEvent) => clickEvent.stopPropagation()} onKeyDown={(keyEvent) => keyEvent.stopPropagation()}>{event.link?.trim() ? <a href={event.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: ui.colors.accent }}>{t(project.locale, "common.openLink")}</a> : null}</div></div>)),
    ...(!isPlayer && hiddenWeatherEventsToDisplay.length > 0 ? [<details key="hidden-weather" style={{ fontSize: 12, color: ui.colors.textSecondary }}><summary>{t(project.locale, "eventDisplay.hiddenEvents")}</summary><div style={{ display: "grid", gap: 4, marginTop: 6 }}>{hiddenWeatherEventsToDisplay.map((event) => <button key={event.id} type="button" onClick={() => onSelectWeatherEvent?.(event.id)} style={{ border: `1px dashed ${ui.colors.border}`, borderRadius: ui.radius.md, padding: ui.spacing.sm, background: "#0f172a", color: ui.colors.textPrimary, textAlign: "left", cursor: onSelectWeatherEvent ? "pointer" : "default" }}><EventIcon icon={event.icon} locale={project.locale} /> {event.name} <span style={{ color: ui.colors.textSecondary }}>— {t(project.locale, `eventDisplay.hiddenReason.${hiddenWeatherEventReasons?.[event.id] ?? "priority"}`)}</span></button>)}</div></details>] : [])
  ] : [];

  if (topLineItems.length === 0 && !biomeView && weatherNodes.length === 0 && !trendText && !override && weatherEventRows.length === 0) return null;

  return (
    <SectionCard style={{ background: ui.colors.surfaceElevated, borderColor: "#475569", boxShadow: "0 2px 10px rgba(2,6,23,0.22)" }}>
      {topLineItems.length > 0 ? <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 800, lineHeight: 1.25 }}>{topLineItems}</div> : null}
      {biomeView ? <div style={biomeInlineStyle}><span style={biomeIconStyle}>{biomeView.icon}</span><div style={biomeTextStyle}><strong>{biomeView.label}</strong><span style={biomeDescriptionStyle}>{biomeView.description}</span></div></div> : null}
      {!isPlayer && activeAdventureContexts.length > 0 ? <div style={adventureContextInlineStyle}>
        <strong>{t(project.locale, "adventureContext.current")}</strong>
        {activeAdventureContexts.map((context) => <Badge key={context.id}>{context.icon} {getAdventureContextLabel(context, project.locale)}</Badge>)}
      </div> : null}
      {weatherNodes.length > 0 ? <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, rowGap: 6, fontSize: 13 }}>{weatherNodes}</div> : null}
      {trendText ? <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>{trendText}</div> : null}
      {override ? <div style={{ marginTop: 6, display: "grid", gap: 4 }}><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}><Badge tone="warning">{overrideLabel}</Badge>{overrideIsTimed ? <Badge>{t(project.locale, "weatherOverride.activeTimedEffect")}</Badge> : null}</div>{forcedOverrideValues.length > 0 ? <div style={{ fontSize: 11, color: "#94a3b8" }}>{t(project.locale, "weatherOverride.forcedValues")}: {forcedOverrideValues.join(" · ")}</div> : null}</div> : null}
      {weatherEventRows.length > 0 ? <div style={{ marginTop: 8, display: "grid", gap: 6 }}>{weatherEventRows}</div> : null}
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

export const WeatherForecastCard = ({ project, hourlyForecast, weatherUnits, mode = "gm", detailLevel = "precise", playerForecast = [] }: Pick<Props, "project"|"hourlyForecast"|"weatherUnits"> & { mode?: "gm" | "player"; detailLevel?: "precise" | "broad" | "narrative"; readonly?: boolean; playerForecast?: PlayerHourlyForecastEntry[] }) => {
  const [open, setOpen] = useState(true);
  const forecastCards = mode === "player"
    ? playerForecast.map((entry) => ({
      key: `${entry.offsetHours}:${entry.timeLabel}`,
      title: `+${entry.offsetHours} h`,
      rows: (detailLevel === "narrative" ? [entry.forecastNarrativeLabel ?? entry.narrativeLabel] : [
        `${entry.stateIcon} ${entry.stateLabel}`,
        ...(detailLevel === "precise" ? [
          entry.temperature && entry.temperatureCelsius !== undefined ? `${getTemperatureIcon(entry.temperatureCelsius)} ${entry.temperature}` : undefined,
          entry.windSpeed && entry.windSpeedKmh !== undefined ? <span key="wind">{getWindSpeedIcon(entry.windSpeedKmh)} {entry.windSpeed}{entry.windDirection ? <span title={entry.windDirection}> {getWindDirectionIcon(entry.windDirection)}</span> : null}</span> : undefined,
          entry.rain && entry.rainMm !== undefined ? `${getRainIcon({ rain: entry.rainMm, state: entry.state } as Parameters<typeof getRainIcon>[0])} ${entry.rain}` : undefined,
          entry.trendKind && entry.trend ? `${getConfiguredWeatherTrendIcon(project, entry.trendKind)} ${entry.trend}` : undefined
        ] : [entry.broadTemperature, entry.broadWind, entry.broadRain, entry.broadSoil, entry.broadTrend, entry.broadDominant])
      ]).filter(Boolean) as React.ReactNode[]
    }))
    : hourlyForecast.map((entry) => ({
      key: String(entry.offsetHours),
      title: `+${entry.offsetHours} h`,
      rows: [
        `${getTemperatureIcon(entry.weather.temperature)} ${formatTemperature(entry.weather.temperature, project.units, project.locale)}`,
        <span key="wind">{getWindSpeedIcon(entry.weather.windSpeed)} {formatWindSpeed(entry.weather.windSpeed, project.units, project.locale)}{entry.weather.windDirection ? <span title={entry.weather.windDirection}> {getWindDirectionIcon(entry.weather.windDirection)}</span> : null}</span>,
        `${getRainIcon(entry.weather)} ${formatRain(entry.weather.rain, project.units, project.locale)}`,
        entry.weather.trendKind ? `${getConfiguredWeatherTrendIcon(project, entry.weather.trendKind)} ${getWeatherTrendLabel(project, entry.weather.trendKind)}` : undefined
      ].filter(Boolean) as React.ReactNode[]
    }));

  return (
    <SectionCard>
      <button type="button" onClick={() => setOpen((value) => !value)} style={forecastHeaderButtonStyle}>
        <span>{t(project.locale, "weather.forecast5h")}</span>
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {open ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(74px, 1fr))", gap: 6, width: "100%" }}>
        {forecastCards.map((entry) => (
          <Panel key={entry.key} style={{ background: ui.colors.surfaceSoft, minHeight: 96, padding: "6px 4px", textAlign: "center", fontSize: 11, display: "grid", alignContent: "center", gap: 3 }}>
            <div style={{ fontSize: 12, fontWeight: 800 }}>{entry.title}</div>
            {entry.rows.map((row, index) => <div key={index}>{row}</div>)}
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

const PublicWeatherEventRow = ({ locale, event, onSelectEvent }: { locale: Props["project"]["locale"]; event: PublicEventDetails; onSelectEvent?: (event: PublicEventDetails) => void }) => (
  <button type="button" onClick={onSelectEvent ? () => onSelectEvent(event) : undefined} style={{ background: ui.colors.surface, border: `1px solid ${ui.colors.border}`, borderRadius: ui.radius.md, padding: ui.spacing.sm, cursor: onSelectEvent ? "pointer" : undefined, textAlign: "left", color: ui.colors.textPrimary }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><EventIcon icon={event.icon} locale={locale} /><strong>{event.name}</strong></div>
    {event.summary ? <div style={{ marginTop: 2, fontSize: 12, color: ui.colors.textSecondary }}>{event.summary}</div> : null}
    {event.link?.trim() ? <div style={{ marginTop: 4 }}><span style={{ fontSize: 12, color: ui.colors.accent }}>{t(locale, "common.openLink")}</span></div> : null}
  </button>
);

const adventureContextInlineStyle: React.CSSProperties = { marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", fontSize: 12, color: ui.colors.textSecondary };