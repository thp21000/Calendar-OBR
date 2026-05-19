import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";

export const YearsSettingsSection = ({ project, onProjectUpdate, inputStyle }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; inputStyle: React.CSSProperties }) => (
  <>
    <Field label={t(project.locale, "settings.currentYear")}><input type="number" value={project.calendarSystem.startYear} onChange={(e)=>onProjectUpdate({ ...project, calendarSystem:{...project.calendarSystem,startYear:Number(e.target.value)||0} })} style={inputStyle} /></Field>
    <Field label={t(project.locale, "settings.eraName")}><input value={project.calendarSystem.eraName} onChange={(e)=>onProjectUpdate({ ...project, calendarSystem:{...project.calendarSystem,eraName:e.target.value} })} style={inputStyle} /></Field>
  </>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (<label style={{ display: "block" }}><div style={{ fontSize: 12, color: "#cbd5e1" }}>{label}</div>{children}</label>);
