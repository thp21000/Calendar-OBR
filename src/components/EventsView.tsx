import { useState } from "react";
import type { CalendarDate, CalendarProject } from "../domain/types";
import { CalendarEventsTab } from "./events/CalendarEventsTab";
import { EventTypeTabs, type EventTabKind } from "./events/EventTypeTabs";
import { MoonEventsSettingsSection } from "./settings/MoonEventsSettingsSection";
import { WeatherEventsSettingsSection } from "./settings/WeatherEventsSettingsSection";

export const EventsView = ({ project, onProjectUpdate, initialCreateDate, initialEditEventId, onInitialCreateDateConsumed, onInitialEditEventIdConsumed }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; initialCreateDate?: CalendarDate | null; initialEditEventId?: string | null; onInitialCreateDateConsumed?: () => void; onInitialEditEventIdConsumed?: () => void; }) => {
  const [activeEventTab, setActiveEventTab] = useState<EventTabKind>("calendar");

  return (
    <>
      <EventTypeTabs project={project} activeTab={activeEventTab} onChange={setActiveEventTab} />
      {activeEventTab === "calendar" ? <CalendarEventsTab project={project} onProjectUpdate={onProjectUpdate} initialCreateDate={initialCreateDate} initialEditEventId={initialEditEventId} onInitialCreateDateConsumed={onInitialCreateDateConsumed} onInitialEditEventIdConsumed={onInitialEditEventIdConsumed} /> : null}
      {activeEventTab === "weather" ? <WeatherEventsSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} /> : null}
      {activeEventTab === "moon" ? <MoonEventsSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} /> : null}
    </>
  );
};

const inputStyle = { width: "100%", background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 6, padding: "6px 8px", fontSize: 12, lineHeight: "16px", minHeight: 32, boxSizing: "border-box" as const };