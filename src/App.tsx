import { absoluteDayToCalendarDate } from "./calendar/dateEngine";
import { createDefaultCalendarProject } from "./storage/calendarStorage";
import { t } from "./i18n/messages";

export const App = () => {
  const project = createDefaultCalendarProject();
  const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);

  return (
    <main style={{ fontFamily: "sans-serif", fontSize: 14, padding: 12, maxWidth: 360 }}>
      <h1 style={{ fontSize: 18, margin: 0 }}>{project.name}</h1>
      <p style={{ margin: "8px 0 0" }}>
        <strong>{t(project.locale, "calendar.currentDate")}:</strong> {displayDate.dayOfMonth} {displayDate.monthName} {displayDate.year}
      </p>
      <p style={{ margin: "6px 0 0" }}>
        <strong>{t(project.locale, "time.current")}:</strong> {String(displayDate.hour).padStart(2, "0")}:
        {String(displayDate.minute).padStart(2, "0")}
      </p>
      <div style={{ marginTop: 12, padding: 8, border: "1px solid #ccc", borderRadius: 6 }}>MVP Calendar Core OK</div>
    </main>
  );
};