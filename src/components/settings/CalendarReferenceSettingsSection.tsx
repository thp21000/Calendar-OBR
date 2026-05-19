import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";

export const CalendarReferenceSettingsSection = ({ project, onProjectUpdate, inputStyle }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; inputStyle: React.CSSProperties }) => {
  const weekdays = [...project.calendarSystem.weekdays].sort((a, b) => a.order - b.order);
  return (
    <>
      <Field label={t(project.locale, "settings.referenceFirstDay")}>
        <select
          value={weekdays[(project.calendarSystem.firstWeekdayOffset ?? 0) % weekdays.length]?.id}
          onChange={(e) => {
            const idx = weekdays.findIndex((d) => d.id === e.target.value);
            if (idx >= 0) onProjectUpdate({ ...project, calendarSystem: { ...project.calendarSystem, firstWeekdayOffset: idx } });
          }}
          style={inputStyle}
        >
          {weekdays.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </Field>
      <div style={{ color: "#9ca3af", fontSize: 12 }}>{t(project.locale, "settings.referenceFirstDayHelp")}</div>
    </>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (<label style={{ display: "block" }}><div style={{ fontSize: 12, color: "#cbd5e1" }}>{label}</div>{children}</label>);
