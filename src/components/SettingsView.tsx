import { ensureValidCalendarSystem } from "../calendar/settingsLogic";
import type { CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";
import type { StorageScope } from "../obr/roomScope";
import { CollapsibleSection } from "./CollapsibleSection";
import { CurrentTimeSettingsSection } from "./settings/CurrentTimeSettingsSection";
import { DataSettingsSection } from "./settings/DataSettingsSection";
import { DisplaySettingsSection } from "./settings/DisplaySettingsSection";
import { GeneralSettingsSection } from "./settings/GeneralSettingsSection";

export const SettingsView = ({
  project,
  onProjectUpdate,
  saveError,
  scope,
  onReset
}: {
  project: CalendarProject;
  onProjectUpdate: (project: CalendarProject) => void;
  saveError: string | null;
  scope: StorageScope;
  onReset: () => void;
}) => {
  const months = [...project.calendarSystem.months].sort((a, b) => a.order - b.order);
  const weekdays = [...project.calendarSystem.weekdays].sort((a, b) => a.order - b.order);

  const updateSystem = (next: CalendarProject) =>
    onProjectUpdate({ ...next, calendarSystem: ensureValidCalendarSystem(next.calendarSystem) });

  return (
    <div style={{ maxHeight: 380, overflowY: "auto", overflowX: "hidden", paddingRight: 2 }}>
      {saveError ? <div style={{ color: "#fca5a5", marginBottom: 8 }}>{t(project.locale, "settings.saveError")}</div> : null}

      <CollapsibleSection title={t(project.locale, "settings.section.general")} defaultOpen>
        <GeneralSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
      </CollapsibleSection>

      <CollapsibleSection title={t(project.locale, "settings.section.currentTime")} defaultOpen>
        <CurrentTimeSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
      </CollapsibleSection>

      <CollapsibleSection title={t(project.locale, "settings.section.calendarStructure")}>
        <CollapsibleSection title={t(project.locale, "settings.section.months")}>
          {months.map((m, i) => (
            <CollapsibleSection key={m.id} title={`${m.name} — ${m.days} ${t(project.locale, "settings.daysCount")}`}>
              <Field label={t(project.locale, "settings.calendarName")}><input value={m.name} onChange={(e)=>updateSystem({ ...project, calendarSystem: { ...project.calendarSystem, months: project.calendarSystem.months.map((x)=>x.id===m.id?{...x,name:e.target.value}:x) } })} style={inputStyle} /></Field>
              <Field label={t(project.locale, "settings.shortName")}><input value={m.shortName ?? ""} onChange={(e)=>updateSystem({ ...project, calendarSystem: { ...project.calendarSystem, months: project.calendarSystem.months.map((x)=>x.id===m.id?{...x,shortName:e.target.value}:x) } })} style={inputStyle} /></Field>
              <Field label={t(project.locale, "settings.daysCount")}><input type="number" min={1} value={m.days} onChange={(e)=>updateSystem({ ...project, calendarSystem: { ...project.calendarSystem, months: project.calendarSystem.months.map((x)=>x.id===m.id?{...x,days:Math.max(1,Number(e.target.value)||1)}:x) } })} style={inputStyle} /></Field>
              <RowButtons>
                <Action onClick={()=>updateSystem({ ...project, calendarSystem: { ...project.calendarSystem, months: swap(project.calendarSystem.months,i,i-1) } })}>{t(project.locale, "common.moveUp")}</Action>
                <Action onClick={()=>updateSystem({ ...project, calendarSystem: { ...project.calendarSystem, months: swap(project.calendarSystem.months,i,i+1) } })}>{t(project.locale, "common.moveDown")}</Action>
                <Action onClick={()=>updateSystem({ ...project, calendarSystem: { ...project.calendarSystem, months: project.calendarSystem.months.length>1?project.calendarSystem.months.filter((x)=>x.id!==m.id):project.calendarSystem.months } })}>{t(project.locale, "common.delete")}</Action>
              </RowButtons>
            </CollapsibleSection>
          ))}
          <Action onClick={()=>updateSystem({ ...project, calendarSystem: { ...project.calendarSystem, months: [...project.calendarSystem.months,{id:`month-${Date.now()}`,name:`Month ${project.calendarSystem.months.length+1}`,order:project.calendarSystem.months.length+1,days:30}] } })}>{t(project.locale, "common.add")} {t(project.locale, "settings.section.months")}</Action>
        </CollapsibleSection>

        <CollapsibleSection title={t(project.locale, "settings.section.weekdays")}>
          {weekdays.map((d,i)=><CollapsibleSection key={d.id} title={d.name}><Field label={t(project.locale,"settings.calendarName")}><input value={d.name} onChange={(e)=>updateSystem({ ...project, calendarSystem:{...project.calendarSystem, weekdays:project.calendarSystem.weekdays.map((x)=>x.id===d.id?{...x,name:e.target.value}:x)} })} style={inputStyle}/></Field><Field label={t(project.locale,"settings.shortName")}><input value={d.shortName??""} onChange={(e)=>updateSystem({ ...project, calendarSystem:{...project.calendarSystem, weekdays:project.calendarSystem.weekdays.map((x)=>x.id===d.id?{...x,shortName:e.target.value}:x)} })} style={inputStyle}/></Field><RowButtons><Action onClick={()=>updateSystem({ ...project, calendarSystem:{...project.calendarSystem, weekdays:swap(project.calendarSystem.weekdays,i,i-1)} })}>{t(project.locale,"common.moveUp")}</Action><Action onClick={()=>updateSystem({ ...project, calendarSystem:{...project.calendarSystem, weekdays:swap(project.calendarSystem.weekdays,i,i+1)} })}>{t(project.locale,"common.moveDown")}</Action><Action onClick={()=>updateSystem({ ...project, calendarSystem:{...project.calendarSystem, weekdays:project.calendarSystem.weekdays.length>1?project.calendarSystem.weekdays.filter((x)=>x.id!==d.id):project.calendarSystem.weekdays} })}>{t(project.locale,"common.delete")}</Action></RowButtons></CollapsibleSection>)}
          <Action onClick={()=>updateSystem({ ...project, calendarSystem:{...project.calendarSystem, weekdays:[...project.calendarSystem.weekdays,{id:`day-${Date.now()}`,name:`Day ${project.calendarSystem.weekdays.length+1}`,shortName:`D${project.calendarSystem.weekdays.length+1}`,order:project.calendarSystem.weekdays.length+1}]}})}>{t(project.locale, "common.add")} {t(project.locale, "settings.section.weekdays")}</Action>
        </CollapsibleSection>

        <CollapsibleSection title={t(project.locale, "settings.section.calendarReference")}>
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
        </CollapsibleSection>

        <CollapsibleSection title={t(project.locale, "settings.section.years")}>
          <Field label={t(project.locale, "settings.currentYear")}><input type="number" value={project.calendarSystem.startYear} onChange={(e)=>onProjectUpdate({ ...project, calendarSystem:{...project.calendarSystem,startYear:Number(e.target.value)||0} })} style={inputStyle} /></Field>
          <Field label={t(project.locale, "settings.eraName")}><input value={project.calendarSystem.eraName} onChange={(e)=>onProjectUpdate({ ...project, calendarSystem:{...project.calendarSystem,eraName:e.target.value} })} style={inputStyle} /></Field>
        </CollapsibleSection>
      </CollapsibleSection>

      <CollapsibleSection title={t(project.locale, "settings.section.display")}>
        <DisplaySettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
      </CollapsibleSection>

      <CollapsibleSection title={t(project.locale, "settings.section.data")}>
        <DataSettingsSection locale={project.locale} scope={scope} onReset={onReset} />
      </CollapsibleSection>

      <CollapsibleSection title={t(project.locale, "settings.section.future")}>
        <div>• {t(project.locale, "settings.futureSeasons")} — {t(project.locale, "common.comingSoon")}</div>
        <div>• {t(project.locale, "settings.futureWeather")} — {t(project.locale, "common.comingSoon")}</div>
        <div>• {t(project.locale, "settings.futureMoons")} — {t(project.locale, "common.comingSoon")}</div>
        <div>• {t(project.locale, "settings.futureEvents")} — {t(project.locale, "common.comingSoon")}</div>
        <div>• {t(project.locale, "settings.futurePacks")} — {t(project.locale, "common.comingSoon")}</div>
      </CollapsibleSection>
    </div>
  );
};

const inputStyle = { width: "100%", margin: "4px 0 8px", background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 6, padding: "6px 8px", boxSizing: "border-box" as const };
const RowButtons = ({ children }: { children: React.ReactNode }) => <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>{children}</div>;
const Action = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button type="button" style={{ border: "1px solid #4b5563", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "5px 8px", fontSize: 12 }} {...props}>{children}</button>;
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (<label style={{ display: "block" }}><div style={{ fontSize: 12, color: "#cbd5e1" }}>{label}</div>{children}</label>);

function swap<T>(arr: T[], a: number, b: number): T[] {
  if (b < 0 || b >= arr.length) return arr;
  const copy = [...arr];
  const tmp = copy[a];
  copy[a] = copy[b];
  copy[b] = tmp;
  return copy;
}