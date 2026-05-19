import { absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { ensureValidCalendarSystem, updateCurrentTimeFromDate } from "../calendar/settingsLogic";
import type { CalendarProject, LocaleCode } from "../domain/types";
import { t } from "../i18n/messages";

export const SettingsView = ({
  project,
  onProjectUpdate,
  saveError
}: {
  project: CalendarProject;
  onProjectUpdate: (project: CalendarProject) => void;
  saveError: string | null;
}) => {
  const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  const months = [...project.calendarSystem.months].sort((a, b) => a.order - b.order);
  const weekdays = [...project.calendarSystem.weekdays].sort((a, b) => a.order - b.order);

  const updateDate = (patch: Partial<typeof displayDate>) => {
    const next = { ...displayDate, ...patch };
    const nextTime = updateCurrentTimeFromDate(project, next);
    onProjectUpdate({ ...project, currentTime: nextTime });
  };

  const updateSystem = (mutator: (draft: CalendarProject) => CalendarProject) => {
    const next = mutator(project);
    const normalized = ensureValidCalendarSystem(next.calendarSystem);
    onProjectUpdate({ ...next, calendarSystem: normalized });
  };

  return (
    <div style={{ maxHeight: 380, overflowY: "auto", paddingRight: 4 }}>
      <h2 style={{ margin: "0 0 8px", fontSize: 14 }}>{t(project.locale, "settings.title")}</h2>
      {saveError ? <div style={{ color: "#fca5a5", marginBottom: 8 }}>{t(project.locale, "settings.saveError")}</div> : null}

      <label>{t(project.locale, "settings.calendarName")}</label>
      <input value={project.name} onChange={(e) => onProjectUpdate({ ...project, name: e.target.value })} style={inputStyle} />

      <label>{t(project.locale, "settings.language")}</label>
      <select value={project.locale} onChange={(e) => onProjectUpdate({ ...project, locale: e.target.value as LocaleCode })} style={inputStyle}>
        <option value="fr">Français</option>
        <option value="en">English</option>
      </select>

      <label>{t(project.locale, "settings.currentYear")}</label>
      <input type="number" value={displayDate.year} onChange={(e) => updateDate({ year: Number(e.target.value) })} style={inputStyle} />

      <label>{t(project.locale, "settings.currentMonth")}</label>
      <select value={displayDate.monthId} onChange={(e) => updateDate({ monthId: e.target.value })} style={inputStyle}>
        {months.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>

      <label>{t(project.locale, "settings.currentDay")}</label>
      <input type="number" value={displayDate.dayOfMonth} onChange={(e) => updateDate({ dayOfMonth: Number(e.target.value) })} style={inputStyle} />
      <label>{t(project.locale, "settings.currentHour")}</label>
      <input type="number" value={displayDate.hour} onChange={(e) => updateDate({ hour: Number(e.target.value) })} style={inputStyle} />
      <label>{t(project.locale, "settings.currentMinute")}</label>
      <input type="number" value={displayDate.minute} onChange={(e) => updateDate({ minute: Number(e.target.value) })} style={inputStyle} />

      <h3 style={sectionTitle}>{t(project.locale, "settings.months")}</h3>
      {months.map((m, i) => (
        <div key={m.id} style={rowStyle}>
          <input value={m.name} onChange={(e) => updateSystem((p) => ({ ...p, calendarSystem: { ...p.calendarSystem, months: p.calendarSystem.months.map((x) => x.id === m.id ? { ...x, name: e.target.value } : x) } }))} style={smallInput} />
          <input value={m.shortName ?? ""} placeholder={t(project.locale, "settings.shortName")} onChange={(e) => updateSystem((p) => ({ ...p, calendarSystem: { ...p.calendarSystem, months: p.calendarSystem.months.map((x) => x.id === m.id ? { ...x, shortName: e.target.value } : x) } }))} style={smallInput} />
          <input type="number" value={m.days} min={1} onChange={(e) => updateSystem((p) => ({ ...p, calendarSystem: { ...p.calendarSystem, months: p.calendarSystem.months.map((x) => x.id === m.id ? { ...x, days: Math.max(1, Number(e.target.value) || 1) } : x) } }))} style={{ ...smallInput, width: 64 }} />
          <button onClick={() => updateSystem((p) => ({ ...p, calendarSystem: { ...p.calendarSystem, months: swap(p.calendarSystem.months, i, i - 1) } }))}>↑</button>
          <button onClick={() => updateSystem((p) => ({ ...p, calendarSystem: { ...p.calendarSystem, months: swap(p.calendarSystem.months, i, i + 1) } }))}>↓</button>
          <button onClick={() => updateSystem((p) => ({ ...p, calendarSystem: { ...p.calendarSystem, months: p.calendarSystem.months.length > 1 ? p.calendarSystem.months.filter((x) => x.id !== m.id) : p.calendarSystem.months } }))}>{t(project.locale, "settings.removeMonth")}</button>
        </div>
      ))}
      <button onClick={() => updateSystem((p) => ({ ...p, calendarSystem: { ...p.calendarSystem, months: [...p.calendarSystem.months, { id: `month-${Date.now()}`, name: `Month ${p.calendarSystem.months.length + 1}`, order: p.calendarSystem.months.length + 1, days: 30 }] } }))}>{t(project.locale, "settings.addMonth")}</button>

      <h3 style={sectionTitle}>{t(project.locale, "settings.weekdays")}</h3>
      {weekdays.map((d, i) => (
        <div key={d.id} style={rowStyle}>
          <input value={d.name} onChange={(e) => updateSystem((p) => ({ ...p, calendarSystem: { ...p.calendarSystem, weekdays: p.calendarSystem.weekdays.map((x) => x.id === d.id ? { ...x, name: e.target.value } : x) } }))} style={smallInput} />
          <input value={d.shortName ?? ""} placeholder={t(project.locale, "settings.shortName")} onChange={(e) => updateSystem((p) => ({ ...p, calendarSystem: { ...p.calendarSystem, weekdays: p.calendarSystem.weekdays.map((x) => x.id === d.id ? { ...x, shortName: e.target.value } : x) } }))} style={smallInput} />
          <button onClick={() => updateSystem((p) => ({ ...p, calendarSystem: { ...p.calendarSystem, weekdays: swap(p.calendarSystem.weekdays, i, i - 1) } }))}>↑</button>
          <button onClick={() => updateSystem((p) => ({ ...p, calendarSystem: { ...p.calendarSystem, weekdays: swap(p.calendarSystem.weekdays, i, i + 1) } }))}>↓</button>
          <button onClick={() => updateSystem((p) => ({ ...p, calendarSystem: { ...p.calendarSystem, weekdays: p.calendarSystem.weekdays.length > 1 ? p.calendarSystem.weekdays.filter((x) => x.id !== d.id) : p.calendarSystem.weekdays } }))}>{t(project.locale, "settings.removeWeekday")}</button>
        </div>
      ))}
      <button onClick={() => updateSystem((p) => ({ ...p, calendarSystem: { ...p.calendarSystem, weekdays: [...p.calendarSystem.weekdays, { id: `day-${Date.now()}`, name: `Day ${p.calendarSystem.weekdays.length + 1}`, shortName: `D${p.calendarSystem.weekdays.length + 1}`, order: p.calendarSystem.weekdays.length + 1 }] } }))}>{t(project.locale, "settings.addWeekday")}</button>

      <label>{t(project.locale, "settings.firstWeekdayOffset")}</label>
      <input type="number" min={0} value={project.calendarSystem.firstWeekdayOffset ?? 0} onChange={(e) => updateSystem((p) => ({ ...p, calendarSystem: { ...p.calendarSystem, firstWeekdayOffset: Math.max(0, Math.trunc(Number(e.target.value) || 0)) } }))} style={inputStyle} />
    </div>
  );
};

const inputStyle = { width: "100%", margin: "4px 0 8px", background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 6, padding: "6px 8px", boxSizing: "border-box" as const };
const smallInput = { ...inputStyle, margin: 0, width: 90 };
const rowStyle = { display: "flex", gap: 4, alignItems: "center", marginBottom: 6, flexWrap: "wrap" as const };
const sectionTitle = { margin: "12px 0 8px", fontSize: 13 };

function swap<T>(arr: T[], a: number, b: number): T[] {
  if (b < 0 || b >= arr.length) return arr;
  const copy = [...arr];
  const tmp = copy[a];
  copy[a] = copy[b];
  copy[b] = tmp;
  return copy;
}
