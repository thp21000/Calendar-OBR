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
import { getCurrentWeather, getHourlyWeatherForecast } from "../calendar/weatherLogic";
import { getWeatherUnitLabels } from "../calendar/weatherUnits";
import type { CalendarEvent, CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";
import { TodayEventsCard } from "./today/TodayEventsCard";
import { TodayStatusSummary, WeatherForecastCard } from "./today/WeatherAndSeasonCard";
import { EventDetailsPopup } from "./events/EventDetailsPopup";
import { PrimaryButton, SecondaryButton, SectionCard, SectionHeader, Toolbar } from "./ui";

type QuickAction = { key: string; deltaMinutes: number };
const quickActions: QuickAction[] = [
  { key: "time.minus2h", deltaMinutes: -120 }, { key: "time.minus1h", deltaMinutes: -60 }, { key: "time.minus15m", deltaMinutes: -15 }, { key: "time.minus5m", deltaMinutes: -5 },
  { key: "time.plus5m", deltaMinutes: 5 }, { key: "time.plus15m", deltaMinutes: 15 }, { key: "time.plus1h", deltaMinutes: 60 }, { key: "time.plus2h", deltaMinutes: 120 }
];

const quickActionsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(48px, 1fr))",
  gap: 6,
  width: "100%",
  marginBottom: 8
};

const quickActionButtonStyle: React.CSSProperties = {
  height: 34,
  padding: "0 6px",
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center"
};

const longRestButtonStyle: React.CSSProperties = {
  width: "100%",
  height: 36,
  padding: "0 10px",
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: 0.3,
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

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
      const withMoonEventStatus = applyMoonEventTriggerActions(withWeatherTriggers, triggeredMoon, nextTime.absoluteDay);
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
      <TodayStatusSummary
        project={project}
        currentSeason={currentSeason}
        currentWeather={currentWeather}
        triggeredWeatherEvents={triggeredWeatherEvents}
        weatherUnits={weatherUnits}
        currentMoonPhases={currentMoonPhases}
      />

      <TodayEventsCard project={project} eventsToday={eventsToday} moonEventsToday={triggeredMoonEvents} onSelectEvent={setSelectedEventId} />

      <WeatherForecastCard project={project} hourlyForecast={hourlyForecast} weatherUnits={weatherUnits} />

      <SectionCard>
        <SectionHeader title={t(project.locale, "time.quickActions")} />
        <div style={quickActionsGridStyle}>
          {quickActions.map((action) => (
            <SecondaryButton
              key={action.key}
              type="button"
              onClick={() => applyTimeDelta(action.deltaMinutes)}
              style={quickActionButtonStyle}
            >
              {t(project.locale, action.key)}
            </SecondaryButton>
          ))}
        </div>
        <Toolbar>
          <PrimaryButton
            type="button"
            onClick={() => applyTimeDelta(480)}
            style={longRestButtonStyle}
          >
            🛌 {t(project.locale, "time.longRest")}
          </PrimaryButton>
        </Toolbar>
      </SectionCard>

      {selectedEvent ? <EventDetailsPopup project={project} event={selectedEvent} onClose={() => setSelectedEventId(null)} onUpdate={(updatedEvent) => onProjectUpdate(updateCalendarEvent(project, updatedEvent.id, updatedEvent))} /> : null}
    </>
  );
};