import type { CalendarEvent, InternalTime, MoonEvent, WeatherEvent } from "../domain/types";

export type CalendarNotification = {
  id: string;
  type: "event" | "weather" | "moon";
  sourceId: string;
  title: string;
  summary?: string;
  createdAt: number;
  dismissed: boolean;
};

const toMomentPart = (time: InternalTime): string => `${time.absoluteDay}:${time.hour}:${time.minute}`;

export const createNotificationsFromTriggers = (
  triggeredEvents: CalendarEvent[],
  triggeredWeatherEvents: WeatherEvent[],
  triggeredMoonEvents: MoonEvent[],
  now: InternalTime,
  createdAt: number = Date.now()
): CalendarNotification[] => {
  const eventNotifications = triggeredEvents.map((event) => ({
    id: `event:${event.id}:${toMomentPart(now)}`,
    type: "event" as const,
    sourceId: event.id,
    title: event.name,
    summary: event.summary || undefined,
    createdAt,
    dismissed: false
  }));

  const weatherNotifications = triggeredWeatherEvents.map((event) => ({
    id: `weather:${event.id}:${toMomentPart(now)}`,
    type: "weather" as const,
    sourceId: event.id,
    title: event.name,
    summary: event.summary || undefined,
    createdAt,
    dismissed: false
  }));

  const moonNotifications = triggeredMoonEvents.map((event) => ({
    id: `moon:${event.id}:${toMomentPart(now)}`,
    type: "moon" as const,
    sourceId: event.id,
    title: event.name,
    summary: event.summary || undefined,
    createdAt,
    dismissed: false
  }));
  const byId = new Map<string, CalendarNotification>();
  [...eventNotifications, ...weatherNotifications, ...moonNotifications].forEach((notification) => {
    byId.set(notification.id, notification);
  });
  return [...byId.values()];
};