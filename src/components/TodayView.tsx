import { useRef, useState } from "react";
import { addMinutes, absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { applyEventCompletionActions, getCompletedEventsBetween, getEventsForCurrentDay, getTriggeredEventsBetween } from "../calendar/eventsLogic";
import { formatDisplayDate } from "../calendar/formatDisplayDate";
import { createNotificationsFromTriggers, type CalendarNotification } from "../calendar/notifications";
import * as moonLogic from "../calendar/moonLogic";
import { applyMoonEventTriggerActions, getNewlyTriggeredMoonEventsBetween, getTriggeredMoonEvents } from "../calendar/moonEventsLogic";
import { getCurrentSeason } from "../calendar/seasonsLogic";
import {
  getActiveWeatherEventsWithDuration,
  getNewlyTriggeredWeatherEventsBetween,
  toAbsoluteMinutes
} from "../calendar/weatherEventsLogic";
import { getCurrentWeather, getDailyWeatherForecast, getHourlyWeatherForecast } from "../calendar/weatherLogic";
import { getWeatherUnitLabels } from "../calendar/weatherUnits";
import type { CalendarEvent, CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";
import { TodayEventsCard } from "./today/TodayEventsCard";
import { TriggerSummaryCard } from "./today/TriggerSummaryCard";
import { TriggeredEventsCard } from "./today/TriggeredEventsCard";
import { TriggeredWeatherAlertsCard } from "./today/TriggeredWeatherAlertsCard";
import { WeatherAndSeasonCard } from "./today/WeatherAndSeasonCard";

type QuickAction = { key: string; deltaMinutes: number };
const quickActions: QuickAction[] = [
  { key: "time.minus2h", deltaMinutes: -120 }, { key: "time.minus1h", deltaMinutes: -60 }, { key: "time.minus15m", deltaMinutes: -15 }, { key: "time.minus5m", deltaMinutes: -5 },
  { key: "time.plus5m", deltaMinutes: 5 }, { key: "time.plus15m", deltaMinutes: 15 }, { key: "time.plus1h", deltaMinutes: 60 }, { key: "time.plus2h", deltaMinutes: 120 }
];
const buttonStyle = { border: "1px solid #8b5cf6", borderRadius: 8, background: "#1a1530", color: "#c4b5fd", padding: "8px 6px", fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, cursor: "pointer" };

export const TodayView = ({ project, onProjectUpdate, onReset }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; onReset: () => void; }) => {
  const dismissedStorageKey = `calendar-obr.notifications.dismissed.${project.id}`;
  const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  const lastTriggeredAtMinutesRef = useRef<Record<string, number>>({});
  const currentSeason = getCurrentSeason(project);
  const currentWeather = getCurrentWeather(project);
  const triggeredWeatherEvents = currentWeather
    ? getActiveWeatherEventsWithDuration(project, currentWeather, project.currentTime, lastTriggeredAtMinutesRef.current)
    : [];
  const currentMoonPhases = moonLogic.getCurrentMoonPhases(project);
  const triggeredMoonEvents = getTriggeredMoonEvents(project, project.currentTime.absoluteDay);
  const hourlyForecast = getHourlyWeatherForecast(project, 5);
  const dailyForecast = getDailyWeatherForecast(project, 5);
  const weatherUnits = getWeatherUnitLabels(project.locale);
  const eventsToday = getEventsForCurrentDay(project);
  const [lastTriggeredEvents, setLastTriggeredEvents] = useState<CalendarEvent[]>([]);
  const [lastTriggeredWeatherEvents, setLastTriggeredWeatherEvents] = useState<CalendarProject["weatherEvents"]>([]);
  const [lastTriggeredMoonEvents, setLastTriggeredMoonEvents] = useState<NonNullable<CalendarProject["moonEvents"]>>([]);
  const [notifications, setNotifications] = useState<CalendarNotification[]>([]);

  const readDismissed = (): Set<string> => {
    try {
      const raw = sessionStorage.getItem(dismissedStorageKey);
      if (!raw) return new Set<string>();
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? new Set(parsed.filter((v): v is string => typeof v === "string")) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  };

  const persistDismissed = (values: Set<string>) => {
    try {
      sessionStorage.setItem(dismissedStorageKey, JSON.stringify([...values]));
    } catch {
      // noop
    }
  };

  const applyTimeDelta = (deltaMinutes: number) => {
    const previousTime = project.currentTime;
    const nextTime = addMinutes(project.currentTime, deltaMinutes);

    if (deltaMinutes > 0) {
      const triggered = getTriggeredEventsBetween(project, previousTime, nextTime);
      const triggeredWeather = getNewlyTriggeredWeatherEventsBetween(project, previousTime, nextTime, lastTriggeredAtMinutesRef.current);
      const triggeredMoon = getNewlyTriggeredMoonEventsBetween(project, previousTime, nextTime);
      const completed = getCompletedEventsBetween(project, previousTime, nextTime);
      setLastTriggeredEvents(triggered);
      setLastTriggeredWeatherEvents(triggeredWeather);
      setLastTriggeredMoonEvents(triggeredMoon);
      const triggerTimeMinutes = toAbsoluteMinutes(nextTime);
      for (const weatherEvent of triggeredWeather) {
        lastTriggeredAtMinutesRef.current[weatherEvent.id] = triggerTimeMinutes;
      }
      const dismissed = readDismissed();
      const created = createNotificationsFromTriggers(triggered, triggeredWeather, triggeredMoon.filter((m) => m.notifyOnTrigger), nextTime).filter((item) => !dismissed.has(item.id));
      setNotifications((prev) => {
        const merged = new Map<string, CalendarNotification>();
        [...prev, ...created].forEach((item) => {
          if (!dismissed.has(item.id)) merged.set(item.id, item);
        });
        return [...merged.values()];
      });
      const withTime = { ...project, currentTime: nextTime };
      const withEventsCompletion = applyEventCompletionActions(withTime, completed);
      const withMoonEventStatus = applyMoonEventTriggerActions(withEventsCompletion, triggeredMoon);
      onProjectUpdate(withMoonEventStatus);
      return;
    } else {
      setLastTriggeredEvents([]);
      setLastTriggeredWeatherEvents([]);
      setLastTriggeredMoonEvents([]);
    }

    onProjectUpdate({ ...project, currentTime: nextTime });
  };

  return (
    <>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>{project.name}</div>
      <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 700 }}>{formatDisplayDate(displayDate, project.locale)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6, marginBottom: 8 }}>{quickActions.map((action) => <button key={action.key} type="button" onClick={() => applyTimeDelta(action.deltaMinutes)} style={buttonStyle}>{t(project.locale, action.key)}</button>)}</div>
      <button type="button" onClick={() => applyTimeDelta(480)} style={{ ...buttonStyle, width: "100%", marginBottom: 10, textTransform: "none" }}>🛌 {t(project.locale, "time.longRest")}</button>

      <TriggerSummaryCard
        locale={project.locale}
        notifications={notifications}
        onDismiss={(id) => {
          setNotifications((prev) => prev.filter((item) => item.id !== id));
          const dismissed = readDismissed();
          dismissed.add(id);
          persistDismissed(dismissed);
        }}
      />

      <TodayEventsCard project={project} eventsToday={eventsToday} />
      <TriggeredEventsCard project={project} lastTriggeredEvents={lastTriggeredEvents} />
      <TriggeredWeatherAlertsCard locale={project.locale} weatherEvents={lastTriggeredWeatherEvents} />
      {triggeredMoonEvents.length > 0 ? <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 8 }}>
        <strong style={{ fontSize: 13 }}>{t(project.locale, "moonEvents.triggeredToday")}</strong>
        <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
          {triggeredMoonEvents.map((event) => {
            const moon = project.moons.find((m) => m.id === event.moonId);
            return <li key={event.id} style={{ fontSize: 12 }}>{event.icon ?? "🌕"} {event.name} · {moon?.name ?? "?"} · {t(project.locale, `moon.phase.${event.phaseId}`)}{event.summary ? ` — ${event.summary}` : ""}</li>;
          })}
        </ul>
      </div> : null}
      <WeatherAndSeasonCard
        project={project}
        currentSeason={currentSeason}
        currentWeather={currentWeather}
        hourlyForecast={hourlyForecast}
        dailyForecast={dailyForecast}
        triggeredWeatherEvents={triggeredWeatherEvents}
        weatherUnits={weatherUnits}
        currentMoonPhases={currentMoonPhases}
      />

      <button type="button" onClick={onReset} style={{ border: "1px solid #7f1d1d", borderRadius: 6, background: "#991b1b", color: "#fff", padding: "7px 10px", fontSize: 12 }}>{t(project.locale, "settings.resetCalendar")}</button>
    </>
  );
};