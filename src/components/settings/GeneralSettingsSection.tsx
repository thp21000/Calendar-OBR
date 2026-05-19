import type { CalendarProject, LocaleCode } from "../../domain/types";
import { t } from "../../i18n/messages";

type Props = {
  project: CalendarProject;
  onProjectUpdate: (project: CalendarProject) => void;
  inputStyle: React.CSSProperties;
};

export const GeneralSettingsSection = ({ project, onProjectUpdate, inputStyle }: Props) => (
  <>
    <Field label={t(project.locale, "settings.calendarName")}><input value={project.name} onChange={(e) => onProjectUpdate({ ...project, name: e.target.value })} style={inputStyle} /></Field>
    <Field label={t(project.locale, "settings.language")}><select value={project.locale} onChange={(e) => onProjectUpdate({ ...project, locale: e.target.value as LocaleCode })} style={inputStyle}><option value="fr">Français</option><option value="en">English</option></select></Field>
    <Field label={t(project.locale, "settings.eraName")}><input value={project.calendarSystem.eraName} onChange={(e) => onProjectUpdate({ ...project, calendarSystem: { ...project.calendarSystem, eraName: e.target.value } })} style={inputStyle} /></Field>
  </>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (<label style={{ display: "block" }}><div style={{ fontSize: 12, color: "#cbd5e1" }}>{label}</div>{children}</label>);
