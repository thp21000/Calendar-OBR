import { describe, expect, it } from "vitest";
import { createNotificationsFromTriggers } from "../notifications";
import type { CalendarEvent, WeatherEvent } from "../../domain/types";

const event = (id: string, summary?: string, gmDescription?: string): CalendarEvent => ({
  id,
  name: `event-${id}`,
  date: { year: 1000, monthId: "m1", dayOfMonth: 1, hour: 0, minute: 0 },
  recurrence: { type: "none" },
  summary: summary ?? "",
  gmDescription,
  visibility: "gm",
  notifyOnTrigger: true,
  deleteAfterTrigger: false,
  archiveAfterTrigger: false,
  status: "triggered"
});

const weather = (id: string, summary?: string): WeatherEvent => ({
  id,
  name: `weather-${id}`,
  summary,
  conditions: [],
  requireAllConditions: true,
  enabled: true
});

describe("createNotificationsFromTriggers", () => {
  it("creates notifications from events", () => {
    const notifications = createNotificationsFromTriggers([event("e1", "s1")], [], [], { absoluteDay: 10, hour: 2, minute: 30 }, 1000);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].id).toBe("event:e1:10:2:30");
    expect(notifications[0].summary).toBe("s1");
  });

  it("creates notifications from weather alerts", () => {
    const notifications = createNotificationsFromTriggers([], [weather("w1", "rain")], [], { absoluteDay: 10, hour: 2, minute: 30 }, 1000);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].id).toBe("weather:w1:10:2:30");
  });

  it("deduplicates notifications by stable id", () => {
    const notifications = createNotificationsFromTriggers([event("e1"), event("e1")], [weather("w1"), weather("w1")], [], { absoluteDay: 10, hour: 2, minute: 30 }, 1000);
    expect(notifications.map((n) => n.id)).toEqual(["event:e1:10:2:30", "weather:w1:10:2:30"]);
  });

  it("never copies gmDescription", () => {
    const notifications = createNotificationsFromTriggers([event("e1", "public", "secret gm")], [], [], { absoluteDay: 10, hour: 2, minute: 30 }, 1000);
    expect(JSON.stringify(notifications)).not.toContain("secret gm");
    expect((notifications[0] as unknown as { gmDescription?: string }).gmDescription).toBeUndefined();
  });
});