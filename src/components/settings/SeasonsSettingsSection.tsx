import { createDefaultSeason, createDefaultSeasonWeatherProfile, deleteSeason, parseWeatherInput, sortSeasonsByStartDate, updateSeason } from "../../calendar/seasonsLogic";
import { useEffect, useState } from "react";
import { getWeatherUnitLabels } from "../../calendar/weatherUnits";
import type { CalendarProject, Season } from "../../domain/types";
import { t } from "../../i18n/messages";
import { CollapsibleSection } from "../CollapsibleSection";

export const SeasonsSettingsSection = ({ project, onProjectUpdate, inputStyle }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; inputStyle: React.CSSProperties }) => {
  const seasons = sortSeasonsByStartDate(project, project.seasons);
  const sortedMonths = [...project.calendarSystem.months].sort((a, b) => a.order - b.order);
  const units = getWeatherUnitLabels(project.locale);

  const patchSeason = (season: Season, patch: Partial<Season>) => onProjectUpdate(updateSeason(project, season.id, patch));

  return (
    <>
      {seasons.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 8 }}>{t(project.locale, "seasons.empty")}</div> : null}
      {seasons.map((season) => (
        <CollapsibleSection key={season.id} title={`${season.icon ?? "🍂"} ${season.name}`}>
          <Field label={t(project.locale, "seasons.name")}><input value={season.name} onChange={(e) => patchSeason(season, { name: e.target.value })} style={inputStyle} /></Field>
          <Field label={t(project.locale, "seasons.icon")}><input value={season.icon ?? ""} onChange={(e) => patchSeason(season, { icon: e.target.value })} style={inputStyle} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <Field label={t(project.locale, "seasons.startMonth")}>
              <select value={season.start.monthId} onChange={(e) => patchSeason(season, { start: { ...season.start, monthId: e.target.value } })} style={inputStyle}>
                {sortedMonths.map((month) => <option key={month.id} value={month.id}>{month.name}</option>)}
              </select>
            </Field>
            <Field label={t(project.locale, "seasons.startDay")}><input type="number" min={1} value={season.start.dayOfMonth} onChange={(e) => patchSeason(season, { start: { ...season.start, dayOfMonth: Number(e.target.value) } })} style={inputStyle} /></Field>
            <Field label={t(project.locale, "seasons.endMonth")}>
              <select value={season.end.monthId} onChange={(e) => patchSeason(season, { end: { ...season.end, monthId: e.target.value } })} style={inputStyle}>
                {sortedMonths.map((month) => <option key={month.id} value={month.id}>{month.name}</option>)}
              </select>
            </Field>
            <Field label={t(project.locale, "seasons.endDay")}><input type="number" min={1} value={season.end.dayOfMonth} onChange={(e) => patchSeason(season, { end: { ...season.end, dayOfMonth: Number(e.target.value) } })} style={inputStyle} /></Field>
          </div>
          <CollapsibleSection title={t(project.locale, "seasons.weatherProfile")}>
            {(() => {
              const profile = season.weatherProfile ?? createDefaultSeasonWeatherProfile();
              return (
                <>
                  <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 4 }}>{t(project.locale, "seasons.temperature")} ({units.temperature})</div>
                  <RangeEditor
                    allowNegative
                    locale={project.locale}
                    inputStyle={inputStyle}
                    value={profile.temperature}
                    onChange={(next) => patchSeason(season, { weatherProfile: { ...profile, temperature: next } })}
                  />
                  <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 4 }}>{t(project.locale, "seasons.windSpeed")} ({units.windSpeed})</div>
                  <RangeEditor
                    allowNegative={false}
                    locale={project.locale}
                    inputStyle={inputStyle}
                    value={profile.windSpeed}
                    onChange={(next) => patchSeason(season, { weatherProfile: { ...profile, windSpeed: next } })}
                  />
                  <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 4 }}>{t(project.locale, "seasons.rain")} ({units.rain})</div>
                  <RangeEditor
                    allowNegative={false}
                    locale={project.locale}
                    inputStyle={inputStyle}
                    value={profile.rain}
                    onChange={(next) => patchSeason(season, { weatherProfile: { ...profile, rain: next } })}
                  />
                </>
              );
            })()}
          </CollapsibleSection>
          <Action onClick={() => {
            if (!window.confirm(t(project.locale, "seasons.confirmDelete"))) return;
            onProjectUpdate(deleteSeason(project, season.id));
          }}>{t(project.locale, "seasons.delete")}</Action>
        </CollapsibleSection>
      ))}
      <Action onClick={() => onProjectUpdate({ ...project, seasons: [...project.seasons, createDefaultSeason(project)] })}>{t(project.locale, "seasons.add")}</Action>
    </>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (<label style={{ display: "block" }}><div style={{ fontSize: 12, color: "#cbd5e1" }}>{label}</div>{children}</label>);
const Action = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button type="button" style={{ border: "1px solid #4b5563", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "5px 8px", fontSize: 12 }} {...props}>{children}</button>;

const RangeEditor = ({
  allowNegative = false,
  locale,
  inputStyle,
  value,
  onChange
}: {
  allowNegative?: boolean;
  locale: "fr" | "en";
  inputStyle: React.CSSProperties;
  value: { min: number; max: number; average: number };
  onChange: (next: { min: number; max: number; average: number }) => void;
}) => {
  const [draft, setDraft] = useState({ min: String(value.min), average: String(value.average), max: String(value.max) });

  useEffect(() => {
    setDraft({ min: String(value.min), average: String(value.average), max: String(value.max) });
  }, [value.min, value.average, value.max]);

  const updateDraft = (key: "min" | "average" | "max", raw: string) => {
    const nextDraft = { ...draft, [key]: raw };
    setDraft(nextDraft);
    const parsed = parseWeatherInput(raw);
    if (parsed === null) return;
    const safe = allowNegative ? parsed : Math.max(0, parsed);
    onChange({ ...value, [key]: safe });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
      <Field label={t(locale, "seasons.min")}><input type="text" inputMode="decimal" value={draft.min} onChange={(e) => updateDraft("min", e.target.value)} style={inputStyle} /></Field>
      <Field label={t(locale, "seasons.average")}><input type="text" inputMode="decimal" value={draft.average} onChange={(e) => updateDraft("average", e.target.value)} style={inputStyle} /></Field>
      <Field label={t(locale, "seasons.max")}><input type="text" inputMode="decimal" value={draft.max} onChange={(e) => updateDraft("max", e.target.value)} style={inputStyle} /></Field>
    </div>
  );
};