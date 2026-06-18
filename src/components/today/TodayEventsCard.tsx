import { formatEventTimeShort, formatEventVisibility } from "../../calendar/formatEvent";
import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EventIcon } from "../EventIcon";
import { Badge, EmptyState, SectionCard, SectionHeader } from "../ui";
import { ui } from "../ui/styles";
import type { PublicEventDetails } from "../player/PublicEventDetailsPopup";

export const TodayEventsCard = ({ project, eventsToday, moonEventsToday = [], hiddenMoonEvents = [], hiddenMoonEventReasons = {}, onSelectEvent, onSelectMoonEvent, mode = "gm", events, moonEvents, weatherEvents, dayNotes, onSelectPublicEvent }: { project: CalendarProject; eventsToday: CalendarProject["events"]; moonEventsToday?: NonNullable<CalendarProject["moonEvents"]>; hiddenMoonEvents?: NonNullable<CalendarProject["moonEvents"]>; hiddenMoonEventReasons?: Record<string, string>; onSelectEvent?: (eventId: string) => void; onSelectMoonEvent?: (eventId: string) => void; mode?: "gm" | "player"; readonly?: boolean; events?: PublicEventDetails[]; moonEvents?: PublicEventDetails[]; weatherEvents?: PublicEventDetails[]; dayNotes?: Array<{ id: string; playerNote: string }>; onSelectPublicEvent?: (event: PublicEventDetails) => void }) => {
  const rows = mode === "player"
    ? [
      ...(events ?? []).map((event) => <PublicEventRow key={`event-${event.id}`} project={project} event={event} background="#111827" onSelectPublicEvent={onSelectPublicEvent} />),
      ...(weatherEvents ?? []).map((event) => <PublicEventRow key={`weather-${event.id}`} project={project} event={event} background="#0f172a" onSelectPublicEvent={onSelectPublicEvent} />),
      ...(moonEvents ?? []).map((event) => <PublicEventRow key={`moon-${event.id}`} project={project} event={event} background="#0f172a" onSelectPublicEvent={onSelectPublicEvent} />),
      ...(dayNotes ?? []).filter((note) => note.playerNote?.trim()).map((note) => <div key={`note-${note.id}`} style={{ border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#0f172a", fontSize: 12, color: "#e5e7eb", whiteSpace: "pre-wrap" }}>📝 {note.playerNote}</div>)
    ]
    : [
      ...eventsToday.map((event) => <button key={`event-${event.id}`} type="button" onClick={onSelectEvent ? () => onSelectEvent(event.id) : undefined} style={{ border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#111827", width: "100%", textAlign: "left", cursor: onSelectEvent ? "pointer" : "default" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
          <EventIcon icon={event.icon} locale={project.locale} />
          <strong style={{ color: ui.colors.textPrimary, fontWeight: 800 }}>{event.name}</strong>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#cbd5e1" }}>{formatEventTimeShort(project, event)}</span>
        </div>
        {event.summary ? <div style={{ marginTop: 4, fontSize: 12, color: "#d1d5db" }}>{event.summary}</div> : null}
        <div style={{ marginTop: 4, opacity: 0.86 }}><Badge>{t(project.locale, "events.visibility")}: {formatEventVisibility(project, event.visibility)}</Badge></div>
      </button>),
      ...moonEventsToday.map((event) => <button key={`moon-${event.id}`} type="button" onClick={onSelectMoonEvent ? () => onSelectMoonEvent(event.id) : undefined} style={{ border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#0f172a", width: "100%", textAlign: "left", cursor: onSelectMoonEvent ? "pointer" : "default" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
          <span>{event.icon ?? "🌕"}</span>
          <strong style={{ color: ui.colors.textPrimary, fontWeight: 800 }}>{event.name}</strong>
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: "#cbd5e1" }}>{formatMoonEventMeta(project, event)}</div>
        {event.summary ? <div style={{ marginTop: 4, fontSize: 12, color: "#d1d5db" }}>{event.summary}</div> : null}
        <div style={{ marginTop: 4, opacity: 0.86, display: "flex", gap: 6, flexWrap: "wrap" as const }}>
          <Badge>{t(project.locale, "moonEvents.eventKind")}</Badge>
          <Badge>{t(project.locale, "events.visibility")}: {formatEventVisibility(project, event.visibility)}</Badge>
        </div>
      </button>),
      ...(hiddenMoonEvents.length > 0 ? [<details key="hidden-moon" style={{ fontSize: 12, color: "#9ca3af" }}><summary>{t(project.locale, "eventDisplay.hiddenEvents")}</summary><div style={{ display: "grid", gap: 4, marginTop: 6 }}>{hiddenMoonEvents.map((event) => <button key={event.id} type="button" onClick={onSelectMoonEvent ? () => onSelectMoonEvent(event.id) : undefined} style={{ border: "1px dashed #374151", borderRadius: 6, padding: 6, background: "#0f172a", width: "100%", textAlign: "left", color: "#e5e7eb", cursor: onSelectMoonEvent ? "pointer" : "default" }}>{event.icon ?? "🌕"} {event.name} <span style={{ color: "#9ca3af" }}>— {t(project.locale, `eventDisplay.hiddenReason.${hiddenMoonEventReasons[event.id] ?? "priority"}`)}</span></button>)}</div></details>] : [])
    ];
  return <SectionCard>
    <SectionHeader title={t(project.locale, "events.eventsToday")} />
    {rows.length === 0 ? <EmptyState text={t(project.locale, "events.noEventsToday")} /> : <div style={{ display: "grid", gap: 6 }}>{rows}</div>}
  </SectionCard>
};


const formatMoonEventMeta = (project: CalendarProject, event: NonNullable<CalendarProject["moonEvents"]>[number]): string => {
  const moon = project.moons.find((moonItem) => moonItem.id === event.moonId);
  return `${moon?.name ?? t(project.locale, "moonEvents.unknownMoon")} · ${t(project.locale, `moon.phase.${event.phaseId}`)}`;
};

const PublicEventRow = ({ project, event, background, onSelectPublicEvent }: { project: CalendarProject; event: PublicEventDetails; background: string; onSelectPublicEvent?: (event: PublicEventDetails) => void }) => (
  <button type="button" onClick={onSelectPublicEvent ? () => onSelectPublicEvent(event) : undefined} style={{ border: "1px solid #374151", borderRadius: 6, padding: 6, background, width: "100%", textAlign: "left", cursor: onSelectPublicEvent ? "pointer" : "default" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
      <EventIcon icon={event.icon} locale={project.locale} />
      <strong style={{ color: ui.colors.textPrimary, fontWeight: 800 }}>{event.name}</strong>
      {event.timeLabel ? <span style={{ marginLeft: "auto", fontSize: 12, color: "#cbd5e1" }}>{event.timeLabel}</span> : null}
    </div>
    {event.subtitle ? <div style={{ marginTop: 4, fontSize: 12, color: "#cbd5e1" }}>{event.subtitle}</div> : null}
    {event.summary ? <div style={{ marginTop: 4, fontSize: 12, color: "#d1d5db" }}>{event.summary}</div> : null}
  </button>
);