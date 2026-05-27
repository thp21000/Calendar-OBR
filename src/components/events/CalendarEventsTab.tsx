import { useEffect, useState } from "react";
import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import { addCalendarEvent, deleteCalendarEvent, duplicateCalendarEvent, getEventTimeBucket, revealCalendarEvent, sortEventsByDate, updateCalendarEvent } from "../../calendar/eventsLogic";
import { formatEventDateTime, formatEventRecurrence, formatEventStatus, formatEventTriggerOptions, formatEventVisibility } from "../../calendar/formatEvent";
import type { CalendarDate, CalendarEvent, CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";
import { Badge, EmptyState, PrimaryButton, SecondaryButton, SectionCard, SectionHeader } from "../ui";
import { EventCreatePopup } from "./EventCreatePopup";
import { EventForm } from "./EventForm";

export const CalendarEventsTab = ({ project, onProjectUpdate, initialCreateDate, initialEditEventId, onInitialCreateDateConsumed, onInitialEditEventIdConsumed }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; initialCreateDate?: CalendarDate | null; initialEditEventId?: string | null; onInitialCreateDateConsumed?: () => void; onInitialEditEventIdConsumed?: () => void; }) => {
  const events = sortEventsByDate(project.events, project);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"active" | "triggered" | "archived" | "disabled" | "all">("active");
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(Boolean(initialCreateDate));
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<"all" | "past" | "today" | "future">("all");

  useEffect(() => {
    if (initialCreateDate) setIsCreateFormOpen(true);
  }, [initialCreateDate]);

  useEffect(() => {
    if (!initialEditEventId) return;
    setStatusFilter("all");
    setTimeFilter("all");
    setSearchQuery("");
    setIsCreateFormOpen(false);
    setEditingEventId(initialEditEventId);
    onInitialEditEventIdConsumed?.();
  }, [initialEditEventId, onInitialEditEventIdConsumed]);

  const filteredByStatus = events.filter((event) => (statusFilter === "all" ? true : event.status === statusFilter));
  const filteredByTime = filteredByStatus.filter((event) => (timeFilter === "all" ? true : getEventTimeBucket(project, event) === timeFilter));
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredEvents = filteredByTime.filter((event) => {
    if (!normalizedQuery) return true;
    const iconText = event.icon && !/^https?:\/\//i.test(event.icon) ? event.icon : "";
    const haystack = `${event.name ?? ""} ${event.summary ?? ""} ${iconText}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const handleCreate = (event: CalendarEvent) => {
    onProjectUpdate(addCalendarEvent(project, event));
    setIsCreateFormOpen(false);
    onInitialCreateDateConsumed?.();
  };
  const handleUpdate = (event: CalendarEvent) => {
    onProjectUpdate(updateCalendarEvent(project, event.id, event));
    setEditingEventId(null);
  };
  const handleDelete = (event: CalendarEvent) => {
    if (!window.confirm(t(project.locale, "events.confirmDelete"))) return;
    onProjectUpdate(deleteCalendarEvent(project, event.id));
    if (editingEventId === event.id) setEditingEventId(null);
  };
  const handleStatusUpdate = (event: CalendarEvent, status: CalendarEvent["status"]) => onProjectUpdate(updateCalendarEvent(project, event.id, { status }));
  const handleDuplicate = (event: CalendarEvent) => onProjectUpdate(duplicateCalendarEvent(project, event.id));
  const handleReveal = (event: CalendarEvent) => onProjectUpdate(revealCalendarEvent(project, event.id));

  return <>
    <SectionCard>
      <PrimaryButton type="button" onClick={() => setIsCreateFormOpen(true)} style={{ marginBottom: 8 }}>
        {t(project.locale, "events.openCreateForm")}
      </PrimaryButton>
      <div style={{ marginBottom: 8 }}>
        <label style={label}>{t(project.locale, "events.search")}</label>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t(project.locale, "events.searchPlaceholder")} style={inputStyle} />
          {searchQuery.trim() ? <SecondaryButton type="button" onClick={() => setSearchQuery("")}>{t(project.locale, "events.clearSearch")}</SecondaryButton> : null}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8 }}>
        <div>
          <label style={label}>{t(project.locale, "events.timeFilter")}</label>
          <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value as "all" | "past" | "today" | "future")} style={inputStyle}>
            <option value="all">{t(project.locale, "events.timeFilterAll")}</option><option value="past">{t(project.locale, "events.timeFilterPast")}</option><option value="today">{t(project.locale, "events.timeFilterToday")}</option><option value="future">{t(project.locale, "events.timeFilterFuture")}</option>
          </select>
        </div>
        <div>
          <label style={label}>{t(project.locale, "events.filter")}</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "active" | "triggered" | "archived" | "disabled" | "all")} style={inputStyle}>
            <option value="active">{t(project.locale, "events.filterActive")}</option><option value="triggered">{t(project.locale, "events.filterTriggered")}</option><option value="archived">{t(project.locale, "events.filterArchived")}</option><option value="disabled">{t(project.locale, "events.filterDisabled")}</option><option value="all">{t(project.locale, "events.filterAll")}</option>
          </select>
        </div>
      </div>
    </SectionCard>
    <SectionCard>
      <SectionHeader title={`${t(project.locale, "events.calendarListTitle")} (${filteredEvents.length})`} />
    {filteredEvents.length === 0 ? <EmptyState text={normalizedQuery ? t(project.locale, "events.noEventsForSearch") : t(project.locale, "events.noEventsForFilter")} /> : <div style={{ display: "grid", gap: 8 }}>
      {filteredEvents.map((event) => <div key={event.id} style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827" }}>
        {editingEventId === event.id ? <EventForm project={project} mode="edit" initialEvent={event} onSubmit={handleUpdate} onCancel={() => setEditingEventId(null)} /> : <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}><EventIcon icon={event.icon} locale={project.locale} /><strong>{event.name}</strong></div>
            <div style={{ fontSize: 11, color: "#cbd5e1", textAlign: "right" }}>{formatEventDateTime(project, event)}</div>
          </div>
          {event.summary ? <div style={{ fontSize: 12, marginBottom: 4, color: "#d1d5db" }}>{event.summary}</div> : null}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
            <Badge>{formatEventStatus(project, event)}</Badge>
            <Badge>{formatEventVisibility(project, event.visibility)}</Badge>
            {formatEventRecurrence(project, event) !== t(project.locale, "events.recurrenceNone") ? <Badge>{formatEventRecurrence(project, event)}</Badge> : null}
            {formatEventTriggerOptions(project, event) !== t(project.locale, "events.triggerNone") ? <Badge>{formatEventTriggerOptions(project, event)}</Badge> : null}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <SecondaryButton type="button" onClick={() => setEditingEventId(event.id)}>{t(project.locale, "events.edit")}</SecondaryButton>
            <SecondaryButton type="button" onClick={() => handleDuplicate(event)}>{t(project.locale, "events.duplicate")}</SecondaryButton>
            {event.visibility === "revealOnTrigger" && event.status !== "triggered" && event.status !== "archived" && event.status !== "disabled" ? <SecondaryButton type="button" onClick={() => handleReveal(event)}>{t(project.locale, "events.reveal")}</SecondaryButton> : null}
            {event.status === "active" ? <><SecondaryButton type="button" onClick={() => handleStatusUpdate(event, "disabled")}>{t(project.locale, "events.disable")}</SecondaryButton><SecondaryButton type="button" onClick={() => handleStatusUpdate(event, "archived")}>{t(project.locale, "events.archive")}</SecondaryButton></> : null}
            {event.status === "triggered" ? <><SecondaryButton type="button" onClick={() => handleStatusUpdate(event, "active")}>{t(project.locale, "events.reactivate")}</SecondaryButton><SecondaryButton type="button" onClick={() => handleStatusUpdate(event, "archived")}>{t(project.locale, "events.archive")}</SecondaryButton></> : null}
            {event.status === "archived" ? <SecondaryButton type="button" onClick={() => handleStatusUpdate(event, "active")}>{t(project.locale, "events.reactivate")}</SecondaryButton> : null}
            {event.status === "disabled" ? <><SecondaryButton type="button" onClick={() => handleStatusUpdate(event, "active")}>{t(project.locale, "events.reactivate")}</SecondaryButton><SecondaryButton type="button" onClick={() => handleStatusUpdate(event, "archived")}>{t(project.locale, "events.archive")}</SecondaryButton></> : null}
            <SecondaryButton type="button" onClick={() => handleDelete(event)}>{t(project.locale, "events.delete")}</SecondaryButton>
          </div>
        </>}
      </div>)}
    </div>}
    </SectionCard>
    {isCreateFormOpen ? <EventCreatePopup project={project} date={initialCreateDate ?? absoluteDayToCalendarDate(project.currentTime, project.calendarSystem)} onClose={() => { setIsCreateFormOpen(false); onInitialCreateDateConsumed?.(); }} onCreate={handleCreate} /> : null}
  </>;
};

const inputStyle = { width: "100%", background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 6, padding: "6px 8px", fontSize: 12, boxSizing: "border-box" as const };
const label = { display: "block", fontSize: 12, marginBottom: 4 };