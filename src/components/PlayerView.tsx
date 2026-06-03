import { useState } from "react";
import { absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { getPlayerVisibleEventsForCurrentDay } from "../calendar/eventsLogic";
import { formatDisplayDate } from "../calendar/formatDisplayDate";
import { formatEventTimeShort } from "../calendar/formatEvent";
import { getPlayerVisibleDayNotesForDay } from "../calendar/dayNotesLogic";
import { getPlayerVisibleMoonEvents } from "../calendar/moonEventsLogic";
import { getCurrentMoonPhases } from "../calendar/moonLogic";
import { getCurrentSeason } from "../calendar/seasonsLogic";
import { getCurrentWeather } from "../calendar/weatherLogic";
import { getCurrentWeatherBiomeDefinition } from "../calendar/weather/biomes";
import { getPlayerVisibleWeatherEvents } from "../calendar/weatherEventsLogic";
import { getWeatherStateIcon } from "../calendar/weatherState";
import { getWeatherUnitLabels } from "../calendar/weatherUnits";
import type { CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";
import type { PublicCalendarTodaySnapshot } from "../obr/publicSnapshot";
import type { PublicEventDetails } from "./player/PublicEventDetailsPopup";
import { PublicEventDetailsPopup } from "./player/PublicEventDetailsPopup";
import { PlayerDayNotesCard } from "./player/PlayerDayNotesCard";
import { PlayerOverviewCard } from "./player/PlayerOverviewCard";
import { PlayerPublicEventsCard } from "./player/PlayerPublicEventsCard";
import { PlayerPublicMoonEventsCard } from "./player/PlayerPublicMoonEventsCard";

export const PlayerView = ({ project, snapshot }: { project: CalendarProject; snapshot?: PublicCalendarTodaySnapshot | null }) => {
  const [selectedPublicEvent, setSelectedPublicEvent] = useState<PublicEventDetails | null>(null);

  if (snapshot) {
    const weatherLabel = snapshot.weather
      ? `${getWeatherStateIcon(snapshot.weather.state ?? "clear")} ${t(snapshot.locale, `weather.state.${snapshot.weather.state ?? "clear"}`)} · ${snapshot.weather.temperature} ${snapshot.weather.units.temperature}`
      : t(snapshot.locale, "calendar.noWeather");

    const publicEvents: PublicEventDetails[] = snapshot.eventsToday.map((event) => ({ ...event }));
    const publicWeatherEvents: PublicEventDetails[] = (snapshot.weatherEventsToday ?? []).map((event) => ({
      id: event.id,
      name: event.name,
      icon: event.icon,
      summary: event.summary || undefined,
      playerDescription: event.playerDescription || undefined,
      link: event.link || undefined
    }));

    const publicMoonEvents: PublicEventDetails[] = snapshot.moonEventsToday.map((event) => ({
      id: event.id,
      name: event.name,
      icon: event.icon,
      summary: event.summary || undefined,
      playerDescription: event.playerDescription || undefined,
      subtitle: `${event.moonName} · ${t(snapshot.locale, `moon.phase.${event.phaseId}`)}`
    }));

    return (
      <>
        <div style={{ marginBottom: 8, fontWeight: 700 }}>{snapshot.calendarName}</div>
        <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 700 }}>{snapshot.formattedDate}</div>
        <div style={{ marginBottom: 10, fontSize: 12, color: "#93c5fd" }}>{t(snapshot.locale, "player.readOnly")}</div>

        <PlayerOverviewCard
          locale={snapshot.locale}
          seasonName={snapshot.season?.name}
          seasonIcon={snapshot.season?.icon}
          weatherLabel={weatherLabel}
          moons={snapshot.moons.map((m) => ({ id: `${m.name}:${m.phaseId}`, text: `${m.icon} ${m.name} — ${t(snapshot.locale, `moon.phase.${m.phaseId}`)}` }))}
        />
        <div style={{ fontSize: 12, color: "#d1d5db", marginBottom: 4 }}>
          {snapshot.weatherBiome.icon} {snapshot.weatherBiome.name}: {snapshot.weatherBiome.description}
        </div>
        {snapshot.weather?.dailyMinTemperature !== undefined && snapshot.weather?.dailyMaxTemperature !== undefined ? (
          <div style={{ fontSize: 12, color: "#d1d5db", marginBottom: 4 }}>
            {t(snapshot.locale, "weather.dailyMinMax")}: {snapshot.weather.dailyMinTemperature} / {snapshot.weather.dailyMaxTemperature} {snapshot.weather.units.temperature}
          </div>
        ) : null}
        {snapshot.weather?.dailyRainTotal !== undefined ? (
          <div style={{ fontSize: 12, color: "#d1d5db", marginBottom: 4 }}>
            {t(snapshot.locale, "weather.dailyRainTotal")}: {snapshot.weather.dailyRainTotal} {snapshot.weather.units.rain}
          </div>
        ) : null}
        {snapshot.weather?.trendKind ? (
          <div style={{ fontSize: 12, color: "#d1d5db", marginBottom: 4 }}>
            {t(snapshot.locale, "weather.trend")}: {t(snapshot.locale, `weather.trend.${snapshot.weather.trendKind}`)}
          </div>
        ) : null}
        {snapshot.weather?.dominantState ? (
          <div style={{ fontSize: 12, color: "#d1d5db", marginBottom: 6 }}>
            {t(snapshot.locale, "weather.dominantState")}: {getWeatherStateIcon(snapshot.weather.dominantState)} {t(snapshot.locale, `weather.state.${snapshot.weather.dominantState}`)}
          </div>
        ) : null}

        <PlayerPublicEventsCard locale={snapshot.locale} events={publicEvents} onSelectEvent={setSelectedPublicEvent} />
        {publicWeatherEvents.length > 0 ? <PlayerPublicEventsCard locale={snapshot.locale} title={t(snapshot.locale, "calendar.weatherEvents")} events={publicWeatherEvents} onSelectEvent={setSelectedPublicEvent} /> : null}
        <PlayerPublicMoonEventsCard locale={snapshot.locale} events={publicMoonEvents} onSelectEvent={setSelectedPublicEvent} />
        <PlayerDayNotesCard locale={snapshot.locale} notes={snapshot.dayNotesToday} />

        {selectedPublicEvent ? <PublicEventDetailsPopup locale={snapshot.locale} event={selectedPublicEvent} onClose={() => setSelectedPublicEvent(null)} /> : null}
      </>
    );
  }

  const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  const visibleEvents = getPlayerVisibleEventsForCurrentDay(project);
  const currentSeason = getCurrentSeason(project);
  const currentWeather = getCurrentWeather(project);
  const currentBiome = getCurrentWeatherBiomeDefinition(project);
  const currentMoonPhases = getCurrentMoonPhases(project);
  const visibleWeatherEvents = currentWeather ? getPlayerVisibleWeatherEvents(project, currentWeather, project.currentTime) : [];
  const visibleMoonEvents = getPlayerVisibleMoonEvents(project, project.currentTime.absoluteDay);
  const visibleDayNotes = getPlayerVisibleDayNotesForDay(project, displayDate);
  const weatherUnits = getWeatherUnitLabels(project.locale);

  const weatherLabel = currentWeather
    ? `${getWeatherStateIcon(currentWeather.state ?? "clear")} ${t(project.locale, `weather.state.${currentWeather.state ?? "clear"}`)} · ${currentWeather.temperature} ${weatherUnits.temperature} · ${t(project.locale, "calendar.wind")} ${currentWeather.windDirection} ${currentWeather.windSpeed} ${weatherUnits.windSpeed} · ${t(project.locale, "calendar.rain")} ${currentWeather.rain} ${weatherUnits.rain}`
    : t(project.locale, "calendar.noWeather");

  const publicEvents: PublicEventDetails[] = visibleEvents.map((event) => ({
    id: event.id,
    name: event.name,
    icon: event.icon,
    summary: event.summary || undefined,
    playerDescription: event.playerDescription || undefined,
    timeLabel: formatEventTimeShort(project, event)
  }));

  const publicWeatherEvents: PublicEventDetails[] = visibleWeatherEvents.map((event) => ({
    id: event.id,
    name: event.name,
    icon: event.icon,
    summary: event.summary || undefined,
    playerDescription: event.playerDescription || undefined,
    link: event.link || undefined
  }));

  const publicMoonEvents: PublicEventDetails[] = visibleMoonEvents.map((event) => {
    const moon = project.moons.find((m) => m.id === event.moonId);
    return {
      id: event.id,
      name: event.name,
      icon: event.icon,
      summary: event.summary || undefined,
      playerDescription: event.playerDescription || undefined,
      subtitle: `${moon?.name ?? "?"} · ${t(project.locale, `moon.phase.${event.phaseId}`)}`
    };
  });

  return (
    <>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>{project.name}</div>
      <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 700 }}>{formatDisplayDate(displayDate, project.locale)}</div>
      <div style={{ marginBottom: 10, fontSize: 12, color: "#93c5fd" }}>{t(project.locale, "player.readOnly")}</div>

      <PlayerOverviewCard
        locale={project.locale}
        seasonName={currentSeason?.name}
        seasonIcon={currentSeason?.icon}
        weatherLabel={weatherLabel}
        moons={currentMoonPhases.map(({ moon, phase }) => ({ id: moon.id, text: `${phase.icon} ${moon.name} — ${t(project.locale, `moon.phase.${phase.id}`)}` }))}
      />
      <div style={{ fontSize: 12, color: "#d1d5db", marginBottom: 4 }}>
        {currentBiome.icon} {t(project.locale, currentBiome.nameKey)}: {t(project.locale, currentBiome.descriptionKey)}
      </div>
      {currentWeather?.dailyMinTemperature !== undefined && currentWeather?.dailyMaxTemperature !== undefined ? (
        <div style={{ fontSize: 12, color: "#d1d5db", marginBottom: 4 }}>
          {t(project.locale, "weather.dailyMinMax")}: {currentWeather.dailyMinTemperature} / {currentWeather.dailyMaxTemperature} {weatherUnits.temperature}
        </div>
      ) : null}
      {currentWeather?.dailyRainTotal !== undefined ? (
        <div style={{ fontSize: 12, color: "#d1d5db", marginBottom: 4 }}>
          {t(project.locale, "weather.dailyRainTotal")}: {currentWeather.dailyRainTotal} {weatherUnits.rain}
        </div>
      ) : null}
      {currentWeather?.trendKind ? (
        <div style={{ fontSize: 12, color: "#d1d5db", marginBottom: 4 }}>
          {t(project.locale, "weather.trend")}: {t(project.locale, `weather.trend.${currentWeather.trendKind}`)}
        </div>
      ) : null}
      {currentWeather?.dominantState ? (
        <div style={{ fontSize: 12, color: "#d1d5db", marginBottom: 6 }}>
          {t(project.locale, "weather.dominantState")}: {getWeatherStateIcon(currentWeather.dominantState)} {t(project.locale, `weather.state.${currentWeather.dominantState}`)}
        </div>
      ) : null}

      <PlayerPublicEventsCard locale={project.locale} events={publicEvents} onSelectEvent={setSelectedPublicEvent} />
      {publicWeatherEvents.length > 0 ? <PlayerPublicEventsCard locale={project.locale} title={t(project.locale, "calendar.weatherEvents")} events={publicWeatherEvents} onSelectEvent={setSelectedPublicEvent} /> : null}
      <PlayerPublicMoonEventsCard locale={project.locale} events={publicMoonEvents} onSelectEvent={setSelectedPublicEvent} />
      <PlayerDayNotesCard locale={project.locale} notes={visibleDayNotes.map((n) => ({ id: n.id, playerNote: n.playerNote }))} />

      {selectedPublicEvent ? <PublicEventDetailsPopup locale={project.locale} event={selectedPublicEvent} onClose={() => setSelectedPublicEvent(null)} /> : null}
    </>
  );
};
