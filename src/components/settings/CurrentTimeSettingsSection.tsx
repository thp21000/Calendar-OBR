import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import { formatDisplayDate } from "../../calendar/formatDisplayDate";
import { updateCurrentTimeFromDate } from "../../calendar/settingsLogic";
import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";

type Props = {
  project: CalendarProject;
  onProjectUpdate: (project: CalendarProject) => void;
  inputStyle: React.CSSProperties;
};

export const CurrentTimeSettingsSection = ({ project, onProjectUpdate, inputStyle }: Props) => {
  const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  const months = [...project.calendarSystem.months].sort((a, b) => a.order - b.order);

  const updateDate = (patch: Partial<typeof displayDate>) => {
    const next = { ...displayDate, ...patch };
    const nextTime = updateCurrentTimeFromDate(project, next);
    onProjectUpdate({ ...project, currentTime: nextTime });
  };

  return (
    <>
      <div style={{ marginBottom: 8 }}><strong>{t(project.locale, "settings.datePreview")}:</strong> {formatDisplayDate(displayDate, project.locale, project.uiSettings.dateFormat, project.uiSettings.timeFormat)}</div>
      <Field label={t(project.locale, "settings.currentYear")}><input type="number" value={displayDate.year} onChange={(e) => updateDate({ year: Number(e.target.value) })} style={inputStyle} /></Field>
      <Field label={t(project.locale, "settings.currentMonth")}><select value={displayDate.monthId} onChange={(e) => updateDate({ monthId: e.target.value })} style={inputStyle}>{months.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
      <Field label={t(project.locale, "settings.currentDay")}><input type="number" value={displayDate.dayOfMonth} onChange={(e) => updateDate({ dayOfMonth: Number(e.target.value) })} style={inputStyle} /></Field>
      <Field label={t(project.locale, "settings.currentHour")}><input type="number" value={displayDate.hour} onChange={(e) => updateDate({ hour: Number(e.target.value) })} style={inputStyle} /></Field>
      <Field label={t(project.locale, "settings.currentMinute")}><input type="number" value={displayDate.minute} onChange={(e) => updateDate({ minute: Number(e.target.value) })} style={inputStyle} /></Field>
    </>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (<label style={{ display: "block" }}><div style={{ fontSize: 12, color: "#cbd5e1" }}>{label}</div>{children}</label>);
