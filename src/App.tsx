import { useMemo, useState } from "react";
import { absoluteDayToCalendarDate, addMinutes } from "./calendar/dateEngine";
import type { CalendarProject } from "./domain/types";
import { t } from "./i18n/messages";
import { loadCalendarProject, resetCalendarProject, saveCalendarProject } from "./storage/calendarStorage";

type QuickAction = { key: string; deltaMinutes: number };

const quickActions: QuickAction[] = [
  { key: "time.minus2h", deltaMinutes: -120 },
  { key: "time.minus1h", deltaMinutes: -60 },
  { key: "time.minus15m", deltaMinutes: -15 },
  { key: "time.minus5m", deltaMinutes: -5 },
  { key: "time.plus5m", deltaMinutes: 5 },
  { key: "time.plus15m", deltaMinutes: 15 },
  { key: "time.plus1h", deltaMinutes: 60 },
  { key: "time.plus2h", deltaMinutes: 120 },
  { key: "time.longRest", deltaMinutes: 480 }
];

export const App = () => {
  const [project, setProject] = useState<CalendarProject>(() => loadCalendarProject());

  const displayDate = useMemo(
    () => absoluteDayToCalendarDate(project.currentTime, project.calendarSystem),
    [project]
  );

  const applyTimeDelta = (deltaMinutes: number) => {
    const updated: CalendarProject = {
      ...project,
      currentTime: addMinutes(project.currentTime, deltaMinutes)
    };
    const result = saveCalendarProject(updated);
    if (result.ok) setProject(updated);
  };

  const handleReset = () => {
    const reset = resetCalendarProject();
    setProject(reset);
  };

  return (
    <main
      style={{
        width: 360,
        minHeight: 480,
        boxSizing: "border-box",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 13,
        background: "#10131a",
        color: "#e5e7eb",
        padding: 12,
        borderRadius: 8
      }}
    >
      <h1 style={{ fontSize: 16, margin: "0 0 10px" }}>{t(project.locale, "app.title")}</h1>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>{project.name}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6, marginBottom: 10 }}>
        <div>
          <strong>{t(project.locale, "calendar.currentDate")}:</strong> {displayDate.dayOfMonth} {displayDate.monthName}
        </div>
        <div>
          <strong>{t(project.locale, "calendar.weekday")}:</strong> {displayDate.weekdayName}
        </div>
        <div>
          <strong>{t(project.locale, "common.month")}:</strong> {displayDate.monthName}
        </div>
        <div>
          <strong>{t(project.locale, "common.year")}:</strong> {displayDate.year}
        </div>
        <div>
          <strong>{t(project.locale, "time.current")}:</strong> {String(displayDate.hour).padStart(2, "0")}:{String(displayDate.minute).padStart(2, "0")}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10 }}>
        {quickActions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={() => applyTimeDelta(action.deltaMinutes)}
            style={{
              border: "1px solid #374151",
              borderRadius: 6,
              background: "#1f2937",
              color: "#f3f4f6",
              padding: "6px 4px",
              fontSize: 12,
              cursor: "pointer"
            }}
          >
            {t(project.locale, action.key)}
          </button>
        ))}
      </div>

      <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
        <div>{t(project.locale, "calendar.seasonPlaceholder")}</div>
        <div>{t(project.locale, "calendar.weatherPlaceholder")}</div>
        <div>{t(project.locale, "calendar.moonPlaceholder")}</div>
      </div>

      <button
        type="button"
        onClick={handleReset}
        style={{ border: "1px solid #7f1d1d", borderRadius: 6, background: "#991b1b", color: "#fff", padding: "7px 10px", fontSize: 12 }}
      >
        {t(project.locale, "settings.resetCalendar")}
      </button>
    </main>
  );
};