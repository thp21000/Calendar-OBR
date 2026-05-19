import { addMinutes, absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { formatDisplayDate } from "../calendar/formatDisplayDate";
import type { CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";

type QuickAction = { key: string; deltaMinutes: number };

const quickActions: QuickAction[] = [
  { key: "time.minus2h", deltaMinutes: -120 },
  { key: "time.minus1h", deltaMinutes: -60 },
  { key: "time.minus15m", deltaMinutes: -15 },
  { key: "time.minus5m", deltaMinutes: -5 },
  { key: "time.plus5m", deltaMinutes: 5 },
  { key: "time.plus15m", deltaMinutes: 15 },
  { key: "time.plus1h", deltaMinutes: 60 },
  { key: "time.plus2h", deltaMinutes: 120 }
];

const buttonStyle = {
  border: "1px solid #8b5cf6",
  borderRadius: 8,
  background: "#1a1530",
  color: "#c4b5fd",
  padding: "8px 6px",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  cursor: "pointer"
};

export const TodayView = ({
  project,
  onProjectUpdate,
  onReset
}: {
  project: CalendarProject;
  onProjectUpdate: (project: CalendarProject) => void;
  onReset: () => void;
}) => {
  const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);

  const applyTimeDelta = (deltaMinutes: number) => {
    onProjectUpdate({ ...project, currentTime: addMinutes(project.currentTime, deltaMinutes) });
  };

  return (
    <>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>{project.name}</div>
      <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 700 }}>{formatDisplayDate(displayDate, project.locale)}</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6, marginBottom: 8 }}>
        {quickActions.map((action) => (
          <button key={action.key} type="button" onClick={() => applyTimeDelta(action.deltaMinutes)} style={buttonStyle}>
            {t(project.locale, action.key)}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => applyTimeDelta(480)}
        style={{ ...buttonStyle, width: "100%", marginBottom: 10, textTransform: "none" }}
      >
        🛌 {t(project.locale, "time.longRest")}
      </button>

      <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
        <div>{t(project.locale, "calendar.seasonPlaceholder")}</div>
        <div>{t(project.locale, "calendar.weatherPlaceholder")}</div>
        <div>{t(project.locale, "calendar.moonPlaceholder")}</div>
      </div>

      <button
        type="button"
        onClick={onReset}
        style={{ border: "1px solid #7f1d1d", borderRadius: 6, background: "#991b1b", color: "#fff", padding: "7px 10px", fontSize: 12 }}
      >
        {t(project.locale, "settings.resetCalendar")}
      </button>
    </>
  );
};