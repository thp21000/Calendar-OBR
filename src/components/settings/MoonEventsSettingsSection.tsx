import { useEffect, useState } from "react";
import { getNextMoonEventActivationDate } from "../../calendar/moonEventsLogic";
import { getMoonPhaseForDate } from "../../calendar/moonLogic";
import { addMoonEvent, createDefaultMoonEvent, deleteMoonEvent, updateMoonEvent } from "../../calendar/moonEventsLogic";
import type { CalendarProject, MoonEvent, MoonPhaseId } from "../../domain/types";
import { t } from "../../i18n/messages";
import { Badge, EmptyState, PrimaryButton, SecondaryButton, SectionCard, SectionHeader } from "../ui";
import { MoonEventPopup } from "../events/MoonEventPopup";

const phases: MoonPhaseId[] = ["new", "waxingCrescent", "firstQuarter", "waxingGibbous", "full", "waningGibbous", "lastQuarter", "waningCrescent"];

export const MoonEventsSettingsSection = ({ project, onProjectUpdate, inputStyle }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; inputStyle: React.CSSProperties }) => {
  const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
  const [editingMoonEventId, setEditingMoonEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [moonPeriodFilter, setMoonPeriodFilter] = useState<"all" | "current" | "other">("all");
  const [moonPhaseFilter, setMoonPhaseFilter] = useState("all");
  const [moonCreateError, setMoonCreateError] = useState(false);

  useEffect(() => {
    if (project.moons.length > 0) setMoonCreateError(false);
  }, [project.moons.length]);

  const moonEvents = project.moonEvents ?? [];
  const editingMoonEvent = editingMoonEventId ? moonEvents.find((event) => event.id === editingMoonEventId) : undefined;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isMoonEventMatchingCurrentPhase = (event: MoonEvent): boolean => {
    const moon = project.moons.find((item) => item.id === event.moonId);
    if (!moon) return false;
    return getMoonPhaseForDate(moon, project.currentTime.absoluteDay).id === event.phaseId;
  };

  const filteredMoonEvents = moonEvents.filter((event) => {
    if (moonPeriodFilter === "current" && !isMoonEventMatchingCurrentPhase(event)) return false;
    if (moonPeriodFilter === "other" && isMoonEventMatchingCurrentPhase(event)) return false;
    if (moonPhaseFilter !== "all") {
      const [moonId, phaseId] = moonPhaseFilter.split(":");
      if (event.moonId !== moonId || event.phaseId !== phaseId) return false;
    }
    if (!normalizedQuery) return true;
    const moon = project.moons.find((item) => item.id === event.moonId);
    const iconText = event.icon && !/^https?:\/\//i.test(event.icon) ? event.icon : "";
    const visibility = formatMoonEventVisibility(project, event.visibility);
    const haystack = `${event.name} ${event.summary ?? ""} ${iconText} ${moon?.name ?? ""} ${t(project.locale, `moon.phase.${event.phaseId}`)} ${visibility}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const formatMoonEventNextActivation = (event: MoonEvent): string => {
    const nextActivationDate = getNextMoonEventActivationDate(project, event);
    if (!nextActivationDate) return t(project.locale, "moonEvents.nextActivationUnknown");
    const month = project.calendarSystem.months.find((item) => item.id === nextActivationDate.monthId);
    const formatted = `${nextActivationDate.dayOfMonth} ${month?.name ?? nextActivationDate.monthId} ${nextActivationDate.year}`;
    return t(project.locale, "moonEvents.nextActivation").replace("{date}", formatted);
  };

  return <>
    <SectionCard>
      <PrimaryButton type="button" onClick={() => {
        if (project.moons.length === 0) {
          setMoonCreateError(true);
          return;
        }
        setMoonCreateError(false);
        setIsCreatePopupOpen(true);
      }} style={{ marginBottom: 8 }}>
        {t(project.locale, "moonEvents.openCreateForm")}
      </PrimaryButton>
      {moonCreateError ? (
        <div style={{ fontSize: 12, color: "#fca5a5", marginBottom: 8 }}>
          {t(project.locale, "moonEvents.createRequiresMoon")}
        </div>
      ) : null}
      <div style={{ marginBottom: 8 }}>
        <label style={label}>{t(project.locale, "moonEvents.search")}</label>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t(project.locale, "moonEvents.searchPlaceholder")} style={inputStyle} />
          {searchQuery.trim() ? <SecondaryButton type="button" onClick={() => setSearchQuery("")}>{t(project.locale, "moonEvents.clearSearch")}</SecondaryButton> : null}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8 }}>
        <div>
          <label style={label}>{t(project.locale, "moonEvents.period")}</label>
          <select value={moonPeriodFilter} onChange={(e) => setMoonPeriodFilter(e.target.value as "all" | "current" | "other")} style={inputStyle}>
            <option value="all">{t(project.locale, "moonEvents.periodAll")}</option>
            <option value="current">{t(project.locale, "moonEvents.periodCurrent")}</option>
            <option value="other">{t(project.locale, "moonEvents.periodOther")}</option>
          </select>
        </div>
        <div>
          <label style={label}>{t(project.locale, "moonEvents.phaseFilter")}</label>
          <select value={moonPhaseFilter} onChange={(e) => setMoonPhaseFilter(e.target.value)} style={inputStyle}>
            <option value="all">{t(project.locale, "moonEvents.phaseFilterAll")}</option>
            {project.moons.flatMap((moon) => phases.map((phaseId) => (
              <option key={`${moon.id}:${phaseId}`} value={`${moon.id}:${phaseId}`}>
                {moon.name} — {t(project.locale, `moon.phase.${phaseId}`)}
              </option>
            )))}
          </select>
        </div>
      </div>
    </SectionCard>

    <SectionCard>
      <SectionHeader title={`${t(project.locale, "moonEvents.listTitle")} (${filteredMoonEvents.length})`} />
      {filteredMoonEvents.length === 0 ? <EmptyState text={normalizedQuery ? t(project.locale, "moonEvents.noEventsForSearch") : t(project.locale, "moonEvents.noEventsForFilter")} /> : <div style={{ display: "grid", gap: 8 }}>
        {filteredMoonEvents.map((event) => {
          const moon = project.moons.find((moonItem) => moonItem.id === event.moonId);
          return <div key={event.id} style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span>{event.icon || "🌕"}</span>
                <strong style={{ overflowWrap: "anywhere" }}>{event.name}</strong>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Badge>{event.enabled ? t(project.locale, "moonEvents.enabled") : t(project.locale, "moonEvents.disabled")}</Badge>
                <Badge>{formatMoonEventVisibility(project, event.visibility)}</Badge>
                {event.notifyOnTrigger ? <Badge>{t(project.locale, "moonEvents.notifyOnTrigger")}</Badge> : null}
              </div>
            </div>
            <div style={metaStyle}>{moon?.name ?? t(project.locale, "moonEvents.unknownMoon")} · {t(project.locale, `moon.phase.${event.phaseId}`)} · {formatMoonEventNextActivation(event)}</div>
            <div style={metaStyle}>{moon?.name ?? t(project.locale, "moonEvents.unknownMoon")} · {t(project.locale, `moon.phase.${event.phaseId}`)}</div>
            <div style={summaryStyle}>{event.summary?.trim() ? event.summary : t(project.locale, "moonEvents.noSummary")}</div>
            <div style={actionsStyle}>
              <SecondaryButton type="button" onClick={() => setEditingMoonEventId(event.id)}>{t(project.locale, "events.edit")}</SecondaryButton>
              <SecondaryButton type="button" onClick={() => {
                if (!confirm(t(project.locale, "moonEvents.confirmDelete"))) return;
                onProjectUpdate(deleteMoonEvent(project, event.id));
                if (editingMoonEventId === event.id) setEditingMoonEventId(null);
              }}>{t(project.locale, "moonEvents.delete")}</SecondaryButton>
            </div>
          </div>;
        })}
      </div>}
    </SectionCard>

    {isCreatePopupOpen ? <MoonEventPopup project={project} event={createDefaultMoonEvent(project)} mode="create" onClose={() => setIsCreatePopupOpen(false)} onSubmit={(event) => { onProjectUpdate(addMoonEvent(project, event)); setIsCreatePopupOpen(false); }} /> : null}
    {editingMoonEvent ? <MoonEventPopup project={project} event={editingMoonEvent} mode="edit" onClose={() => setEditingMoonEventId(null)} onSubmit={(event) => { onProjectUpdate(updateMoonEvent(project, event.id, event)); setEditingMoonEventId(null); }} /> : null}
  </>;
};

const formatMoonEventVisibility = (project: CalendarProject, visibility: "gm" | "players" | "revealOnTrigger"): string => {
  if (visibility === "gm") return t(project.locale, "events.visibilityGm");
  if (visibility === "players") return t(project.locale, "events.visibilityPlayers");
  return t(project.locale, "events.visibilityRevealOnTrigger");
};

const label = { display: "block", fontSize: 12, marginBottom: 4 };
const cardStyle = { border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827" };
const cardHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 };
const metaStyle = { fontSize: 12, color: "#cbd5e1", marginBottom: 4 };
const summaryStyle = { fontSize: 12, color: "#d1d5db", marginBottom: 6, whiteSpace: "pre-wrap" as const };
const actionsStyle = { display: "flex", gap: 6, flexWrap: "wrap" as const };