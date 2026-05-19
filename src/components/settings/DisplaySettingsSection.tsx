import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";

type Props = { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; inputStyle: React.CSSProperties };

export const DisplaySettingsSection = ({ project, onProjectUpdate, inputStyle }: Props) => {
  const weekdays = [...project.calendarSystem.weekdays].sort((a, b) => a.order - b.order);

  return (
    <>
      <Field label={t(project.locale, "settings.firstDisplayedWeekday")}>
        <select value={project.uiSettings.monthGridStartsOnWeekdayId ?? weekdays[0]?.id} onChange={(e) => onProjectUpdate({ ...project, uiSettings: { ...project.uiSettings, monthGridStartsOnWeekdayId: e.target.value } })} style={inputStyle}>
          {weekdays.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </Field>
      <div style={{ color: "#9ca3af" }}>{t(project.locale, "settings.dateFormat")} — {t(project.locale, "common.comingSoon")}</div>
      <div style={{ color: "#9ca3af" }}>{t(project.locale, "settings.timeFormat")} — 24h ({t(project.locale, "common.comingSoon")})</div>
    </>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (<label style={{ display: "block" }}><div style={{ fontSize: 12, color: "#cbd5e1" }}>{label}</div>{children}</label>);
