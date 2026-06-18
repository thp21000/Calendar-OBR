import { useEffect, useState, type ReactNode } from "react";
import type { CalendarProject, MoonEvent, MoonEventCondition, MoonEventRepeatMode, MoonPhaseId } from "../../domain/types";
import { t } from "../../i18n/messages";
import { getAdventureContextLabel, normalizeAdventureContext } from "../../calendar/adventureContext";
import { WEATHER_BIOME_DEFINITIONS, type WeatherBiomeId } from "../../calendar/weather/biomes";

const phases: MoonPhaseId[] = ["new", "waxingCrescent", "firstQuarter", "waxingGibbous", "full", "waningGibbous", "lastQuarter", "waningCrescent"];

type MoonEventFormSectionProps = {
  title: string;
  children: ReactNode;
};

const MoonEventFormSection = ({ title, children }: MoonEventFormSectionProps) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={sectionBoxStyle}>
      <button type="button" onClick={() => setOpen((value) => !value)} style={sectionHeaderButtonStyle}>
        <span>{title}</span>
        <span>{open ? "▾" : "▸"}</span>
      </button>
      {open ? <div style={sectionContentStyle}>{children}</div> : null}
    </div>
  );
};

export const MoonEventForm = ({
  project,
  event,
  mode,
  onSubmit,
  onCancel,
  onDraftChange,
  nextActivationLabels
}: {
  project: CalendarProject;
  event: MoonEvent;
  mode: "create" | "edit";
  onSubmit: (event: MoonEvent) => void;
  onCancel: () => void;
  onDraftChange?: (event: MoonEvent) => void;
  nextActivationLabels: string[];
}) => {
  const [draft, setDraft] = useState<MoonEvent>({
    ...event,
    conditions: {
      seasonIds: event.conditions?.seasonIds ?? [],
      monthIds: event.conditions?.monthIds ?? [],
      eventConditions: event.conditions?.eventConditions ?? []
    },
    repeatMode: event.repeatMode ?? "everyOccurrence"
  });

  const months = [...project.calendarSystem.months].sort((a, b) => a.order - b.order);
  const repeatMode = draft.repeatMode ?? "everyOccurrence";
  const conditions = draft.conditions ?? { seasonIds: [], monthIds: [], eventConditions: [] };
  const seasonIds = conditions.seasonIds ?? [];
  const monthIds = conditions.monthIds ?? [];
  const eventConditions = conditions.eventConditions ?? [];
  const biomeCondition = eventConditions.find((condition): condition is Extract<MoonEventCondition, { type: "biome" }> => condition.type === "biome");
  const adventureContextCondition = eventConditions.find((condition): condition is Extract<MoonEventCondition, { type: "adventureContext" }> => condition.type === "adventureContext");
  const adventureContextState = normalizeAdventureContext(project.adventureContext);

  useEffect(() => {
    onDraftChange?.(draft);
  }, [draft, onDraftChange]);

  const toggleSeason = (seasonId: string) => {
    setDraft((prev) => {
      const prevSeasonIds = prev.conditions?.seasonIds ?? [];
      const prevMonthIds = prev.conditions?.monthIds ?? [];
      const nextSeasonIds = prevSeasonIds.includes(seasonId)
        ? prevSeasonIds.filter((id) => id !== seasonId)
        : [...prevSeasonIds, seasonId];
      return { ...prev, conditions: { seasonIds: nextSeasonIds, monthIds: prevMonthIds, eventConditions: prev.conditions?.eventConditions ?? [] } };
    });
  };

  const toggleMonth = (monthId: string) => {
    setDraft((prev) => {
      const prevSeasonIds = prev.conditions?.seasonIds ?? [];
      const prevMonthIds = prev.conditions?.monthIds ?? [];
      const nextMonthIds = prevMonthIds.includes(monthId)
        ? prevMonthIds.filter((id) => id !== monthId)
        : [...prevMonthIds, monthId];
      return { ...prev, conditions: { seasonIds: prevSeasonIds, monthIds: nextMonthIds, eventConditions: prev.conditions?.eventConditions ?? [] } };
    });
  };

  const setAllSeasons = () => {
    setDraft((prev) => ({
      ...prev,
      conditions: {
        seasonIds: project.seasons.map((season) => season.id),
        monthIds: prev.conditions?.monthIds ?? [],
        eventConditions: prev.conditions?.eventConditions ?? []
      }
    }));
  };

  const clearSeasonFilter = () => {
    setDraft((prev) => ({
      ...prev,
      conditions: {
        seasonIds: [],
        monthIds: prev.conditions?.monthIds ?? [],
        eventConditions: prev.conditions?.eventConditions ?? []
      }
    }));
  };

  const setAllMonths = () => {
    setDraft((prev) => ({
      ...prev,
      conditions: {
        seasonIds: prev.conditions?.seasonIds ?? [],
        monthIds: months.map((month) => month.id),
        eventConditions: prev.conditions?.eventConditions ?? []
      }
    }));
  };

  const clearMonthFilter = () => {
    setDraft((prev) => ({
      ...prev,
      conditions: {
        seasonIds: prev.conditions?.seasonIds ?? [],
        monthIds: [],
        eventConditions: prev.conditions?.eventConditions ?? []
      }
    }));
  };
  const setEventCondition = (nextCondition: MoonEventCondition | undefined) => {
    setDraft((prev) => {
      const existing = prev.conditions?.eventConditions ?? [];
      const nextEventConditions = nextCondition
        ? [...existing.filter((condition) => condition.type !== nextCondition.type), nextCondition]
        : existing;
      return {
        ...prev,
        conditions: {
          seasonIds: prev.conditions?.seasonIds ?? [],
          monthIds: prev.conditions?.monthIds ?? [],
          eventConditions: nextEventConditions
        }
      };
    });
  };

  const removeEventCondition = (type: MoonEventCondition["type"]) => {
    setDraft((prev) => ({
      ...prev,
      conditions: {
        seasonIds: prev.conditions?.seasonIds ?? [],
        monthIds: prev.conditions?.monthIds ?? [],
        eventConditions: (prev.conditions?.eventConditions ?? []).filter((condition) => condition.type !== type)
      }
    }));
  };

  const toggleBiomeCondition = (biomeId: WeatherBiomeId) => {
    const current = new Set(biomeCondition?.biomeIds ?? []);
    if (current.has(biomeId)) current.delete(biomeId);
    else current.add(biomeId);
    const biomeIds = Array.from(current) as WeatherBiomeId[];
    if (biomeIds.length === 0) removeEventCondition("biome");
    else setEventCondition({ type: "biome", biomeIds });
  };

  const toggleAdventureContextCondition = (contextId: string) => {
    const current = new Set(adventureContextCondition?.contextIds ?? []);
    if (current.has(contextId)) current.delete(contextId);
    else current.add(contextId);
    const contextIds = Array.from(current);
    if (contextIds.length === 0) removeEventCondition("adventureContext");
    else setEventCondition({ ...adventureContextCondition, type: "adventureContext", mode: adventureContextCondition?.mode ?? "any", contextIds });
  };

  const toggleLocalAdventureContext = (contextId: string, field: "primaryContextIds" | "secondaryContextIds") => {
    const current = new Set(adventureContextCondition?.[field] ?? []);
    if (current.has(contextId)) current.delete(contextId);
    else current.add(contextId);
    setEventCondition({
      ...adventureContextCondition,
      type: "adventureContext",
      mode: adventureContextCondition?.mode ?? "any",
      contextIds: adventureContextCondition?.contextIds ?? [],
      primaryContextIds: field === "primaryContextIds" ? Array.from(current) : adventureContextCondition?.primaryContextIds ?? [],
      secondaryContextIds: field === "secondaryContextIds" ? Array.from(current) : adventureContextCondition?.secondaryContextIds ?? [],
      contextRequirementMode: adventureContextCondition?.contextRequirementMode ?? "primaryOnly"
    });
  };

  const getMoonEventAutoSummary = (): string => {
    const parts: string[] = [];
    const moonName = project.moons.find((moon) => moon.id === draft.moonId)?.name ?? t(project.locale, "moonEvents.unknownMoon");
    parts.push(moonName);
    parts.push(t(project.locale, `moon.phase.${draft.phaseId}`));

    if (seasonIds.length === 1) {
      const seasonName = project.seasons.find((season) => season.id === seasonIds[0])?.name;
      if (seasonName) parts.push(seasonName);
    } else if (seasonIds.length > 1) {
      parts.push(t(project.locale, "moonEvents.selectedSeasons").replace("{count}", String(seasonIds.length)));
    }

    if (monthIds.length === 1) {
      const monthName = months.find((month) => month.id === monthIds[0])?.name;
      if (monthName) parts.push(monthName);
    } else if (monthIds.length > 1) {
      parts.push(t(project.locale, "moonEvents.selectedMonths").replace("{count}", String(monthIds.length)));
    }

    if (biomeCondition?.biomeIds.length) parts.push(t(project.locale, "moonEvents.conditionBiomeCount").replace("{count}", String(biomeCondition.biomeIds.length)));
    if (adventureContextCondition?.contextIds.length) parts.push(t(project.locale, "moonEvents.conditionContextCount").replace("{count}", String(adventureContextCondition.contextIds.length)));

    if (repeatMode === "once") parts.push(t(project.locale, "moonEvents.conditionNoRepeat"));
    if (repeatMode === "everyOtherOccurrence") parts.push(t(project.locale, "moonEvents.conditionEveryOtherMoon"));

    return parts.join(" · ");
  };

  const seasonStateLabel = seasonIds.length === 0
    ? t(project.locale, "moonEvents.allSeasons")
    : t(project.locale, "moonEvents.selectedSeasons").replace("{count}", String(seasonIds.length));

  const monthStateLabel = monthIds.length === 0
    ? t(project.locale, "moonEvents.allMonths")
    : t(project.locale, "moonEvents.selectedMonths").replace("{count}", String(monthIds.length));

  return (
    <div>
      <div style={autoSummaryBoxStyle}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{t(project.locale, "moonEvents.autoSummary")}</div>
        <div>{getMoonEventAutoSummary()}</div>
      </div>

      <MoonEventFormSection title={t(project.locale, "moonEvents.sectionGeneral")}>
        <label style={label}>{t(project.locale, "moonEvents.name")}</label>
        <input value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} style={inputStyle} />

        <label style={label}>{t(project.locale, "moonEvents.icon")}</label>
        <input value={draft.icon ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, icon: e.target.value }))} style={inputStyle} />

        <label style={label}>{t(project.locale, "moonEvents.summary")}</label>
        <input value={draft.summary} onChange={(e) => setDraft((prev) => ({ ...prev, summary: e.target.value }))} style={inputStyle} />

        <label style={label}>{t(project.locale, "moonEvents.playerDescription")}</label>
        <textarea value={draft.playerDescription ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, playerDescription: e.target.value }))} style={textareaStyle} />

        <label style={label}>{t(project.locale, "moonEvents.gmDescription")}</label>
        <textarea value={draft.gmDescription ?? ""} onChange={(e) => setDraft((prev) => ({ ...prev, gmDescription: e.target.value }))} style={textareaStyle} />

        <label style={label}>{t(project.locale, "moonEvents.visibility")}</label>
        <select value={draft.visibility} onChange={(e) => setDraft((prev) => ({ ...prev, visibility: e.target.value as "gm" | "players" | "revealOnTrigger" }))} style={inputStyle}>
          <option value="gm">{t(project.locale, "events.visibilityGm")}</option>
          <option value="players">{t(project.locale, "events.visibilityPlayers")}</option>
          <option value="revealOnTrigger">{t(project.locale, "events.visibilityRevealOnTrigger")}</option>
        </select>
      </MoonEventFormSection>

      <MoonEventFormSection title={t(project.locale, "moonEvents.sectionTrigger")}>
        <label style={label}>{t(project.locale, "moonEvents.moon")}</label>
        <select value={draft.moonId} onChange={(e) => setDraft((prev) => ({ ...prev, moonId: e.target.value }))} style={inputStyle}>
          {project.moons.map((moon) => <option key={moon.id} value={moon.id}>{moon.name}</option>)}
        </select>

        <label style={label}>{t(project.locale, "moonEvents.phase")}</label>
        <select value={draft.phaseId} onChange={(e) => setDraft((prev) => ({ ...prev, phaseId: e.target.value as MoonPhaseId }))} style={inputStyle}>
          {phases.map((phaseId) => <option key={phaseId} value={phaseId}>{t(project.locale, `moon.phase.${phaseId}`)}</option>)}
        </select>
      </MoonEventFormSection>

      <MoonEventFormSection title={t(project.locale, "moonEvents.conditionsSection")}>
        <div>
          <div style={conditionHeaderRowStyle}>
            <strong style={conditionTitleStyle}>{t(project.locale, "moonEvents.conditionSeasons")}</strong>
            {project.seasons.length > 0 ? (
              <div style={conditionActionRowStyle}>
                <button type="button" style={miniButtonStyle} onClick={setAllSeasons}>{t(project.locale, "moonEvents.selectAll")}</button>
                <button type="button" style={miniButtonStyle} onClick={clearSeasonFilter}>{t(project.locale, "moonEvents.clearFilter")}</button>
              </div>
            ) : null}
          </div>
          <div style={conditionStateStyle}>{seasonStateLabel}</div>
          {project.seasons.length === 0 ? <div style={hint}>{t(project.locale, "moonEvents.noSeasonConfigured")}</div> : (
            <div style={badgeGridStyle}>
              {project.seasons.map((season) => {
                const selected = seasonIds.includes(season.id);
                return (
                  <button key={season.id} type="button" onClick={() => toggleSeason(season.id)} style={{ ...badgeButtonStyle, ...(selected ? badgeButtonActiveStyle : badgeButtonInactiveStyle) }}>
                    {season.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div style={conditionHeaderRowStyle}>
            <strong style={conditionTitleStyle}>{t(project.locale, "moonEvents.conditionMonths")}</strong>
            <div style={conditionActionRowStyle}>
              <button type="button" style={miniButtonStyle} onClick={setAllMonths}>{t(project.locale, "moonEvents.selectAll")}</button>
              <button type="button" style={miniButtonStyle} onClick={clearMonthFilter}>{t(project.locale, "moonEvents.clearFilter")}</button>
            </div>
          </div>
          <div style={conditionStateStyle}>{monthStateLabel}</div>
          <div style={badgeGridStyle}>
            {months.map((month) => {
              const selected = monthIds.includes(month.id);
              return (
                <button key={month.id} type="button" onClick={() => toggleMonth(month.id)} style={{ ...badgeButtonStyle, ...(selected ? badgeButtonActiveStyle : badgeButtonInactiveStyle) }}>
                  {month.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div style={conditionHeaderRowStyle}>
            <strong style={conditionTitleStyle}>{t(project.locale, "moonEvents.conditionBiomes")}</strong>
            <div style={conditionActionRowStyle}>
              <button type="button" style={miniButtonStyle} onClick={() => setEventCondition({ type: "biome", biomeIds: WEATHER_BIOME_DEFINITIONS.map((definition) => definition.id) })}>{t(project.locale, "moonEvents.selectAll")}</button>
              <button type="button" style={miniButtonStyle} onClick={() => removeEventCondition("biome")}>{t(project.locale, "moonEvents.clearFilter")}</button>
            </div>
          </div>
          <div style={conditionStateStyle}>{biomeCondition?.biomeIds.length ? t(project.locale, "moonEvents.selectedBiomes").replace("{count}", String(biomeCondition.biomeIds.length)) : t(project.locale, "moonEvents.allBiomes")}</div>
          <div style={badgeGridStyle}>
            {WEATHER_BIOME_DEFINITIONS.map((definition) => {
              const selected = Boolean(biomeCondition?.biomeIds.includes(definition.id));
              return (
                <button key={definition.id} type="button" onClick={() => toggleBiomeCondition(definition.id)} style={{ ...badgeButtonStyle, ...(selected ? badgeButtonActiveStyle : badgeButtonInactiveStyle) }}>
                  {definition.icon} {t(project.locale, definition.nameKey)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div style={conditionHeaderRowStyle}>
            <strong style={conditionTitleStyle}>{t(project.locale, "moonEvents.conditionAdventureContexts")}</strong>
            <div style={conditionActionRowStyle}>
              <button type="button" style={miniButtonStyle} onClick={() => removeEventCondition("adventureContext")}>{t(project.locale, "moonEvents.clearFilter")}</button>
            </div>
          </div>
          <div style={conditionStateStyle}>{adventureContextCondition?.contextIds.length ? t(project.locale, "moonEvents.selectedContexts").replace("{count}", String(adventureContextCondition.contextIds.length)) : t(project.locale, "moonEvents.allContexts")}</div>
          {adventureContextCondition ? (
            <>
              <label style={label}>{t(project.locale, "adventureContext.localRequirementMode")}</label>
              <select value={adventureContextCondition.contextRequirementMode ?? "primaryOnly"} onChange={(e) => setEventCondition({ ...adventureContextCondition, contextRequirementMode: e.target.value as "primaryOnly" | "primaryAndAnySecondary" })} style={inputStyle}>
                <option value="primaryOnly">{t(project.locale, "adventureContext.localMode.primaryOnly")}</option>
                <option value="primaryAndAnySecondary">{t(project.locale, "adventureContext.localMode.primaryAndAnySecondary")}</option>
              </select>
              <div style={conditionStateStyle}>{t(project.locale, "adventureContext.primaryContexts")}: {(adventureContextCondition.primaryContextIds ?? []).length}</div>
              <div style={badgeGridStyle}>
                {adventureContextState.availableContexts.filter((context) => context.enabled).map((context) => {
                  const selected = Boolean(adventureContextCondition.primaryContextIds?.includes(context.id));
                  return <button key={`primary-${context.id}`} type="button" title={context.description?.[project.locale]} onClick={() => toggleLocalAdventureContext(context.id, "primaryContextIds")} style={{ ...badgeButtonStyle, ...(selected ? badgeButtonActiveStyle : badgeButtonInactiveStyle) }}>{context.icon} {getAdventureContextLabel(context, project.locale)}</button>;
                })}
              </div>
              <div style={conditionStateStyle}>{t(project.locale, "adventureContext.secondaryContexts")}: {(adventureContextCondition.secondaryContextIds ?? []).length}</div>
              <div style={badgeGridStyle}>
                {adventureContextState.availableContexts.filter((context) => context.enabled).map((context) => {
                  const selected = Boolean(adventureContextCondition.secondaryContextIds?.includes(context.id));
                  return <button key={`secondary-${context.id}`} type="button" title={context.description?.[project.locale]} onClick={() => toggleLocalAdventureContext(context.id, "secondaryContextIds")} style={{ ...badgeButtonStyle, ...(selected ? badgeButtonActiveStyle : badgeButtonInactiveStyle) }}>{context.icon} {getAdventureContextLabel(context, project.locale)}</button>;
                })}
              </div>
              <label style={label}>{t(project.locale, "weatherEvents.conditionMode")}</label>
              <select value={adventureContextCondition.mode} onChange={(e) => setEventCondition({ ...adventureContextCondition, mode: e.target.value as "any" | "all" | "none" })} style={inputStyle}>
                <option value="any">{t(project.locale, "adventureContext.conditionMode.any")}</option>
                <option value="all">{t(project.locale, "adventureContext.conditionMode.all")}</option>
                <option value="none">{t(project.locale, "adventureContext.conditionMode.none")}</option>
              </select>
            </>
          ) : null}
          <div style={badgeGridStyle}>
            {adventureContextState.availableContexts.filter((context) => context.enabled).map((context) => {
              const selected = Boolean(adventureContextCondition?.contextIds.includes(context.id));
              return (
                <button key={context.id} type="button" title={context.description?.[project.locale]} onClick={() => toggleAdventureContextCondition(context.id)} style={{ ...badgeButtonStyle, ...(selected ? badgeButtonActiveStyle : badgeButtonInactiveStyle) }}>
                  {context.icon} {getAdventureContextLabel(context, project.locale)}
                </button>
              );
            })}
          </div>
        </div>
      </MoonEventFormSection>

      <MoonEventFormSection title={t(project.locale, "moonEvents.repeatSection")}>
        <label style={label}>{t(project.locale, "moonEvents.repeatMode")}</label>
        <select value={repeatMode} onChange={(e) => setDraft((prev) => ({ ...prev, repeatMode: e.target.value as MoonEventRepeatMode }))} style={inputStyle}>
          <option value="once">{t(project.locale, "moonEvents.repeatOnce")}</option>
          <option value="everyOccurrence">{t(project.locale, "moonEvents.repeatEveryOccurrence")}</option>
          <option value="everyOtherOccurrence">{t(project.locale, "moonEvents.repeatEveryOtherOccurrence")}</option>
        </select>
      </MoonEventFormSection>

      <MoonEventFormSection title={t(project.locale, "moonEvents.sectionTriggerOptions")}>
        <label style={checkboxLabel}>
          <input type="checkbox" checked={draft.notifyOnTrigger} onChange={(e) => setDraft((prev) => ({ ...prev, notifyOnTrigger: e.target.checked }))} />
          {t(project.locale, "moonEvents.notifyOnTrigger")}
          <span title={t(project.locale, "moonEvents.help.notifyOnTrigger")} style={infoIconStyle}>ⓘ</span>
        </label>
      </MoonEventFormSection>

      <MoonEventFormSection title={t(project.locale, "moonEvents.nextActivationsTitle")}>
        {nextActivationLabels.length === 0 ? (
          <div style={hint}>{t(project.locale, "moonEvents.nextActivationUnknown")}</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 16, color: "#d1d5db", fontSize: 12 }}>
            {nextActivationLabels.map((labelValue) => <li key={labelValue}>{labelValue}</li>)}
          </ul>
        )}
      </MoonEventFormSection>

      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button type="button" onClick={onCancel} style={buttonStyle}>{t(project.locale, "moonEvents.cancel")}</button>
        <button type="button" onClick={() => onSubmit({ ...draft, conditions: { seasonIds: seasonIds ?? [], monthIds: monthIds ?? [], eventConditions }, repeatMode: draft.repeatMode ?? "everyOccurrence" })} style={buttonStyle}>{mode === "create" ? t(project.locale, "moonEvents.create") : t(project.locale, "moonEvents.update")}</button>
      </div>
    </div>
  );
};

const inputStyle = { width: "100%", background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 6, padding: "6px 8px", fontSize: 12, boxSizing: "border-box" as const, marginBottom: 8 };
const label = { display: "block", fontSize: 12, marginBottom: 4 };
const checkboxLabel = { display: "inline-flex", gap: 6, alignItems: "center", fontSize: 12, color: "#d1d5db" };
const hint = { fontSize: 12, color: "#9ca3af", marginBottom: 6 };
const buttonStyle = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "6px 10px", cursor: "pointer" };
const textareaStyle = { width: "100%", minHeight: 70, background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 6, padding: "6px 8px", fontSize: 12, boxSizing: "border-box" as const, marginBottom: 8 };
const sectionBoxStyle = { border: "1px solid #374151", borderRadius: 8, marginBottom: 8, overflow: "hidden" };
const sectionHeaderButtonStyle = { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111827", color: "#f3f4f6", padding: "8px 10px", border: 0, cursor: "pointer", fontSize: 12, fontWeight: 700 };
const sectionContentStyle = { padding: 8, display: "grid", gap: 8, background: "#0f172a" };
const autoSummaryBoxStyle = { border: "1px solid #374151", borderRadius: 8, background: "#111827", padding: 8, marginBottom: 8, fontSize: 12, color: "#cbd5e1" };
const conditionHeaderRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 };
const conditionTitleStyle = { color: "#e5e7eb", fontSize: 12 };
const conditionActionRowStyle = { display: "flex", gap: 6, flexWrap: "wrap" as const };
const conditionStateStyle = { fontSize: 12, color: "#9ca3af", marginBottom: 6 };
const miniButtonStyle = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#d1d5db", padding: "2px 8px", cursor: "pointer", fontSize: 11 };
const badgeGridStyle = { display: "flex", gap: 6, flexWrap: "wrap" as const };
const badgeButtonStyle = { borderRadius: 999, border: "1px solid", padding: "4px 10px", fontSize: 11, cursor: "pointer" };
const badgeButtonActiveStyle = { background: "rgba(139, 124, 246, 0.35)", borderColor: "#8b7cf6", color: "#f3f4f6" };
const badgeButtonInactiveStyle = { background: "#1f2937", borderColor: "#374151", color: "#cbd5e1" };
const infoIconStyle = { fontSize: 12, color: "#93c5fd", cursor: "help" };