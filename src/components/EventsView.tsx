import { useMemo, useState } from "react";
import { absoluteDayToCalendarDate, getMonthById } from "../calendar/dateEngine";
import { formatEventDateTime, formatEventVisibility } from "../calendar/formatEvent";
import {
  addCalendarEvent,
  compareCalendarDates,
  createCalendarEvent,
  normalizeEventDateRange,
  sortEventsByDate
} from "../calendar/eventsLogic";
import type { CalendarDate, CalendarEvent, CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";
import { EventIcon } from "./EventIcon";

type EventFormState = {
  name: string;
  icon: string;
  summary: string;
  year: number;
  monthId: string;
  dayOfMonth: number;
  hour: number;
  minute: number;
  visibility: CalendarEvent["visibility"];
  allDay: boolean;
  hasEndDate: boolean;
  endYear: number;
  endMonthId: string;
  endDayOfMonth: number;
  endHour: number;
  endMinute: number;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const EventsView = ({ project, onProjectUpdate }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void }) => {
  const events = sortEventsByDate(project.events, project);
  const currentDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  const sortedMonths = useMemo(() => [...project.calendarSystem.months].sort((a, b) => a.order - b.order), [project.calendarSystem.months]);

  const [form, setForm] = useState<EventFormState>({
    name: "",
    icon: "",
    summary: "",
    year: currentDate.year,
    monthId: currentDate.monthId,
    dayOfMonth: currentDate.dayOfMonth,
    hour: currentDate.hour,
    minute: currentDate.minute,
    visibility: "gm",
    allDay: false,
    hasEndDate: false,
    endYear: currentDate.year,
    endMonthId: currentDate.monthId,
    endDayOfMonth: currentDate.dayOfMonth,
    endHour: clamp(currentDate.hour + 1, 0, 23),
    endMinute: currentDate.minute
  });
  const [nameError, setNameError] = useState<string | null>(null);
  const [endError, setEndError] = useState<string | null>(null);

  const updateForm = <K extends keyof EventFormState>(key: K, value: EventFormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleCreate = () => {
    const name = form.name.trim();
    if (!name) {
      setNameError(t(project.locale, "events.nameRequired"));
      return;
    }

    const month = getMonthById(project.calendarSystem, form.monthId);
    const maxDays = month?.days ?? 1;
    const safeDay = clamp(form.dayOfMonth, 1, maxDays);
    const safeHour = clamp(form.hour, 0, 23);
    const safeMinute = clamp(form.minute, 0, 59);

    const startDate: CalendarDate = {
      year: form.year,
      monthId: form.monthId,
      dayOfMonth: safeDay,
      hour: safeHour,
      minute: safeMinute
    };

    let endDate: CalendarDate | undefined;
    if (form.hasEndDate) {
      const endMonth = getMonthById(project.calendarSystem, form.endMonthId);
      const endMaxDays = endMonth?.days ?? 1;
      const safeEndDate: CalendarDate = {
        year: form.endYear,
        monthId: form.endMonthId,
        dayOfMonth: clamp(form.endDayOfMonth, 1, endMaxDays),
        hour: clamp(form.endHour, 0, 23),
        minute: clamp(form.endMinute, 0, 59)
      };
      endDate = normalizeEventDateRange(project, startDate, safeEndDate);
      if (endDate && compareCalendarDates(endDate, safeEndDate, project) !== 0) setEndError(t(project.locale, "events.endBeforeStart"));
      else setEndError(null);
    } else setEndError(null);

    const baseEvent = createCalendarEvent({ name, date: startDate, icon: form.icon.trim() || undefined, allDay: form.allDay, endDate });
    onProjectUpdate(addCalendarEvent(project, { ...baseEvent, summary: form.summary, visibility: form.visibility, allDay: form.allDay, endDate }));

    setNameError(null);
    const resetNow = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
    setForm({
      name: "", icon: "", summary: "", year: resetNow.year, monthId: resetNow.monthId, dayOfMonth: resetNow.dayOfMonth,
      hour: resetNow.hour, minute: resetNow.minute, visibility: "gm", allDay: false, hasEndDate: false,
      endYear: resetNow.year, endMonthId: resetNow.monthId, endDayOfMonth: resetNow.dayOfMonth,
      endHour: clamp(resetNow.hour + 1, 0, 23), endMinute: resetNow.minute
    });
  };
  return (
    <>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>{t(project.locale, "events.title")}</div>
      <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{t(project.locale, "events.create")}</div>
        <label>{t(project.locale, "events.name")}</label>
        <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} style={inputStyle} />
        {nameError ? <div style={{ color: "#fca5a5", fontSize: 12, marginBottom: 6 }}>{nameError}</div> : null}
        <label>{t(project.locale, "events.icon")}</label><input value={form.icon} onChange={(e) => updateForm("icon", e.target.value)} style={inputStyle} />
        <label>{t(project.locale, "events.summary")}</label><input value={form.summary} onChange={(e) => updateForm("summary", e.target.value)} style={inputStyle} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><input type="checkbox" checked={form.allDay} onChange={(e) => updateForm("allDay", e.target.checked)} />{t(project.locale, "events.allDay")}</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <div><label>{t(project.locale, "events.year")}</label><input type="number" value={form.year} onChange={(e) => updateForm("year", Number(e.target.value))} style={inputStyle} /></div>
          <div><label>{t(project.locale, "events.month")}</label><select value={form.monthId} onChange={(e) => updateForm("monthId", e.target.value)} style={inputStyle}>{sortedMonths.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          <div><label>{t(project.locale, "events.day")}</label><input type="number" value={form.dayOfMonth} onChange={(e) => updateForm("dayOfMonth", Number(e.target.value))} style={inputStyle} /></div>
          {!form.allDay ? <><div><label>{t(project.locale, "events.hour")}</label><input type="number" min={0} max={23} value={form.hour} onChange={(e) => updateForm("hour", Number(e.target.value))} style={inputStyle} /></div><div><label>{t(project.locale, "events.minute")}</label><input type="number" min={0} max={59} value={form.minute} onChange={(e) => updateForm("minute", Number(e.target.value))} style={inputStyle} /></div></> : null}
          <div><label>{t(project.locale, "events.visibility")}</label><select value={form.visibility} onChange={(e) => updateForm("visibility", e.target.value as CalendarEvent["visibility"])} style={inputStyle}><option value="gm">{t(project.locale, "events.visibilityGm")}</option><option value="players">{t(project.locale, "events.visibilityPlayers")}</option><option value="revealOnTrigger">{t(project.locale, "events.visibilityRevealOnTrigger")}</option></select></div>
        </div>
<label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><input type="checkbox" checked={form.hasEndDate} onChange={(e) => { const checked = e.target.checked; updateForm("hasEndDate", checked); if (checked) { updateForm("endYear", form.year); updateForm("endMonthId", form.monthId); updateForm("endDayOfMonth", form.dayOfMonth); updateForm("endHour", clamp(form.hour + 1, 0, 23)); updateForm("endMinute", form.minute); } }} />{t(project.locale, "events.addEndDate")}</label>
        {form.hasEndDate ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <div><label>{t(project.locale, "events.endYear")}</label><input type="number" value={form.endYear} onChange={(e) => updateForm("endYear", Number(e.target.value))} style={inputStyle} /></div>
          <div><label>{t(project.locale, "events.endMonth")}</label><select value={form.endMonthId} onChange={(e) => updateForm("endMonthId", e.target.value)} style={inputStyle}>{sortedMonths.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          <div><label>{t(project.locale, "events.endDay")}</label><input type="number" value={form.endDayOfMonth} onChange={(e) => updateForm("endDayOfMonth", Number(e.target.value))} style={inputStyle} /></div>
          {!form.allDay ? <><div><label>{t(project.locale, "events.endHour")}</label><input type="number" min={0} max={23} value={form.endHour} onChange={(e) => updateForm("endHour", Number(e.target.value))} style={inputStyle} /></div><div><label>{t(project.locale, "events.endMinute")}</label><input type="number" min={0} max={59} value={form.endMinute} onChange={(e) => updateForm("endMinute", Number(e.target.value))} style={inputStyle} /></div></> : null}
        </div> : null}
        {endError ? <div style={{ color: "#fca5a5", fontSize: 12, marginBottom: 6 }}>{endError}</div> : null}
        <button type="button" onClick={handleCreate} style={{ ...buttonStyle, marginTop: 6 }}>{t(project.locale, "events.save")}</button>
      </div>
      {events.length === 0 ? <div style={{ color: "#9ca3af" }}>{t(project.locale, "events.noEvents")}</div> : <div style={{ display: "grid", gap: 8 }}>
        {events.map((event) => (
          <div key={event.id} style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, overflow: "hidden" }}><EventIcon icon={event.icon} locale={project.locale} /><strong>{event.name}</strong></div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>{formatEventDateTime(project, event)}</div>
            {event.summary ? <div style={{ fontSize: 12, marginBottom: 4, color: "#d1d5db" }}>{event.summary}</div> : null}
            <div style={{ fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "events.visibility")}: {formatEventVisibility(project, event.visibility)}</div>
          </div>
        ))}
      </div>}
    </>
  );
};

const inputStyle = { width: "100%", margin: "4px 0 8px", background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 6, padding: "6px 8px", boxSizing: "border-box" as const };
const buttonStyle = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#f3f4f6", padding: "7px 10px", fontSize: 12 };