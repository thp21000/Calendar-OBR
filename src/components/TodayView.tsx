import { useState } from "react";
import { addMinutes, absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { applyEventCompletionActions, getCompletedEventsBetween, getEventsForCurrentDay, getTriggeredEventsBetween } from "../calendar/eventsLogic";
import { getCurrentSeason } from "../calendar/seasonsLogic";
import { getTriggeredWeatherEvents } from "../calendar/weatherEventsLogic";
import { getCurrentWeather, getDailyWeatherForecast, getHourlyWeatherForecast } from "../calendar/weatherLogic";
import { getWeatherUnitLabels } from "../calendar/weatherUnits";
import { formatEventDateTime, formatEventTimeShort, formatEventVisibility } from "../calendar/formatEvent";
import { formatDisplayDate } from "../calendar/formatDisplayDate";
import type { CalendarEvent, CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";
import { EventIcon } from "./EventIcon";

type QuickAction = { key: string; deltaMinutes: number };
const quickActions: QuickAction[] = [
  { key: "time.minus2h", deltaMinutes: -120 }, { key: "time.minus1h", deltaMinutes: -60 }, { key: "time.minus15m", deltaMinutes: -15 }, { key: "time.minus5m", deltaMinutes: -5 },
  { key: "time.plus5m", deltaMinutes: 5 }, { key: "time.plus15m", deltaMinutes: 15 }, { key: "time.plus1h", deltaMinutes: 60 }, { key: "time.plus2h", deltaMinutes: 120 }
];
const buttonStyle = { border: "1px solid #8b5cf6", borderRadius: 8, background: "#1a1530", color: "#c4b5fd", padding: "8px 6px", fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, cursor: "pointer" };

export const TodayView = ({ project, onProjectUpdate, onReset }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; onReset: () => void; }) => {
  const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  const currentSeason = getCurrentSeason(project);
  const currentWeather = getCurrentWeather(project);
  const triggeredWeatherEvents = currentWeather ? getTriggeredWeatherEvents(project, currentWeather) : [];
  const hourlyForecast = getHourlyWeatherForecast(project, 5);
  const dailyForecast = getDailyWeatherForecast(project, 5);
  const weatherUnits = getWeatherUnitLabels(project.locale);
  const eventsToday = getEventsForCurrentDay(project);
  const [lastTriggeredEvents, setLastTriggeredEvents] = useState<CalendarEvent[]>([]);

  const applyTimeDelta = (deltaMinutes: number) => {
    const previousTime = project.currentTime;
    const nextTime = addMinutes(project.currentTime, deltaMinutes);

    if (deltaMinutes > 0) {
      const triggered = getTriggeredEventsBetween(project, previousTime, nextTime);
      const completed = getCompletedEventsBetween(project, previousTime, nextTime);
      setLastTriggeredEvents(triggered);
      onProjectUpdate(applyEventCompletionActions({ ...project, currentTime: nextTime }, completed));
      return;
    } else {
      setLastTriggeredEvents([]);
    }

    onProjectUpdate({ ...project, currentTime: nextTime });
  };

  return (
    <>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>{project.name}</div>
      <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 700 }}>{formatDisplayDate(displayDate, project.locale)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6, marginBottom: 8 }}>{quickActions.map((action) => <button key={action.key} type="button" onClick={() => applyTimeDelta(action.deltaMinutes)} style={buttonStyle}>{t(project.locale, action.key)}</button>)}</div>
      <button type="button" onClick={() => applyTimeDelta(480)} style={{ ...buttonStyle, width: "100%", marginBottom: 10, textTransform: "none" }}>🛌 {t(project.locale, "time.longRest")}</button>

      <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{t(project.locale, "events.eventsToday")}</div>
        {eventsToday.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 12 }}>{t(project.locale, "events.noEventsToday")}</div> : <div style={{ display: "grid", gap: 6 }}>
          {eventsToday.map((event) => <div key={event.id} style={{ border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#111827" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
              <EventIcon icon={event.icon} locale={project.locale} />
              <strong>{event.name}</strong>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#cbd5e1" }}>{formatEventTimeShort(project, event)}</span>
            </div>
            {event.summary ? <div style={{ marginTop: 4, fontSize: 12, color: "#d1d5db" }}>{event.summary}</div> : null}
            <div style={{ marginTop: 3, fontSize: 11, color: "#9ca3af" }}>{t(project.locale, "events.visibility")}: {formatEventVisibility(project, event.visibility)}</div>
          </div>)}
        </div>}
      </div>


      <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{t(project.locale, "events.triggered")}</div>
        {lastTriggeredEvents.length === 0 ? (
          <div style={{ color: "#9ca3af", fontSize: 12 }}>{t(project.locale, "events.noTriggeredEvents")}</div>
        ) : (
          <>
            <div style={{ fontSize: 11, color: "#93c5fd", marginBottom: 6 }}>{t(project.locale, "events.triggeredRecently")}</div>
            <div style={{ display: "grid", gap: 6 }}>
              {lastTriggeredEvents.map((event) => (
                <div key={event.id} style={{ border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#111827" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                    <EventIcon icon={event.icon} locale={project.locale} />
                    <strong>{event.name}</strong>
                  </div>
                  <div style={{ marginTop: 3, fontSize: 12, color: "#cbd5e1" }}>{formatEventDateTime(project, event)}</div>
                  {event.summary ? <div style={{ marginTop: 4, fontSize: 12, color: "#d1d5db" }}>{event.summary}</div> : null}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>{t(project.locale, "calendar.season")}:</span>
          {currentSeason ? <><EventIcon icon={currentSeason.icon} locale={project.locale} size={16} /><span>{currentSeason.name}</span></> : <span>{t(project.locale, "calendar.noSeason")}</span>}
        </div>
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{t(project.locale, "calendar.hourlyForecast")}</div>
          {hourlyForecast.length === 0 ? (
            <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "calendar.noForecast")}</div>
          ) : (
            <div style={{ display: "grid", gap: 2, fontSize: 12 }}>
              {hourlyForecast.map((entry) => (
                <div key={entry.offsetHours}>
                  +{entry.offsetHours} h · {entry.weather.temperature} {weatherUnits.temperature} · {entry.weather.windDirection}{" "}
                  {entry.weather.windSpeed} {weatherUnits.windSpeed} · {entry.weather.rain} {weatherUnits.rain}
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          {t(project.locale, "calendar.weather")}: {currentWeather
            ? `${currentWeather.temperature} ${weatherUnits.temperature} · ${t(project.locale, "calendar.wind")} ${currentWeather.windDirection} ${currentWeather.windSpeed} ${weatherUnits.windSpeed} · ${t(project.locale, "calendar.rain")} ${currentWeather.rain} ${weatherUnits.rain}`
            : t(project.locale, "calendar.noWeather")}
        </div>
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{t(project.locale, "calendar.dailyForecast")}</div>
          {dailyForecast.length === 0 ? (
            <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "calendar.noForecast")}</div>
          ) : (
            <div style={{ display: "grid", gap: 2, fontSize: 12 }}>
              {dailyForecast.map((entry) => (
                <div key={entry.offsetDays}>
                  +{entry.offsetDays} {project.locale === "fr" ? "j" : "d"} · {entry.weather.temperature} {weatherUnits.temperature} ·{" "}
                  {entry.weather.windDirection} {entry.weather.windSpeed} {weatherUnits.windSpeed} · {entry.weather.rain} {weatherUnits.rain}
                </div>
              ))}
            </div>
          )}
        </div>
        <div>{t(project.locale, "calendar.moonPlaceholder")}</div>
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

      <button type="button" onClick={onReset} style={{ border: "1px solid #7f1d1d", borderRadius: 6, background: "#991b1b", color: "#fff", padding: "7px 10px", fontSize: 12 }}>{t(project.locale, "settings.resetCalendar")}</button>
    </>
  );
};