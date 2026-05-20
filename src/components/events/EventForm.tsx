import { useMemo, useState } from "react";
import { absoluteDayToCalendarDate, getMonthById } from "../../calendar/dateEngine";
import { compareCalendarDates, createCalendarEvent, normalizeEventDateRange } from "../../calendar/eventsLogic";
import type { CalendarDate, CalendarEvent, CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";

export type EventFormValue = {
  name: string; icon: string; summary: string; year: number; monthId: string; dayOfMonth: number; hour: number; minute: number;
  visibility: CalendarEvent["visibility"]; allDay: boolean;
  recurrenceType: CalendarEvent["recurrence"]["type"]; recurrenceInterval: number;
  hasEndDate: boolean; endYear: number; endMonthId: string; endDayOfMonth: number; endHour: number; endMinute: number;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const toFormValue = (project: CalendarProject, event?: CalendarEvent): EventFormValue => {
  if (event) {
    return {
      name: event.name,
      icon: event.icon ?? "",
      summary: event.summary,
      year: event.date.year,
      monthId: event.date.monthId,
      dayOfMonth: event.date.dayOfMonth,
      hour: event.date.hour,
      minute: event.date.minute,
      visibility: event.visibility,
      allDay: event.allDay === true,
      recurrenceType: event.recurrence.type,
      recurrenceInterval: event.recurrence.type === "none" ? 1 : Math.max(1, event.recurrence.interval),
      hasEndDate: Boolean(event.endDate),
      endYear: event.endDate?.year ?? event.date.year,
      endMonthId: event.endDate?.monthId ?? event.date.monthId,
      endDayOfMonth: event.endDate?.dayOfMonth ?? event.date.dayOfMonth,
      endHour: event.endDate?.hour ?? clamp(event.date.hour + 1, 0, 23),
      endMinute: event.endDate?.minute ?? event.date.minute
    };
  }
  const now = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  return {
    name: "", icon: "", summary: "", year: now.year, monthId: now.monthId, dayOfMonth: now.dayOfMonth, hour: now.hour, minute: now.minute,
    visibility: "gm", allDay: false, recurrenceType: "none", recurrenceInterval: 1, hasEndDate: false, endYear: now.year, endMonthId: now.monthId, endDayOfMonth: now.dayOfMonth, endHour: clamp(now.hour + 1, 0, 23), endMinute: now.minute
  };
};

export const EventForm = ({ project, mode, initialEvent, onSubmit, onCancel }: { project: CalendarProject; mode: "create"|"edit"; initialEvent?: CalendarEvent; onSubmit: (event: CalendarEvent)=>void; onCancel?: ()=>void; }) => {
  const sortedMonths = useMemo(() => [...project.calendarSystem.months].sort((a, b) => a.order - b.order), [project.calendarSystem.months]);
  const [form, setForm] = useState<EventFormValue>(toFormValue(project, initialEvent));
  const [nameError, setNameError] = useState<string | null>(null);
  const [endError, setEndError] = useState<string | null>(null);
  const updateForm = <K extends keyof EventFormValue>(key: K, value: EventFormValue[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    const name = form.name.trim();
    if (!name) return setNameError(t(project.locale, "events.nameRequired"));
    const month = getMonthById(project.calendarSystem, form.monthId);
    const startDate: CalendarDate = { year: form.year, monthId: form.monthId, dayOfMonth: clamp(form.dayOfMonth, 1, month?.days ?? 1), hour: clamp(form.hour, 0, 23), minute: clamp(form.minute, 0, 59) };
    let endDate: CalendarDate | undefined;
    if (form.hasEndDate) {
      const endMonth = getMonthById(project.calendarSystem, form.endMonthId);
      const safeEnd: CalendarDate = { year: form.endYear, monthId: form.endMonthId, dayOfMonth: clamp(form.endDayOfMonth, 1, endMonth?.days ?? 1), hour: clamp(form.endHour, 0, 23), minute: clamp(form.endMinute, 0, 59) };
      endDate = normalizeEventDateRange(project, startDate, safeEnd);
      setEndError(endDate && compareCalendarDates(endDate, safeEnd, project) !== 0 ? t(project.locale, "events.endBeforeStart") : null);
    } else setEndError(null);

    const recurrence = form.recurrenceType === "none"
      ? ({ type: "none" } as const)
      : ({ type: form.recurrenceType, interval: Math.max(1, form.recurrenceInterval) } as const);

    if (mode === "edit" && initialEvent) {
      onSubmit({
        ...initialEvent,
        name,
        icon: form.icon.trim() || undefined,
        summary: form.summary,
        date: startDate,
        endDate,
        visibility: form.visibility,
        allDay: form.allDay,
        recurrence
      });
      setNameError(null);
      return;
    }
    
    const base = createCalendarEvent({ name, date: startDate, icon: form.icon.trim() || undefined, allDay: form.allDay, endDate });
    onSubmit({ ...base, summary: form.summary, visibility: form.visibility, allDay: form.allDay, endDate, recurrence });
    setForm(toFormValue(project));
    setNameError(null);
  };

  return <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
    <div style={{ fontWeight: 700, marginBottom: 6 }}>{mode === "create" ? t(project.locale, "events.createTitle") : t(project.locale, "events.editTitle")}</div>
    <label>{t(project.locale, "events.name")}</label><input value={form.name} onChange={(e)=>updateForm("name", e.target.value)} style={inputStyle}/>{nameError ? <div style={{ color: "#fca5a5", fontSize: 12 }}>{nameError}</div>:null}
    <label>{t(project.locale, "events.icon")}</label><input value={form.icon} onChange={(e)=>updateForm("icon", e.target.value)} style={inputStyle}/>
    <label>{t(project.locale, "events.summary")}</label><input value={form.summary} onChange={(e)=>updateForm("summary", e.target.value)} style={inputStyle}/>
    <label style={{ display: "flex", gap: 6 }}><input type="checkbox" checked={form.allDay} onChange={(e)=>updateForm("allDay", e.target.checked)}/>{t(project.locale, "events.allDay")}</label>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
      <div><label>{t(project.locale, "events.recurrence")}</label>
        <select value={form.recurrenceType} onChange={(e)=>updateForm("recurrenceType", e.target.value as EventFormValue["recurrenceType"])} style={inputStyle}>
          <option value="none">{t(project.locale, "events.recurrenceNone")}</option>
          <option value="everyXDays">{t(project.locale, "events.recurrenceEveryXDays")}</option>
          <option value="everyXMonths">{t(project.locale, "events.recurrenceEveryXMonths")}</option>
          <option value="yearly">{t(project.locale, "events.recurrenceYearly")}</option>
        </select>
      </div>
      {form.recurrenceType !== "none" ? <div><label>{t(project.locale, "events.recurrenceInterval")}</label>
        <input type="number" min={1} value={form.recurrenceInterval} onChange={(e)=>updateForm("recurrenceInterval", Math.max(1, Number(e.target.value) || 1))} style={inputStyle} />
      </div> : null}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
      <div><label>{t(project.locale, "events.year")}</label><input type="number" value={form.year} onChange={(e)=>updateForm("year", Number(e.target.value))} style={inputStyle}/></div>
      <div><label>{t(project.locale, "events.month")}</label><select value={form.monthId} onChange={(e)=>updateForm("monthId", e.target.value)} style={inputStyle}>{sortedMonths.map((m)=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
      <div><label>{t(project.locale, "events.day")}</label><input type="number" value={form.dayOfMonth} onChange={(e)=>updateForm("dayOfMonth", Number(e.target.value))} style={inputStyle}/></div>
      {!form.allDay ? <><div><label>{t(project.locale, "events.hour")}</label><input type="number" min={0} max={23} value={form.hour} onChange={(e)=>updateForm("hour", Number(e.target.value))} style={inputStyle}/></div><div><label>{t(project.locale, "events.minute")}</label><input type="number" min={0} max={59} value={form.minute} onChange={(e)=>updateForm("minute", Number(e.target.value))} style={inputStyle}/></div></> : null}
      <div><label>{t(project.locale, "events.visibility")}</label><select value={form.visibility} onChange={(e)=>updateForm("visibility", e.target.value as CalendarEvent["visibility"])} style={inputStyle}><option value="gm">{t(project.locale, "events.visibilityGm")}</option><option value="players">{t(project.locale, "events.visibilityPlayers")}</option><option value="revealOnTrigger">{t(project.locale, "events.visibilityRevealOnTrigger")}</option></select></div>
    </div>
    <label style={{ display: "flex", gap: 6 }}><input type="checkbox" checked={form.hasEndDate} onChange={(e)=>updateForm("hasEndDate", e.target.checked)}/>{t(project.locale, "events.addEndDate")}</label>
    {form.hasEndDate ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
      <div><label>{t(project.locale, "events.endYear")}</label><input type="number" value={form.endYear} onChange={(e)=>updateForm("endYear", Number(e.target.value))} style={inputStyle}/></div>
      <div><label>{t(project.locale, "events.endMonth")}</label><select value={form.endMonthId} onChange={(e)=>updateForm("endMonthId", e.target.value)} style={inputStyle}>{sortedMonths.map((m)=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
      <div><label>{t(project.locale, "events.endDay")}</label><input type="number" value={form.endDayOfMonth} onChange={(e)=>updateForm("endDayOfMonth", Number(e.target.value))} style={inputStyle}/></div>
      {!form.allDay ? <><div><label>{t(project.locale, "events.endHour")}</label><input type="number" min={0} max={23} value={form.endHour} onChange={(e)=>updateForm("endHour", Number(e.target.value))} style={inputStyle}/></div><div><label>{t(project.locale, "events.endMinute")}</label><input type="number" min={0} max={59} value={form.endMinute} onChange={(e)=>updateForm("endMinute", Number(e.target.value))} style={inputStyle}/></div></> : null}
    </div> : null}
    {endError ? <div style={{ color: "#fca5a5", fontSize: 12 }}>{endError}</div> : null}
    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
      <button type="button" onClick={submit} style={buttonStyle}>{mode === "create" ? t(project.locale, "events.save") : t(project.locale, "events.update")}</button>
      {onCancel ? <button type="button" onClick={onCancel} style={buttonStyle}>{t(project.locale, "events.cancel")}</button> : null}
    </div>
  </div>;
};

const inputStyle = { width: "100%", margin: "4px 0 8px", background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 6, padding: "6px 8px", boxSizing: "border-box" as const };
const buttonStyle = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#f3f4f6", padding: "7px 10px", fontSize: 12 };
