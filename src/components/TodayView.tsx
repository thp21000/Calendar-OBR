import { useRef, useState } from "react";
import { addMinutes, absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { applyEventCompletionActions, getCompletedEventsBetween, getEventsForCurrentDay, getReminderEventsBetween, getTriggeredEventsBetween, updateCalendarEvent } from "../calendar/eventsLogic";
import { formatDisplayDate } from "../calendar/formatDisplayDate";
import { createNotificationsFromTriggers, createReminderNotifications, type CalendarNotification } from "../calendar/notifications";
import * as moonLogic from "../calendar/moonLogic";
import { applyMoonEventTriggerActions, getNewlyTriggeredMoonEventsBetween, getTriggeredMoonEvents } from "../calendar/moonEventsLogic";
import { getCurrentSeason } from "../calendar/seasonsLogic";
import {
  getActiveWeatherEventsWithDuration,
  getNewlyTriggeredWeatherEventsBetween,
  applyWeatherEventTriggerActions,
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
import { EventDetailsPopup } from "./events/EventDetailsPopup";
import { PrimaryButton, SecondaryButton, SectionCard, SectionHeader, Toolbar } from "./ui";

type QuickAction = { key: string; deltaMinutes: number };
const quickActions: QuickAction[] = [
  { key: "time.minus2h", deltaMinutes: -120 }, { key: "time.minus1h", deltaMinutes: -60 }, { key: "time.minus15m", deltaMinutes: -15 }, { key: "time.minus5m", deltaMinutes: -5 },
  { key: "time.plus5m", deltaMinutes: 5 }, { key: "time.plus15m", deltaMinutes: 15 }, { key: "time.plus1h", deltaMinutes: 60 }, { key: "time.plus2h", deltaMinutes: 120 }
];

export const TodayView = ({ project, onProjectUpdate, onReset, onOpenNotification }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; onReset: () => void; onOpenNotification?: (notification: CalendarNotification) => void; }) => {
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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const selectedEvent = selectedEventId ? project.events.find((event) => event.id === selectedEventId) ?? null : null;
  
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
      const reminderEvents = getReminderEventsBetween(project, previousTime, nextTime);
      setLastTriggeredEvents(triggered);
      setLastTriggeredWeatherEvents(triggeredWeather);
      setLastTriggeredMoonEvents(triggeredMoon);
      const triggerTimeMinutes = toAbsoluteMinutes(nextTime);
      for (const weatherEvent of triggeredWeather) {
        lastTriggeredAtMinutesRef.current[weatherEvent.id] = triggerTimeMinutes;
      }
      const dismissed = readDismissed();
      const created = [
        ...createNotificationsFromTriggers(triggered, triggeredWeather.filter((w) => w.notifyOnTrigger !== false), triggeredMoon.filter((m) => m.notifyOnTrigger), nextTime),
        ...createReminderNotifications(reminderEvents, nextTime)
      ].filter((item) => !dismissed.has(item.id));
      setNotifications((prev) => {
        const merged = new Map<string, CalendarNotification>();
        [...prev, ...created].forEach((item) => {
          if (!dismissed.has(item.id)) merged.set(item.id, item);
        });
        return [...merged.values()];
      });
      const withTime = { ...project, currentTime: nextTime };
      const nextWeather = getCurrentWeather(withTime);
      const withEventsCompletion = applyEventCompletionActions(withTime, completed);
      const withWeatherTriggers = applyWeatherEventTriggerActions(withEventsCompletion, triggeredWeather, nextTime, nextWeather);
      const withMoonEventStatus = applyMoonEventTriggerActions(withWeatherTriggers, triggeredMoon);
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
      <SectionCard>
        <SectionHeader title={formatDisplayDate(displayDate, project.locale)} subtitle={project.name} />
        <div style={{ fontSize: 12, color: "#94a3b8" }}>{t(project.locale, "time.current")}: {String(project.currentTime.hour).padStart(2, "0")}:{String(project.currentTime.minute).padStart(2, "0")}</div>
      </SectionCard>

      <SectionCard>
        <SectionHeader title={t(project.locale, "time.quickActions")} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6, marginBottom: 8 }}>
          {quickActions.map((action) => (
            <SecondaryButton key={action.key} type="button" onClick={() => applyTimeDelta(action.deltaMinutes)} style={{ textTransform: "uppercase", fontWeight: 700 }}>
              {t(project.locale, action.key)}
            </SecondaryButton>
          ))}
        </div>
        <Toolbar>
          <PrimaryButton type="button" onClick={() => applyTimeDelta(480)} style={{ width: "100%" }}>🛌 {t(project.locale, "time.longRest")}</PrimaryButton>
        </Toolbar>
      </SectionCard>

      <TriggerSummaryCard
        locale={project.locale}
        notifications={notifications}
        onOpen={onOpenNotification}
        onDismiss={(id) => {
          setNotifications((prev) => prev.filter((item) => item.id !== id));
          const dismissed = readDismissed();
          dismissed.add(id);
          persistDismissed(dismissed);
        }}
      />

      <TodayEventsCard project={project} eventsToday={eventsToday} onSelectEvent={setSelectedEventId} />
      {selectedEvent ? <EventDetailsPopup project={project} event={selectedEvent} onClose={() => setSelectedEventId(null)} onUpdate={(updatedEvent) => onProjectUpdate(updateCalendarEvent(project, updatedEvent.id, updatedEvent))} /> : null}
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

      <PrimaryButton type="button" onClick={onReset} style={{ background: "#7f1d1d", borderColor: "#ef4444" }}>{t(project.locale, "settings.resetCalendar")}</PrimaryButton>
    </>
  );
};