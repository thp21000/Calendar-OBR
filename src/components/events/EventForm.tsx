import { useMemo, useState } from "react";
import { absoluteDayToCalendarDate, getMonthById } from "../../calendar/dateEngine";
import { compareCalendarDates, createCalendarEvent, normalizeEventDateRange } from "../../calendar/eventsLogic";
import type { CalendarDate, CalendarEvent, CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { CollapsibleSection } from "../CollapsibleSection";


export type EventFormValue = {
  name: string; icon: string; summary: string; playerDescription: string; gmDescription: string; year: number; monthId: string; dayOfMonth: number; hour: number; minute: number;
  visibility: CalendarEvent["visibility"]; allDay: boolean;
  recurrenceType: CalendarEvent["recurrence"]["type"]; recurrenceInterval: number;
  notifyOnTrigger: boolean; deleteAfterTrigger: boolean; archiveAfterTrigger: boolean;
  reminderEnabled: boolean; reminderMinutesBefore: number;
  hasEndDate: boolean; endYear: number; endMonthId: string; endDayOfMonth: number; endHour: number; endMinute: number;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const normalizeReminderMinutes = (value: unknown): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 60;
  const int = Math.trunc(n);
  return int > 0 ? int : 60;
};

const toFormValue = (project: CalendarProject, event?: CalendarEvent, initialDate?: CalendarDate): EventFormValue => {
  if (event) {
    return {
      name: event.name,
      icon: event.icon ?? "",
      summary: event.summary,
      playerDescription: event.playerDescription ?? "",
      gmDescription: event.gmDescription ?? "",
      year: event.date.year,
      monthId: event.date.monthId,
      dayOfMonth: event.date.dayOfMonth,
      hour: event.date.hour,
      minute: event.date.minute,
      visibility: event.visibility,
      allDay: event.allDay === true,
      recurrenceType: event.recurrence.type,
      recurrenceInterval: event.recurrence.type === "none" ? 1 : Math.max(1, event.recurrence.interval),
      notifyOnTrigger: event.notifyOnTrigger,
      deleteAfterTrigger: event.deleteAfterTrigger,
      archiveAfterTrigger: event.archiveAfterTrigger,
      reminderEnabled: event.reminderEnabled === true,
      reminderMinutesBefore: normalizeReminderMinutes(event.reminderMinutesBefore),
      hasEndDate: Boolean(event.endDate),
      endYear: event.endDate?.year ?? event.date.year,
      endMonthId: event.endDate?.monthId ?? event.date.monthId,
      endDayOfMonth: event.endDate?.dayOfMonth ?? event.date.dayOfMonth,
      endHour: event.endDate?.hour ?? clamp(event.date.hour + 1, 0, 23),
      endMinute: event.endDate?.minute ?? event.date.minute
    };
  }
  const now = initialDate
    ? { ...initialDate, hour: 0, minute: 0 }
    : absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  return {
    name: "", icon: "", summary: "", playerDescription: "", gmDescription: "", year: now.year, monthId: now.monthId, dayOfMonth: now.dayOfMonth, hour: now.hour, minute: now.minute,
    visibility: "gm", allDay: false, recurrenceType: "none", recurrenceInterval: 1,
    notifyOnTrigger: true, deleteAfterTrigger: false, archiveAfterTrigger: false,
    reminderEnabled: false, reminderMinutesBefore: 60,
    hasEndDate: false, endYear: now.year, endMonthId: now.monthId, endDayOfMonth: now.dayOfMonth, endHour: clamp(now.hour + 1, 0, 23), endMinute: now.minute
  };
};

export const EventForm = ({ project, mode, initialEvent, initialDate, onSubmit, onCancel, hideTitle = false, frameless = false, compactCreatePopup = false }: { project: CalendarProject; mode: "create"|"edit"; initialEvent?: CalendarEvent; initialDate?: CalendarDate; onSubmit: (event: CalendarEvent)=>void; onCancel?: ()=>void; hideTitle?: boolean; frameless?: boolean; compactCreatePopup?: boolean; }) => {
  const sortedMonths = useMemo(() => [...project.calendarSystem.months].sort((a, b) => a.order - b.order), [project.calendarSystem.months]);
  const [form, setForm] = useState<EventFormValue>(toFormValue(project, initialEvent, initialDate));
  const [nameError, setNameError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [endError, setEndError] = useState<string | null>(null);
  const updateForm = <K extends keyof EventFormValue>(key: K, value: EventFormValue[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    const name = form.name.trim();
    if (!name) {
      setNameError(t(project.locale, "events.nameRequired"));
      if (compactCreatePopup) setGlobalError(t(project.locale, "events.createMissingRequiredFields"));
      return;
    }
    const month = getMonthById(project.calendarSystem, form.monthId);
    const startDate: CalendarDate = {
      year: form.year,
      monthId: form.monthId,
      dayOfMonth: clamp(form.dayOfMonth, 1, month?.days ?? 1),
      hour: form.allDay ? 0 : clamp(form.hour, 0, 23),
      minute: form.allDay ? 0 : clamp(form.minute, 0, 59)
    };
    let endDate: CalendarDate | undefined;
    if (form.hasEndDate || (compactCreatePopup && mode === "create")) {
      const endMonth = getMonthById(project.calendarSystem, form.endMonthId);
      const safeEnd: CalendarDate = {
        year: form.endYear,
        monthId: form.endMonthId,
        dayOfMonth: clamp(form.endDayOfMonth, 1, endMonth?.days ?? 1),
        hour: form.allDay ? 0 : clamp(form.endHour, 0, 23),
        minute: form.allDay ? 0 : clamp(form.endMinute, 0, 59)
      };
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
        playerDescription: form.playerDescription.trim() || undefined,
        gmDescription: form.gmDescription.trim() || undefined,
        date: startDate,
        endDate,
        visibility: form.visibility,
        allDay: form.allDay,
        recurrence,
        notifyOnTrigger: form.notifyOnTrigger,
        deleteAfterTrigger: form.deleteAfterTrigger,
        archiveAfterTrigger: form.archiveAfterTrigger,
        reminderEnabled: form.reminderEnabled,
        reminderMinutesBefore: normalizeReminderMinutes(form.reminderMinutesBefore)
      });
      setNameError(null);
      setGlobalError(null);
      return;
    }
    
    const base = createCalendarEvent({ name, date: startDate, icon: form.icon.trim() || undefined, allDay: form.allDay, endDate });
    onSubmit({ ...base, summary: form.summary, playerDescription: form.playerDescription.trim() || undefined, gmDescription: form.gmDescription.trim() || undefined, visibility: form.visibility, allDay: form.allDay, endDate, recurrence,
      notifyOnTrigger: form.notifyOnTrigger,
      deleteAfterTrigger: form.deleteAfterTrigger,
      archiveAfterTrigger: form.archiveAfterTrigger,
      reminderEnabled: form.reminderEnabled,
      reminderMinutesBefore: normalizeReminderMinutes(form.reminderMinutesBefore)
    });
    setForm(toFormValue(project, undefined, initialDate));
    setNameError(null);
    setGlobalError(null);
  };

  const showCompactEndInDateSection = compactCreatePopup && mode === "create";
  return <div style={frameless ? undefined : { border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
    {globalError ? <div style={{ color: "#fca5a5", fontSize: 12, marginBottom: 8 }}>{globalError}</div> : null}
    {!hideTitle ? <div style={{ fontWeight: 700, marginBottom: 6 }}>{mode === "create" ? t(project.locale, "events.createTitle") : t(project.locale, "events.editTitle")}</div> : null}
    <CollapsibleSection title={t(project.locale, "events.sectionGeneral")} defaultOpen={!compactCreatePopup}>
      <label>{t(project.locale, "events.name")} <span title={t(project.locale, "events.help.name")}>ⓘ</span></label><input value={form.name} onChange={(e)=>updateForm("name", e.target.value)} style={inputStyle}/>{nameError ? <div style={{ color: "#fca5a5", fontSize: 12 }}>{nameError}</div>:null}
      <label>{t(project.locale, "events.icon")} <span title={t(project.locale, "events.help.icon")}>ⓘ</span></label><input value={form.icon} onChange={(e)=>updateForm("icon", e.target.value)} style={inputStyle}/>
      <label>{t(project.locale, "events.summary")} <span title={t(project.locale, "events.help.summary")}>ⓘ</span></label><input value={form.summary} onChange={(e)=>updateForm("summary", e.target.value)} style={inputStyle}/>
      <label>{t(project.locale, "events.playerDescription")} <span title={t(project.locale, "events.help.playerDescription")}>ⓘ</span></label><textarea value={form.playerDescription} onChange={(e)=>updateForm("playerDescription", e.target.value)} rows={2} style={inputStyle}/>
      <label>{t(project.locale, "events.gmDescription")} <span title={t(project.locale, "events.help.gmDescription")}>ⓘ</span></label><textarea value={form.gmDescription} onChange={(e)=>updateForm("gmDescription", e.target.value)} rows={2} style={inputStyle}/>
      <div><label>{t(project.locale, "events.visibility")} <span title={t(project.locale, "events.help.visibility")}>ⓘ</span></label><select value={form.visibility} onChange={(e)=>updateForm("visibility", e.target.value as CalendarEvent["visibility"])} style={inputStyle}><option value="gm">{t(project.locale, "events.visibilityGm")}</option><option value="players">{t(project.locale, "events.visibilityPlayers")}</option><option value="revealOnTrigger">{t(project.locale, "events.visibilityRevealOnTrigger")}</option></select></div>
    </CollapsibleSection>
    <CollapsibleSection title={t(project.locale, "events.sectionDateTime")} defaultOpen={!compactCreatePopup}>
      <label style={{ display: "flex", gap: 6 }}><input type="checkbox" checked={form.allDay} onChange={(e)=>updateForm("allDay", e.target.checked)}/>{t(project.locale, "events.allDay")} <span title={t(project.locale, "events.help.allDay")}>ⓘ</span></label>
      {showCompactEndInDateSection ? <>
        <div style={dateTimeGroupStyle}>
          <div style={dateTimeGroupTitleStyle}>{t(project.locale, "events.startDateTime")}</div>
          <div style={compactFieldTitleStyle}>{t(project.locale, "events.date")}</div>
          <div style={compactDateLineStyle}>
            <input type="number" aria-label={t(project.locale, "events.day")} value={form.dayOfMonth} onChange={(e)=>updateForm("dayOfMonth", Number(e.target.value))} style={compactNumberInputStyle}/>
            <select aria-label={t(project.locale, "events.month")} value={form.monthId} onChange={(e)=>updateForm("monthId", e.target.value)} style={inputStyle}>{sortedMonths.map((m)=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
            <input type="number" aria-label={t(project.locale, "events.year")} value={form.year} onChange={(e)=>updateForm("year", Number(e.target.value))} style={compactNumberInputStyle}/>
          </div>
          {!form.allDay ? <>
            <div style={compactFieldTitleStyle}>{t(project.locale, "events.hour")}</div>
            <div style={compactTimeLineStyle}>
              <input type="number" min={0} max={23} aria-label={t(project.locale, "events.hour")} value={form.hour} onChange={(e)=>updateForm("hour", Number(e.target.value))} style={compactTimeInputStyle}/>
              <span>h</span>
              <input type="number" min={0} max={59} aria-label={t(project.locale, "events.minute")} value={form.minute} onChange={(e)=>updateForm("minute", Number(e.target.value))} style={compactTimeInputStyle}/>
            </div>
          </> : null}
        </div>

        <div style={dateTimeGroupStyle}>
          <div style={dateTimeGroupTitleStyle}>{t(project.locale, "events.endDateTime")}</div>
          <div style={compactFieldTitleStyle}>{t(project.locale, "events.date")}</div>
          <div style={compactDateLineStyle}>
            <input type="number" aria-label={t(project.locale, "events.endDay")} value={form.endDayOfMonth} onChange={(e)=>updateForm("endDayOfMonth", Number(e.target.value))} style={compactNumberInputStyle}/>
            <select aria-label={t(project.locale, "events.endMonth")} value={form.endMonthId} onChange={(e)=>updateForm("endMonthId", e.target.value)} style={inputStyle}>{sortedMonths.map((m)=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
            <input type="number" aria-label={t(project.locale, "events.endYear")} value={form.endYear} onChange={(e)=>updateForm("endYear", Number(e.target.value))} style={compactNumberInputStyle}/>
          </div>
          {!form.allDay ? <>
            <div style={compactFieldTitleStyle}>{t(project.locale, "events.hour")}</div>
            <div style={compactTimeLineStyle}>
              <input type="number" min={0} max={23} aria-label={t(project.locale, "events.endHour")} value={form.endHour} onChange={(e)=>updateForm("endHour", Number(e.target.value))} style={compactTimeInputStyle}/>
              <span>h</span>
              <input type="number" min={0} max={59} aria-label={t(project.locale, "events.endMinute")} value={form.endMinute} onChange={(e)=>updateForm("endMinute", Number(e.target.value))} style={compactTimeInputStyle}/>
            </div>
          </> : null}
        </div>
      </> : <>
        <div style={{ fontSize: 12, marginTop: 6, marginBottom: 2 }}>{t(project.locale, "events.sectionDateTime")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <div><label>{t(project.locale, "events.year")}</label><input type="number" value={form.year} onChange={(e)=>updateForm("year", Number(e.target.value))} style={inputStyle}/></div>
          <div><label>{t(project.locale, "events.month")}</label><select value={form.monthId} onChange={(e)=>updateForm("monthId", e.target.value)} style={inputStyle}>{sortedMonths.map((m)=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          <div><label>{t(project.locale, "events.day")}</label><input type="number" value={form.dayOfMonth} onChange={(e)=>updateForm("dayOfMonth", Number(e.target.value))} style={inputStyle}/></div>
          {!form.allDay ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, gridColumn: "1 / -1" }}><div><label>{t(project.locale, "events.hour")}</label><input type="number" min={0} max={23} value={form.hour} onChange={(e)=>updateForm("hour", Number(e.target.value))} style={inputStyle}/></div><div><label>{t(project.locale, "events.minute")}</label><input type="number" min={0} max={59} value={form.minute} onChange={(e)=>updateForm("minute", Number(e.target.value))} style={inputStyle}/></div></div> : null}
        </div>
      </>}
      {showCompactEndInDateSection && endError ? <div style={{ color: "#fca5a5", fontSize: 12 }}>{endError}</div> : null}
    </CollapsibleSection>
    {!showCompactEndInDateSection ? <CollapsibleSection title={t(project.locale, "events.sectionEnd")} defaultOpen={Boolean(initialEvent?.endDate)}>
      <label style={{ display: "flex", gap: 6 }}><input type="checkbox" checked={form.hasEndDate} onChange={(e)=>updateForm("hasEndDate", e.target.checked)}/>{t(project.locale, "events.addEndDate")}</label>
      {form.hasEndDate ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <div><label>{t(project.locale, "events.endYear")}</label><input type="number" value={form.endYear} onChange={(e)=>updateForm("endYear", Number(e.target.value))} style={inputStyle}/></div>
        <div><label>{t(project.locale, "events.endMonth")}</label><select value={form.endMonthId} onChange={(e)=>updateForm("endMonthId", e.target.value)} style={inputStyle}>{sortedMonths.map((m)=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
        <div><label>{t(project.locale, "events.endDay")}</label><input type="number" value={form.endDayOfMonth} onChange={(e)=>updateForm("endDayOfMonth", Number(e.target.value))} style={inputStyle}/></div>
        {!form.allDay ? <><div><label>{t(project.locale, "events.endHour")}</label><input type="number" min={0} max={23} value={form.endHour} onChange={(e)=>updateForm("endHour", Number(e.target.value))} style={inputStyle}/></div><div><label>{t(project.locale, "events.endMinute")}</label><input type="number" min={0} max={59} value={form.endMinute} onChange={(e)=>updateForm("endMinute", Number(e.target.value))} style={inputStyle}/></div></> : null}
      </div> : null}
    {endError ? <div style={{ color: "#fca5a5", fontSize: 12 }}>{endError}</div> : null}
    </CollapsibleSection> : null}
    <CollapsibleSection title={t(project.locale, "events.sectionRecurrence")} defaultOpen={mode === "edit" && initialEvent?.recurrence.type !== "none"}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <div><label>{t(project.locale, "events.recurrence")} <span title={t(project.locale, "events.help.recurrence")}>ⓘ</span></label>
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
    </CollapsibleSection>
    <CollapsibleSection title={t(project.locale, "events.sectionTrigger")} defaultOpen={false}>
      <label style={{ display: "flex", gap: 6, fontSize: 12 }}><input type="checkbox" checked={form.notifyOnTrigger} onChange={(e)=>updateForm("notifyOnTrigger", e.target.checked)}/>{t(project.locale, "events.notifyOnTrigger")} <span title={t(project.locale, "events.help.notifyOnTrigger")}>ⓘ</span></label>
      <label style={{ display: "flex", gap: 6, fontSize: 12 }}><input type="checkbox" checked={form.archiveAfterTrigger} onChange={(e)=>updateForm("archiveAfterTrigger", e.target.checked)}/>{t(project.locale, "events.archiveAfterTrigger")} <span title={t(project.locale, "events.help.archiveAfterTrigger")}>ⓘ</span></label>
      <label style={{ display: "flex", gap: 6, fontSize: 12 }}><input type="checkbox" checked={form.archiveAfterTrigger} onChange={(e)=>updateForm("archiveAfterTrigger", e.target.checked)}/>{t(project.locale, "events.archiveAfterTrigger")}</label>
    </CollapsibleSection>
    <CollapsibleSection title={t(project.locale, "events.reminderSection")} defaultOpen={false}>
      <label style={{ display: "flex", gap: 6, fontSize: 12 }}><input type="checkbox" checked={form.reminderEnabled} onChange={(e)=>updateForm("reminderEnabled", e.target.checked)}/>{t(project.locale, "events.reminderEnabled")}</label>
      <label>{t(project.locale, "events.reminderMinutesBefore")}</label>
      <input type="number" min={1} value={form.reminderMinutesBefore} onChange={(e)=>updateForm("reminderMinutesBefore", normalizeReminderMinutes(e.target.value))} style={inputStyle}/>
      <div style={{ color: "#9ca3af", fontSize: 12 }}>{t(project.locale, "events.reminderMinutesBeforeHelp")}</div>
    </CollapsibleSection>
    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
      <button type="button" onClick={submit} style={buttonStyle}>{mode === "create" ? t(project.locale, "events.save") : t(project.locale, "events.update")}</button>
      {onCancel ? <button type="button" onClick={onCancel} style={buttonStyle}>{t(project.locale, "events.cancel")}</button> : null}
    </div>
  </div>;
};

const inputStyle = { width: "100%", margin: "4px 0 8px", background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 6, padding: "6px 8px", boxSizing: "border-box" as const };
const buttonStyle = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#f3f4f6", padding: "7px 10px", fontSize: 12 };

const compactDateLineStyle = {
  display: "grid",
  gridTemplateColumns: "56px minmax(120px, 1fr) 72px",
  gap: 6,
  alignItems: "center" as const
};

const compactTimeLineStyle = {
  display: "flex",
  alignItems: "center" as const,
  gap: 4
};

const dateTimeGroupStyle = {
  border: "1px solid #1f2937",
  borderRadius: 8,
  padding: 8,
  marginTop: 8,
  background: "#0b1220"
};

const dateTimeGroupTitleStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: "#e5e7eb",
  marginBottom: 6
};

const compactFieldTitleStyle = {
  fontSize: 11,
  color: "#cbd5e1",
  margin: "6px 0 3px"
};

const compactNumberInputStyle = { ...inputStyle, width: "100%", margin: 0 };
const compactTimeInputStyle = { ...inputStyle, width: 56, margin: 0 };