import { useState } from "react";
import { getAdventureContextLabel, normalizeAdventureContext, setPrimaryAdventureContext, setSecondaryAdventureContexts } from "../../calendar/adventureContext";
import type { AdventureContextCategory, CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { SecondaryButton } from "../ui";
import { ui } from "../ui/styles";

const categories: AdventureContextCategory[] = ["location", "activity", "kingmaker"];

export const AdventureContextPickerPopup = ({ project, onClose, onApply }: { project: CalendarProject; onClose: () => void; onApply: (project: CalendarProject) => void }) => {
  const state = normalizeAdventureContext(project.adventureContext);
  const [primaryContextId, setPrimaryContextId] = useState<string>(state.primaryContextId ?? "");
  const [secondaryContextIds, setSecondaryContextIds] = useState<string[]>(state.secondaryContextIds);

  const apply = () => {
    const withPrimary = setPrimaryAdventureContext(project, primaryContextId || null);
    onApply(setSecondaryAdventureContexts(withPrimary, secondaryContextIds));
    onClose();
  };

  return (
    <div style={backdropStyle} role="dialog" aria-modal="true" aria-label={t(project.locale, "adventureContext.title")}>
      <div style={modalStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>{t(project.locale, "adventureContext.title")}</h2>
          <button type="button" onClick={onClose} style={closeButtonStyle}>×</button>
        </div>
        <label style={fieldStyle}>
          <span style={labelStyle}>{t(project.locale, "adventureContext.primary")}</span>
          <select value={primaryContextId} onChange={(event) => setPrimaryContextId(event.target.value)} style={inputStyle}>
            <option value="">{t(project.locale, "adventureContext.none")}</option>
            {state.availableContexts.filter((context) => context.enabled).map((context) => <option key={context.id} value={context.id}>{context.icon} {getAdventureContextLabel(context, project.locale)}</option>)}
          </select>
        </label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <SecondaryButton type="button" onClick={() => setPrimaryContextId("")}>{t(project.locale, "adventureContext.clearPrimary")}</SecondaryButton>
          <SecondaryButton type="button" onClick={() => setSecondaryContextIds([])}>{t(project.locale, "adventureContext.clearSecondary")}</SecondaryButton>
        </div>
        {categories.map((category) => {
          const contexts = state.availableContexts.filter((context) => context.enabled && context.category === category);
          return <section key={category} style={categoryStyle}>
            <h3 style={categoryTitleStyle}>{t(project.locale, `adventureContext.category.${category}`)}</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {contexts.map((context) => {
                const checked = secondaryContextIds.includes(context.id);
                return <label key={context.id} title={context.description?.[project.locale]} style={{ ...tagStyle, borderColor: checked ? ui.colors.accent : ui.colors.border, background: checked ? "rgba(59,130,246,0.18)" : ui.colors.surface }}>
                  <input type="checkbox" checked={checked} disabled={context.id === primaryContextId} onChange={(event) => {
                    const next = new Set(secondaryContextIds);
                    if (event.target.checked) next.add(context.id);
                    else next.delete(context.id);
                    next.delete(primaryContextId);
                    setSecondaryContextIds([...next]);
                  }} />
                  <span>{context.icon} {getAdventureContextLabel(context, project.locale)}</span>
                </label>;
              })}
            </div>
          </section>;
        })}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <SecondaryButton type="button" onClick={onClose}>{t(project.locale, "events.cancel")}</SecondaryButton>
          <SecondaryButton type="button" onClick={apply}>{t(project.locale, "common.apply")}</SecondaryButton>
        </div>
      </div>
    </div>
  );
};

const backdropStyle: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(2,6,23,0.7)", zIndex: 60, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 12, overflowY: "auto" };
const modalStyle: React.CSSProperties = { width: "min(620px, 100%)", background: ui.colors.surfaceElevated, border: `1px solid ${ui.colors.border}`, borderRadius: ui.radius.lg, padding: ui.spacing.md, display: "grid", gap: 10, color: ui.colors.textPrimary };
const closeButtonStyle: React.CSSProperties = { border: 0, background: "transparent", color: ui.colors.textSecondary, cursor: "pointer", fontSize: 22 };
const fieldStyle: React.CSSProperties = { display: "grid", gap: 4 };
const labelStyle: React.CSSProperties = { fontSize: 12, color: ui.colors.textSecondary };
const inputStyle: React.CSSProperties = { background: ui.colors.surface, border: `1px solid ${ui.colors.border}`, color: ui.colors.textPrimary, borderRadius: ui.radius.md, padding: "7px 8px" };
const categoryStyle: React.CSSProperties = { border: `1px solid ${ui.colors.border}`, borderRadius: ui.radius.md, padding: ui.spacing.sm, display: "grid", gap: 8 };
const categoryTitleStyle: React.CSSProperties = { margin: 0, fontSize: 13 };
const tagStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, border: `1px solid ${ui.colors.border}`, borderRadius: 999, padding: "4px 8px", fontSize: 12, cursor: "pointer" };
