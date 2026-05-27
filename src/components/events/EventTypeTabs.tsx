import { t } from "../../i18n/messages";
import type { CalendarProject } from "../../domain/types";

export type EventTabKind = "calendar" | "weather" | "moon";

export const EventTypeTabs = ({ project, activeTab, onChange }: { project: CalendarProject; activeTab: EventTabKind; onChange: (tab: EventTabKind) => void }) => (
  <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
    <button type="button" onClick={() => onChange("calendar")} style={{ ...btn, background: activeTab === "calendar" ? "#374151" : "#1f2937" }}>
      {t(project.locale, "events.tabCalendar")} ({project.events.length})
    </button>
    <button type="button" onClick={() => onChange("weather")} style={{ ...btn, background: activeTab === "weather" ? "#374151" : "#1f2937" }}>
      {t(project.locale, "events.tabWeather")} ({project.weatherEvents.length})
    </button>
    <button type="button" onClick={() => onChange("moon")} style={{ ...btn, background: activeTab === "moon" ? "#374151" : "#1f2937" }}>
      {t(project.locale, "events.tabMoon")} ({project.moonEvents?.length ?? 0})
    </button>
  </div>
);

const btn = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#f3f4f6", padding: "6px 9px", fontSize: 12 };
