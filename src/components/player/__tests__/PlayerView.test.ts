import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { absoluteDayToCalendarDate } from "../../../calendar/dateEngine";
import { createDefaultCalendarProject } from "../../../storage/calendarStorage";
import { PlayerView } from "../../PlayerView";

const countOccurrences = (value: string, pattern: string): number => (value.match(new RegExp(pattern, "g")) ?? []).length;

describe("PlayerView today", () => {
  it("affiche les événements météo uniquement dans le bloc météo", () => {
    const project = createDefaultCalendarProject();
    const today = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
    project.events = [{
      id: "calendar-public",
      name: "Marché public",
      date: today,
      recurrence: { type: "none" },
      summary: "Événement daté",
      visibility: "players",
      notifyOnTrigger: false,
      deleteAfterTrigger: false,
      archiveAfterTrigger: false,
      status: "active",
      allDay: true
    }];
    project.weatherEvents = [{
      id: "weather-public",
      name: "Sol gelé",
      icon: "🧊",
      summary: "Le sol est dangereux.",
      visibility: "players",
      status: "active",
      notifyOnTrigger: true,
      archiveAfterTrigger: false,
      disableAfterTrigger: false,
      kind: "informational",
      triggerChancePercent: 100,
      enabled: true,
      requireAllConditions: true,
      conditions: [{ type: "timeOfDay", startHour: 0, endHour: 23 }]
    }];

    const html = renderToStaticMarkup(createElement(PlayerView, { project }));

    expect(html).toContain("Marché public");
    expect(html).toContain("Sol gelé");
    expect(countOccurrences(html, "Sol gelé")).toBe(1);
  });
});
