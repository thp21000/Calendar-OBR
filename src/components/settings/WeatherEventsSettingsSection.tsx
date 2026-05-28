import { useState } from "react";
import { addWeatherEvent, createDefaultWeatherEvent, deleteWeatherEvent, duplicateWeatherEvent, updateWeatherEvent } from "../../calendar/weatherEventsLogic";
import type { CalendarProject, WeatherCondition, WeatherEvent } from "../../domain/types";
import { t } from "../../i18n/messages";
import { WeatherEventPopup } from "../events/WeatherEventPopup";
import { conditionSummary } from "../events/WeatherEventForm";
import { Badge, EmptyState, PrimaryButton, SecondaryButton, SectionCard, SectionHeader } from "../ui";

type Props = { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; inputStyle: React.CSSProperties; };

const statusLabel = (project: CalendarProject, status: WeatherEvent["status"] | undefined) => {
  const value = status ?? "active";
  if (value === "active") return t(project.locale, "weatherEvents.statusActive");
  if (value === "triggered") return t(project.locale, "weatherEvents.statusTriggered");
  if (value === "archived") return t(project.locale, "weatherEvents.statusArchived");
  return t(project.locale, "weatherEvents.statusDisabled");
};

const visibilityLabel = (project: CalendarProject, visibility: WeatherEvent["visibility"] | undefined) => {
  if (visibility === "players") return t(project.locale, "weatherEvents.visibilityPlayers");
  if (visibility === "revealOnTrigger") return t(project.locale, "weatherEvents.visibilityRevealOnTrigger");
  return t(project.locale, "weatherEvents.visibilityGm");
};

const conditionTypeMatch = (condition: WeatherCondition, filter: string): boolean => {
  if (filter === "all") return true;
  if (filter === "metric") return condition.type === undefined || condition.type === "metric";
  return condition.type === filter;
};

export const WeatherEventsSettingsSection = ({ project, onProjectUpdate, inputStyle }: Props) => {
  const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
  const [editingWeatherEventId, setEditingWeatherEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "triggered" | "archived" | "disabled">("all");
  const [conditionFilter, setConditionFilter] = useState<"all" | "metric" | "state" | "dominantState" | "windDirection" | "season" | "timeOfDay" | "moonPhase">("all");

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredWeatherEvents = project.weatherEvents.filter((event) => {
    const status = event.status ?? "active";
    if (statusFilter !== "all" && status !== statusFilter) return false;
    const conditions = event.conditions ?? [];
    if (conditionFilter !== "all" && !conditions.some((condition) => conditionTypeMatch(condition, conditionFilter))) return false;
    if (!normalizedQuery) return true;
    const conditionText = conditions.map((condition) => conditionSummary(project, condition)).join(" ");
    const iconText = event.icon && !/^https?:\/\//i.test(event.icon) ? event.icon : "";
    const haystack = `${event.name} ${event.summary ?? ""} ${iconText} ${event.link ?? ""} ${event.gmDescription ?? ""} ${event.playerDescription ?? ""} ${visibilityLabel(project, event.visibility)} ${statusLabel(project, event.status)} ${conditionText}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const editingWeatherEvent = editingWeatherEventId ? project.weatherEvents.find((event) => event.id === editingWeatherEventId) : undefined;

  const handleDuplicateWeatherEvent = (event: WeatherEvent) => {
    onProjectUpdate(duplicateWeatherEvent(project, event.id));
  };

  const handleDisableWeatherEvent = (event: WeatherEvent) => {
    onProjectUpdate(updateWeatherEvent(project, event.id, { status: "disabled", enabled: false }));
  };

  const handleArchiveWeatherEvent = (event: WeatherEvent) => {
    onProjectUpdate(updateWeatherEvent(project, event.id, { status: "archived", enabled: false }));
  };

  const handleReactivateWeatherEvent = (event: WeatherEvent) => {
    onProjectUpdate(updateWeatherEvent(project, event.id, { status: "active", enabled: true, lastTriggeredAtMinutes: undefined }));
  };

  const isWeatherEventInactive = (event: WeatherEvent) =>
    event.enabled === false || event.status === "disabled" || event.status === "archived";

  const handleToggleWeatherEventEnabled = (event: WeatherEvent) => {
    if (isWeatherEventInactive(event)) {
      handleReactivateWeatherEvent(event);
      return;
    }
    handleDisableWeatherEvent(event);
  };

  return <>
    <SectionCard>
      <PrimaryButton type="button" onClick={() => setIsCreatePopupOpen(true)} style={{ marginBottom: 8 }}>{t(project.locale, "weatherEvents.openCreateForm")}</PrimaryButton>
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>{t(project.locale, "weatherEvents.search")}</label>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t(project.locale, "weatherEvents.searchPlaceholder")} style={inputStyle} />
          {searchQuery.trim() ? <SecondaryButton type="button" onClick={() => setSearchQuery("")}>{t(project.locale, "weatherEvents.clearSearch")}</SecondaryButton> : null}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>{t(project.locale, "weatherEvents.statusFilter")}</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} style={inputStyle}>
            <option value="all">{t(project.locale, "events.filterAll")}</option>
            <option value="active">{t(project.locale, "weatherEvents.statusActive")}</option>
            <option value="triggered">{t(project.locale, "weatherEvents.statusTriggered")}</option>
            <option value="archived">{t(project.locale, "weatherEvents.statusArchived")}</option>
            <option value="disabled">{t(project.locale, "weatherEvents.statusDisabled")}</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>{t(project.locale, "weatherEvents.conditionFilter")}</label>
          <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value as typeof conditionFilter)} style={inputStyle}>
            <option value="all">{t(project.locale, "weatherEvents.conditionFilterAll")}</option>
            <option value="metric">{t(project.locale, "weatherEvents.conditionTypeMetric")}</option>
            <option value="state">{t(project.locale, "weatherEvents.conditionTypeState")}</option>
            <option value="dominantState">{t(project.locale, "weatherEvents.conditionDominantState")}</option>
            <option value="windDirection">{t(project.locale, "weatherEvents.conditionWindDirection")}</option>
            <option value="season">{t(project.locale, "weatherEvents.conditionTypeSeason")}</option>
            <option value="timeOfDay">{t(project.locale, "weatherEvents.conditionTypeTimeOfDay")}</option>
            <option value="moonPhase">{t(project.locale, "weatherEvents.conditionTypeMoonPhase")}</option>
          </select>
        </div>
      </div>
    </SectionCard>

    <SectionCard>
      <SectionHeader title={`${t(project.locale, "weatherEvents.listTitle")} (${filteredWeatherEvents.length})`} />
      {filteredWeatherEvents.length === 0 ? <EmptyState text={normalizedQuery ? t(project.locale, "weatherEvents.noEventsForSearch") : t(project.locale, "weatherEvents.noEventsForFilter")} /> : <div style={{ display: "grid", gap: 8 }}>
        {filteredWeatherEvents.map((event) => {
          const conditions = event.conditions ?? [];
          return <div key={event.id} style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span>{event.icon || "🌩️"}</span><strong>{event.name}</strong></div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Badge>{event.enabled !== false ? t(project.locale, "weatherEvents.enabled") : t(project.locale, "weatherEvents.disabled")}</Badge>
                <Badge>{(event.kind ?? "informational") === "weatherEffect" ? t(project.locale, "weatherEvents.kindWeatherEffect") : t(project.locale, "weatherEvents.kindInformational")}</Badge>
                <Badge>{visibilityLabel(project, event.visibility)}</Badge>
                {event.notifyOnTrigger !== false ? <Badge>{t(project.locale, "weatherEvents.notifyOnTrigger")}</Badge> : null}
                {Math.max(0, Math.min(100, Math.round(event.triggerChancePercent ?? 100))) < 100 ? <Badge>{t(project.locale, "weatherEvents.triggerChanceBadge").replace("{count}", String(Math.max(0, Math.min(100, Math.round(event.triggerChancePercent ?? 100)))))}</Badge> : null}
                {typeof event.durationHours === "number" ? <Badge>{t(project.locale, "weatherEvents.durationBadge").replace("{count}", String(event.durationHours))}</Badge> : null}
                {typeof event.cooldownHours === "number" ? <Badge>{t(project.locale, "weatherEvents.cooldownBadge").replace("{count}", String(event.cooldownHours))}</Badge> : null}
                {event.status === "archived" ? <Badge>{t(project.locale, "weatherEvents.statusArchivedBadge")}</Badge> : null}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#d1d5db", marginBottom: 6 }}>{event.summary?.trim() ? event.summary : t(project.locale, "weatherEvents.noSummary")}</div>
            {conditions.length > 0 ? <div style={{ marginBottom: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>{conditions.map((condition, index) => <Badge key={`${event.id}-c-${index}`}>{conditionSummary(project, condition)}</Badge>)}</div> : null}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <SecondaryButton type="button" onClick={() => setEditingWeatherEventId(event.id)}>{t(project.locale, "events.edit")}</SecondaryButton>
              <SecondaryButton type="button" onClick={() => handleDuplicateWeatherEvent(event)}>{t(project.locale, "events.duplicate")}</SecondaryButton>
              <SecondaryButton type="button" onClick={() => handleToggleWeatherEventEnabled(event)}>
                {isWeatherEventInactive(event) ? t(project.locale, "events.reactivate") : t(project.locale, "events.disable")}
              </SecondaryButton>
              {event.status !== "archived" ? <SecondaryButton type="button" onClick={() => handleArchiveWeatherEvent(event)}>{t(project.locale, "events.archive")}</SecondaryButton> : null}
              <SecondaryButton type="button" onClick={() => { if (!confirm(t(project.locale, "weatherEvents.confirmDelete"))) return; onProjectUpdate(deleteWeatherEvent(project, event.id)); if (editingWeatherEventId === event.id) setEditingWeatherEventId(null); }}>{t(project.locale, "weatherEvents.delete")}</SecondaryButton>
            </div>
          </div>;
        })}
      </div>}
    </SectionCard>

    {isCreatePopupOpen ? <WeatherEventPopup project={project} event={createDefaultWeatherEvent(project.locale)} mode="create" onClose={() => setIsCreatePopupOpen(false)} onSubmit={(event) => { onProjectUpdate(addWeatherEvent(project, event)); setIsCreatePopupOpen(false); }} /> : null}
    {editingWeatherEvent ? <WeatherEventPopup project={project} event={editingWeatherEvent} mode="edit" onClose={() => setEditingWeatherEventId(null)} onSubmit={(event) => { onProjectUpdate(updateWeatherEvent(project, event.id, event)); setEditingWeatherEventId(null); }} /> : null}
  </>;
};