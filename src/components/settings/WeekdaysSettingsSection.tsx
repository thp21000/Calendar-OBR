import { addWeekday, moveWeekday, normalizeUiSettingsWeekdaySelection, removeWeekday, updateWeekday } from "../../calendar/settingsLogic";
import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { CollapsibleSection } from "../CollapsibleSection";

export const WeekdaysSettingsSection = ({ project, onProjectUpdate, inputStyle }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; inputStyle: React.CSSProperties }) => {
  const weekdays = [...project.calendarSystem.weekdays].sort((a, b) => a.order - b.order);
  return (
    <>
      {weekdays.map((d) => (
        <CollapsibleSection key={d.id} title={d.name}>
          <Field label={t(project.locale, "settings.calendarName")}><input value={d.name} onChange={(e)=>onProjectUpdate({ ...project, calendarSystem: updateWeekday(project.calendarSystem, d.id, { name: e.target.value }) })} style={inputStyle} /></Field>
          <Field label={t(project.locale, "settings.shortName")}><input value={d.shortName ?? ""} onChange={(e)=>onProjectUpdate({ ...project, calendarSystem: updateWeekday(project.calendarSystem, d.id, { shortName: e.target.value }) })} style={inputStyle} /></Field>
          <RowButtons>
            <Action onClick={()=>onProjectUpdate({ ...project, calendarSystem: moveWeekday(project.calendarSystem, d.id, -1) })}>{t(project.locale, "common.moveUp")}</Action>
            <Action onClick={()=>onProjectUpdate({ ...project, calendarSystem: moveWeekday(project.calendarSystem, d.id, 1) })}>{t(project.locale, "common.moveDown")}</Action>
            <Action onClick={()=>{ const nextSystem = removeWeekday(project.calendarSystem, d.id); onProjectUpdate({ ...project, calendarSystem: nextSystem, uiSettings: normalizeUiSettingsWeekdaySelection(nextSystem, project.uiSettings) }); }}>{t(project.locale, "common.delete")}</Action>
          </RowButtons>
        </CollapsibleSection>
      ))}
      <Action onClick={()=>{ const nextSystem = addWeekday(project.calendarSystem); onProjectUpdate({ ...project, calendarSystem: nextSystem, uiSettings: normalizeUiSettingsWeekdaySelection(nextSystem, project.uiSettings) }); }}>{t(project.locale, "common.add")} {t(project.locale, "settings.section.weekdays")}</Action>
    </>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (<label style={{ display: "block" }}><div style={{ fontSize: 12, color: "#cbd5e1" }}>{label}</div>{children}</label>);
const RowButtons = ({ children }: { children: React.ReactNode }) => <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>{children}</div>;
const Action = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button type="button" style={{ border: "1px solid #4b5563", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "5px 8px", fontSize: 12 }} {...props}>{children}</button>;
