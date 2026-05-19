import { addMonth, moveMonth, removeMonth, updateMonth } from "../../calendar/settingsLogic";
import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { CollapsibleSection } from "../CollapsibleSection";

export const MonthsSettingsSection = ({ project, onProjectUpdate, inputStyle }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; inputStyle: React.CSSProperties }) => {
  const months = [...project.calendarSystem.months].sort((a, b) => a.order - b.order);
  return (
    <>
      {months.map((m) => (
        <CollapsibleSection key={m.id} title={`${m.name} — ${m.days} ${t(project.locale, "settings.daysCount")}`}>
          <Field label={t(project.locale, "settings.calendarName")}><input value={m.name} onChange={(e)=>onProjectUpdate({ ...project, calendarSystem: updateMonth(project.calendarSystem, m.id, { name: e.target.value }) })} style={inputStyle} /></Field>
          <Field label={t(project.locale, "settings.shortName")}><input value={m.shortName ?? ""} onChange={(e)=>onProjectUpdate({ ...project, calendarSystem: updateMonth(project.calendarSystem, m.id, { shortName: e.target.value }) })} style={inputStyle} /></Field>
          <Field label={t(project.locale, "settings.daysCount")}><input type="number" min={1} value={m.days} onChange={(e)=>onProjectUpdate({ ...project, calendarSystem: updateMonth(project.calendarSystem, m.id, { days: Number(e.target.value) || 1 }) })} style={inputStyle} /></Field>
          <RowButtons>
            <Action onClick={()=>onProjectUpdate({ ...project, calendarSystem: moveMonth(project.calendarSystem, m.id, -1) })}>{t(project.locale, "common.moveUp")}</Action>
            <Action onClick={()=>onProjectUpdate({ ...project, calendarSystem: moveMonth(project.calendarSystem, m.id, 1) })}>{t(project.locale, "common.moveDown")}</Action>
            <Action onClick={()=>onProjectUpdate({ ...project, calendarSystem: removeMonth(project.calendarSystem, m.id) })}>{t(project.locale, "common.delete")}</Action>
          </RowButtons>
        </CollapsibleSection>
      ))}
      <Action onClick={()=>onProjectUpdate({ ...project, calendarSystem: addMonth(project.calendarSystem) })}>{t(project.locale, "common.add")} {t(project.locale, "settings.section.months")}</Action>
    </>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (<label style={{ display: "block" }}><div style={{ fontSize: 12, color: "#cbd5e1" }}>{label}</div>{children}</label>);
const RowButtons = ({ children }: { children: React.ReactNode }) => <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>{children}</div>;
const Action = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button type="button" style={{ border: "1px solid #4b5563", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "5px 8px", fontSize: 12 }} {...props}>{children}</button>;
