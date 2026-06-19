import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DEFAULT_PLAYER_VIEW_SETTINGS } from "../../../calendar/playerViewSettings";
import { createDefaultCalendarProject } from "../../../storage/calendarStorage";
import type { PublicMonthSnapshot } from "../../../obr/publicSnapshot";
import { PlayerMonthView } from "../PlayerMonthView";

const snapshotMonth = (): PublicMonthSnapshot => ({
  viewedTime: { absoluteDay: 0, hour: 0, minute: 0 },
  previousViewedTime: { absoluteDay: -30, hour: 0, minute: 0 },
  nextViewedTime: { absoluteDay: 30, hour: 0, minute: 0 },
  monthLabel: "Published Snapshot Month",
  previousMonthLabel: "Hidden Previous Month",
  nextMonthLabel: "Hidden Next Month",
  weekdays: ["D1"],
  leadingEmptyDays: 0,
  days: [{
    key: "today",
    absoluteDay: 0,
    dayOfMonth: 1,
    dateLabel: "1 Published",
    isToday: true,
    events: [{ id: "snapshot-event", name: "Snapshot Event", timeLabel: "08:00", summary: "snapshot only" }],
    weatherEvents: [],
    moonEvents: [],
    dayNotes: [],
    markers: [{ id: "event:snapshot-event", icon: "⭐", label: "Snapshot Event", type: "event" }]
  }],
  dailyForecast: []
});

const renderMonth = (props: Partial<Parameters<typeof PlayerMonthView>[0]> = {}) => renderToStaticMarkup(createElement(PlayerMonthView, {
  settings: DEFAULT_PLAYER_VIEW_SETTINGS,
  locale: "en",
  isSnapshotMode: false,
  onSelectEvent: () => undefined,
  ...props
}));

describe("PlayerMonthView", () => {
  it("uses the snapshot month and hides previous/next navigation in snapshot mode", () => {
    const html = renderMonth({
      isSnapshotMode: true,
      snapshotMonth: snapshotMonth(),
      project: createDefaultCalendarProject()
    });

    expect(html).toContain("Published Snapshot Month");
    expect(html).toContain("Snapshot Event");
    expect(html).not.toContain("Day events");
    expect(html).not.toContain("Close details");
    expect(html).not.toContain("Hidden Previous Month");
    expect(html).not.toContain("Hidden Next Month");
  });

  it("shows an unavailable message in snapshot mode without a month snapshot", () => {
    const html = renderMonth({ isSnapshotMode: true, snapshotMonth: undefined, project: undefined });

    expect(html).toContain("No public month view is available.");
  });

  it("keeps previous and next navigation in GM preview mode", () => {
    const html = renderMonth({ isSnapshotMode: false, project: createDefaultCalendarProject() });

    expect(html).toContain("Mois 2 999");
    expect(html).toContain("Mois 2 1000");
  });

  it("renders month cell markers from the public snapshot", () => {
    const month = snapshotMonth();
    month.days[0].markers = [
      { id: "event:snapshot-event", icon: "⭐", label: "Snapshot Event", type: "event" },
      { id: "weather:rain", icon: "🌧️", label: "Rain", type: "weather" },
      { id: "moon:full", icon: "🌕", label: "Moon", type: "moon" },
      { id: "note:public", icon: "📝", label: "Note", type: "note" }
    ];

    const html = renderMonth({ isSnapshotMode: true, snapshotMonth: month, project: createDefaultCalendarProject() });

    expect(html).toContain("⭐");
    expect(html).toContain("🌧️");
    expect(html).toContain("+2");
  });
});
