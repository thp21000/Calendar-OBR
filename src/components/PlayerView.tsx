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
          <div><strong>{t(project.locale, "calendar.weather")}:</strong> {snapshot.weather ? `${snapshot.weather.temperature} ${snapshot.weather.units.temperature}` : t(project.locale, "calendar.noWeather")}</div>
          <div style={{ marginTop: 6 }}><strong>{t(project.locale, "calendar.moons")}:</strong>{snapshot.moons.length === 0 ? <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "calendar.noMoon")}</div> : snapshot.moons.map((m) => <div key={m.name}>{m.icon} {m.name} — {t(project.locale, `moon.phase.${m.phaseId}`)}</div>)}</div>
        </div>
        <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{t(project.locale, "player.eventsToday")}</div>
          {snapshot.eventsToday.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 12 }}>{t(project.locale, "player.noPublicEvents")}</div> : snapshot.eventsToday.map((event) => <div key={event.id}><strong>{event.name}</strong> {event.timeLabel}</div>)}
        </div>
      </>
    );
  }

  const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  const visibleEvents = getPlayerVisibleEventsForCurrentDay(project);
  const currentSeason = getCurrentSeason(project);
  const currentWeather = getCurrentWeather(project);
  const currentMoonPhases = getCurrentMoonPhases(project);
  const weatherUnits = getWeatherUnitLabels(project.locale);

  return <div>{formatDisplayDate(displayDate, project.locale)} {currentSeason?.name} {currentWeather ? `${currentWeather.temperature} ${weatherUnits.temperature}` : ""} {visibleEvents.length} {currentMoonPhases.length}</div>;
};