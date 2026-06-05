import type { CalendarProject, DateFormatPreference, TimeFormatPreference } from "../../domain/types";
import { t } from "../../i18n/messages";

type Props = { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; inputStyle: React.CSSProperties };

const dateFormats: DateFormatPreference[] = ["weekdayDayMonthYear", "dayMonthYear", "dayMonthYearNumeric", "yearMonthDay", "monthDayYear"];
const timeFormats: TimeFormatPreference[] = ["24h", "12h"];

export const DisplaySettingsSection = ({ project, onProjectUpdate, inputStyle }: Props) => {
  const weekdays = [...project.calendarSystem.weekdays].sort((a, b) => a.order - b.order);

  return (
    <>
      <Field label={t(project.locale, "settings.firstDisplayedWeekday")}>
        <select value={project.uiSettings.monthGridStartsOnWeekdayId ?? weekdays[0]?.id} onChange={(e) => onProjectUpdate({ ...project, uiSettings: { ...project.uiSettings, monthGridStartsOnWeekdayId: e.target.value } })} style={inputStyle}>
          {weekdays.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </Field>
      <Field label={t(project.locale, "settings.dateFormat")}>
        <select value={project.uiSettings.dateFormat ?? "weekdayDayMonthYear"} onChange={(e) => onProjectUpdate({ ...project, uiSettings: { ...project.uiSettings, dateFormat: e.target.value as DateFormatPreference } })} style={inputStyle}>
          {dateFormats.map((format) => <option key={format} value={format}>{t(project.locale, `settings.dateFormat.${format}`)}</option>)}
        </select>
      </Field>
      <Field label={t(project.locale, "settings.timeFormat")}>
        <select value={project.uiSettings.timeFormat ?? "24h"} onChange={(e) => onProjectUpdate({ ...project, uiSettings: { ...project.uiSettings, timeFormat: e.target.value as TimeFormatPreference } })} style={inputStyle}>
          {timeFormats.map((format) => <option key={format} value={format}>{t(project.locale, `settings.timeFormat.${format}`)}</option>)}
        </select>
      </Field>
    </>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (<label style={{ display: "block" }}><div style={{ fontSize: 12, color: "#cbd5e1" }}>{label}</div>{children}</label>);