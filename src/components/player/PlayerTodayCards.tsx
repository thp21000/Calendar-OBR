import { useState } from "react";
import type { CSSProperties } from "react";
import type { LocaleCode, PlayerViewSettings } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";
import { Badge, EmptyState, Panel, SectionCard } from "../ui";
import { ui } from "../ui/styles";
import type { PublicEventDetails } from "./PublicEventDetailsPopup";
import type { PlayerHourlyForecastEntry, PlayerViewModel } from "./playerViewModel";

export const PlayerTodayStatusSummary = ({ locale, model, settings, onSelectEvent }: { locale: LocaleCode; model: PlayerViewModel; settings: PlayerViewSettings; onSelectEvent: (event: PublicEventDetails) => void }) => {
  const showTopLine = settings.today.showHeader || settings.today.showDate || settings.today.showSeason || settings.today.showMoons;
  const showBiome = settings.today.showBiome && model.biome;
  const showWeather = settings.today.showWeather;
  const showWeatherEvents = settings.today.showWeatherEvents && model.weatherEvents.length > 0;

  if (!showTopLine && !showBiome && !showWeather && !showWeatherEvents) return null;

  return <SectionCard style={{ background: ui.colors.surfaceElevated, borderColor: "#475569", boxShadow: "0 2px 10px rgba(2,6,23,0.22)" }}>
    {showTopLine ? <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 18, fontWeight: 800, lineHeight: 1.25 }}>
      {settings.today.showHeader ? <span style={{ whiteSpace: "nowrap" }}>{model.calendarName}</span> : null}
      {settings.today.showDate ? <span style={{ whiteSpace: "nowrap" }}>{model.formattedDate}</span> : null}
      {settings.today.showSeason && model.season ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{model.season.icon ?? "🍃"} {model.season.name}</span> : null}
      {settings.today.showMoons ? model.moons.map((moon) => <span key={moon.id} title={`${moon.name} — ${moon.phaseLabel}`} style={{ whiteSpace: "nowrap" }}>{moon.icon}</span>) : null}
      {settings.today.showHeader ? <Badge>{t(locale, "player.readOnly")}</Badge> : null}
    </div> : null}

    {showBiome ? <div style={{ marginTop: 8, fontSize: 13, color: ui.colors.textPrimary, display: "grid", gridTemplateColumns: "30px minmax(0, 1fr)", columnGap: 8, alignItems: "center" }}>
      <span style={{ width: 30, fontSize: 28, lineHeight: "30px", textAlign: "center", alignSelf: "center" }}>{model.biome?.icon}</span>
      <div style={{ display: "grid", gap: 2, lineHeight: 1.25 }}>
        <strong>{t(locale, "weatherBiome.label")} {model.biome?.name}</strong>
        <span style={{ fontSize: 11, color: ui.colors.textSecondary, lineHeight: 1.25 }}>{model.biome?.description}</span>
      </div>
    </div> : null}

    {showWeather ? <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, rowGap: 6, fontSize: 13 }}>
      {model.weather ? <>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>{model.weather.stateIcon} {model.weather.stateLabel}</span>
        {model.weather.detailLevel === "precise" ? <>
          {model.weather.temperature ? <span style={{ whiteSpace: "nowrap" }}>{model.weather.temperature}</span> : null}
          {model.weather.wind ? <span style={{ whiteSpace: "nowrap" }}>{model.weather.wind}</span> : null}
          {model.weather.rain ? <span style={{ whiteSpace: "nowrap" }}>{model.weather.rain}</span> : null}
          {model.weather.dailyRainTotal ? <span style={{ whiteSpace: "nowrap" }}>{t(locale, "weather.rainAccumulation")}: {model.weather.dailyRainTotal}</span> : null}
        </> : <>
          {model.weather.broadTemperature ? <span style={{ whiteSpace: "nowrap" }}>{model.weather.broadTemperature}</span> : null}
          {model.weather.broadWind ? <span style={{ whiteSpace: "nowrap" }}>{model.weather.broadWind}</span> : null}
          {model.weather.broadRain ? <span style={{ whiteSpace: "nowrap" }}>{model.weather.broadRain}</span> : null}
        </>}
      </> : <span style={{ fontSize: 12, color: "#94a3b8" }}>{t(locale, "calendar.noWeather")}</span>}
    </div> : null}

    {showWeather && model.weather?.detailLevel === "precise" && (model.weather.trend || model.weather.dominantState) ? <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>
      {model.weather.trend ? `${t(locale, "weather.trend")}: ${model.weather.trend}` : ""}
      {model.weather.trend && model.weather.dominantState ? " · " : ""}
      {model.weather.dominantState ? `${t(locale, "weather.dominantState")}: ${model.weather.dominantState}` : ""}
    </div> : null}

    {showWeatherEvents ? <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
      {model.weatherEvents.map((event) => <PublicEventRow key={event.id} locale={locale} event={event} onSelectEvent={onSelectEvent} background={ui.colors.surface} />)}
    </div> : null}
  </SectionCard>;
};

export const PlayerTodayEventsCard = ({ locale, model, settings, onSelectEvent }: { locale: LocaleCode; model: PlayerViewModel; settings: PlayerViewSettings; onSelectEvent: (event: PublicEventDetails) => void }) => {
  const events = settings.today.showEvents ? model.events : [];
  const moonEvents = settings.today.showMoonEvents ? model.moonEvents : [];
  const notes = settings.today.showDayNotes ? model.dayNotes.filter((note) => note.playerNote?.trim()) : [];
  const hasAnyEnabledBlock = settings.today.showEvents || settings.today.showMoonEvents || settings.today.showDayNotes;
  if (!hasAnyEnabledBlock) return null;

  return <SectionCard>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ui.spacing.sm }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{t(locale, "events.eventsToday")}</div>
    </div>
    {events.length === 0 && moonEvents.length === 0 && notes.length === 0 ? <EmptyState text={t(locale, "events.noEventsToday")} /> : <div style={{ display: "grid", gap: 6 }}>
      {events.map((event) => <PublicEventRow key={event.id} locale={locale} event={event} onSelectEvent={onSelectEvent} background="#111827" />)}
      {moonEvents.map((event) => <PublicEventRow key={event.id} locale={locale} event={event} onSelectEvent={onSelectEvent} background="#0f172a" />)}
      {notes.map((note) => <div key={note.id} style={{ border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#0f172a", fontSize: 12, color: "#e5e7eb", whiteSpace: "pre-wrap" }}>📝 {note.playerNote}</div>)}
    </div>}
  </SectionCard>;
};

export const PlayerTodayForecastCard = ({ locale, forecast, settings }: { locale: LocaleCode; forecast: PlayerHourlyForecastEntry[]; settings: PlayerViewSettings }) => {
  const [open, setOpen] = useState(true);
  if (!settings.today.showHourlyForecast) return null;

  return <SectionCard>
    <button type="button" onClick={() => setOpen((value) => !value)} style={forecastHeaderButtonStyle}>
      <span>{t(locale, "weather.forecast5h")}</span>
      <span aria-hidden="true">{open ? "▾" : "▸"}</span>
    </button>
    {open ? forecast.length === 0 ? <EmptyState text={t(locale, "calendar.noWeather")} /> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(74px, 1fr))", gap: 6, width: "100%" }}>
      {forecast.map((entry) => <Panel key={`${entry.offsetHours}:${entry.timeLabel}`} style={{ background: ui.colors.surfaceSoft, minHeight: 96, padding: "6px 4px", textAlign: "center", fontSize: 11, display: "grid", alignContent: "center", gap: 3 }}>
        <div style={{ fontSize: 12, fontWeight: 800 }}>{entry.timeLabel}</div>
        <div>{entry.stateIcon} {entry.stateLabel}</div>
        {entry.detailLevel === "precise" ? <>
          {entry.temperature ? <div>{entry.temperature}</div> : null}
          {entry.wind ? <div>{entry.wind}</div> : null}
          {entry.rain ? <div>{entry.rain}</div> : null}
        </> : <>
          {entry.broadTemperature ? <div>{entry.broadTemperature}</div> : null}
          {entry.broadWind ? <div>{entry.broadWind}</div> : null}
          {entry.broadRain ? <div>{entry.broadRain}</div> : null}
        </>}
      </Panel>)}
    </div> : null}
  </SectionCard>;
};

const PublicEventRow = ({ locale, event, onSelectEvent, background }: { locale: LocaleCode; event: PublicEventDetails; onSelectEvent: (event: PublicEventDetails) => void; background: string }) => (
  <button type="button" onClick={() => onSelectEvent(event)} style={{ border: "1px solid #374151", borderRadius: 6, padding: 6, background, width: "100%", textAlign: "left", cursor: "pointer" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
      <EventIcon icon={event.icon} locale={locale} />
      <strong style={{ color: ui.colors.textPrimary, fontWeight: 800 }}>{event.name}</strong>
      {event.timeLabel ? <span style={{ marginLeft: "auto", fontSize: 12, color: "#cbd5e1" }}>{event.timeLabel}</span> : null}
    </div>
    {event.subtitle ? <div style={{ marginTop: 4, fontSize: 12, color: "#cbd5e1" }}>{event.subtitle}</div> : null}
    {event.summary ? <div style={{ marginTop: 4, fontSize: 12, color: "#d1d5db" }}>{event.summary}</div> : null}
  </button>
);

const forecastHeaderButtonStyle: CSSProperties = {
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
