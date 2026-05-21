import { absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { getPlayerVisibleEventsForCurrentDay } from "../calendar/eventsLogic";
import { formatDisplayDate } from "../calendar/formatDisplayDate";
import { formatEventTimeShort } from "../calendar/formatEvent";
import { getCurrentMoonPhases } from "../calendar/moonLogic";
import { getCurrentSeason } from "../calendar/seasonsLogic";
import { getCurrentWeather } from "../calendar/weatherLogic";
import { getWeatherUnitLabels } from "../calendar/weatherUnits";
import type { CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";
import { getWeatherStateIcon } from "../calendar/weatherState";
import type { PublicCalendarTodaySnapshot } from "../obr/publicSnapshot";
import { EventIcon } from "./EventIcon";

export const PlayerView = ({ project, snapshot }: { project: CalendarProject; snapshot?: PublicCalendarTodaySnapshot | null }) => {
  if (snapshot) {
    return (
      <>
        <div style={{ marginBottom: 8, fontWeight: 700 }}>{snapshot.calendarName}</div>
        <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 700 }}>{snapshot.formattedDate}</div>
        <div style={{ marginBottom: 10, fontSize: 12, color: "#93c5fd" }}>{t(project.locale, "player.readOnly")}</div>
        <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
          <div><strong>{t(project.locale, "calendar.season")}:</strong> {snapshot.season?.name ?? t(project.locale, "calendar.noSeason")}</div>
          <div><strong>{t(project.locale, "calendar.weather")}:</strong> {snapshot.weather ? `${getWeatherStateIcon(snapshot.weather.state ?? "clear")} ${t(project.locale, `weather.state.${snapshot.weather.state ?? "clear"}`)} · ${snapshot.weather.temperature} ${snapshot.weather.units.temperature}` : t(project.locale, "calendar.noWeather")}</div>
          <div style={{ marginTop: 6 }}><strong>{t(project.locale, "calendar.moons")}:</strong>{snapshot.moons.length === 0 ? <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "calendar.noMoon")}</div> : snapshot.moons.map((m) => <div key={m.name}>{m.icon} {m.name} — {t(project.locale, `moon.phase.${m.phaseId}`)}</div>)}</div>
        </div>
        <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{t(project.locale, "player.eventsToday")}</div>
          {snapshot.eventsToday.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 12 }}>{t(project.locale, "player.noPublicEvents")}</div> : snapshot.eventsToday.map((event) => <div key={event.id}><strong>{event.name}</strong> {event.timeLabel}</div>)}
        </div>
      </>
    );
  }
}
const LocalPlayerPreview = ({ project }: { project: CalendarProject }) => {
  const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  const visibleEvents = getPlayerVisibleEventsForCurrentDay(project);
  const currentSeason = getCurrentSeason(project);
  const currentWeather = getCurrentWeather(project);
  const currentMoonPhases = getCurrentMoonPhases(project);
  const weatherUnits = getWeatherUnitLabels(project.locale);

  return (
    <>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>{project.name}</div>
      <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 700 }}>{formatDisplayDate(displayDate, project.locale)}</div>
      <div style={{ marginBottom: 10, fontSize: 12, color: "#93c5fd" }}>{t(project.locale, "player.readOnly")}</div>

      <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <strong>{t(project.locale, "calendar.season")}:</strong>
          {currentSeason ? <><EventIcon icon={currentSeason.icon} locale={project.locale} size={16} /><span>{currentSeason.name}</span></> : <span>{t(project.locale, "calendar.noSeason")}</span>}
        </div>
        <div>
          <strong>{t(project.locale, "calendar.weather")}:</strong>{" "}
          {currentWeather
            ? `${currentWeather.temperature} ${weatherUnits.temperature} · ${t(project.locale, "calendar.wind")} ${currentWeather.windDirection} ${currentWeather.windSpeed} ${weatherUnits.windSpeed} · ${t(project.locale, "calendar.rain")} ${currentWeather.rain} ${weatherUnits.rain}`
            : t(project.locale, "calendar.noWeather")}
        </div>
        <div style={{ marginTop: 6 }}>
          <strong>{t(project.locale, "calendar.moons")}:</strong>
          {currentMoonPhases.length === 0 ? (
            <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "calendar.noMoon")}</div>
          ) : (
            <div style={{ display: "grid", gap: 2, fontSize: 12 }}>
              {currentMoonPhases.map(({ moon, phase }) => (
                <div key={moon.id}>{phase.icon} {moon.name} — {t(project.locale, `moon.phase.${phase.id}`)}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{t(project.locale, "player.eventsToday")}</div>
        {visibleEvents.length === 0 ? (
          <div style={{ color: "#9ca3af", fontSize: 12 }}>{t(project.locale, "player.noPublicEvents")}</div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {visibleEvents.map((event) => (
              <div key={event.id} style={{ border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#111827" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                  <EventIcon icon={event.icon} locale={project.locale} />
                  <strong>{event.name}</strong>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "#cbd5e1" }}>{formatEventTimeShort(project, event)}</span>
                </div>
                {event.playerDescription ? <div style={{ marginTop: 4, fontSize: 12, color: "#d1d5db" }}>{event.playerDescription}</div> : null}
                {event.summary ? <div style={{ marginTop: 4, fontSize: 12, color: "#d1d5db" }}>{event.summary}</div> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
},