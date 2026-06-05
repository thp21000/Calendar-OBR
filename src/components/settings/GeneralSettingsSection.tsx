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
    <Field label={t(project.locale, "settings.unitsSummary")}><div style={{ color: "#cbd5e1", fontSize: 12, margin: "4px 0 8px" }}>{t(project.locale, "settings.unitsFixedMetric")}</div></Field>
    <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 12, color: "#cbd5e1" }}><input type="checkbox" checked={project.uiSettings.compactMode} onChange={(e) => onProjectUpdate({ ...project, uiSettings: { ...project.uiSettings, compactMode: e.target.checked } })} />{t(project.locale, "settings.compactMode")}</label>
  </>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (<label style={{ display: "block" }}><div style={{ fontSize: 12, color: "#cbd5e1" }}>{label}</div>{children}</label>);