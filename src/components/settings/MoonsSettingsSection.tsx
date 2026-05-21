import { addMoon, createDefaultMoon, deleteMoon, getMoonPhaseForDate, normalizeMoon, updateMoon } from "../../calendar/moonLogic";
import { parseWeatherInput } from "../../calendar/seasonsLogic";
import type { CalendarProject } from "../../domain/types";
import { useEffect, useState } from "react";
import { t } from "../../i18n/messages";

type Props = {
  project: CalendarProject;
  onProjectUpdate: (project: CalendarProject) => void;
  inputStyle: React.CSSProperties;
};

export const MoonsSettingsSection = ({ project, onProjectUpdate, inputStyle }: Props) => (
  <>
    <button type="button" onClick={() => onProjectUpdate(addMoon(project, createDefaultMoon(project.locale)))} style={buttonStyle}>
      {t(project.locale, "moons.add")}
    </button>
    {project.moons.length === 0 ? (
      <div style={{ marginTop: 8, fontSize: 12, color: "#9ca3af" }}>{t(project.locale, "moons.empty")}</div>
    ) : (
      <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
        {project.moons.map((moon) => {
          const phase = getMoonPhaseForDate(normalizeMoon(moon), project.currentTime.absoluteDay);
          return (
            <div key={moon.id} style={{ border: "1px solid #374151", borderRadius: 8, padding: 8 }}>
              <label style={{ display: "block" }}>
                <div style={labelStyle}>{t(project.locale, "moons.name")}</div>
                <input value={moon.name} onChange={(e) => onProjectUpdate(updateMoon(project, moon.id, { name: e.target.value }))} style={inputStyle} />
              </label>
              <label style={{ display: "block" }}>
                <div style={labelStyle}>{t(project.locale, "moons.icon")}</div>
                <input value={moon.icon ?? ""} onChange={(e) => onProjectUpdate(updateMoon(project, moon.id, { icon: e.target.value }))} style={inputStyle} />
              </label>
              <label style={{ display: "block" }}>
                <div style={labelStyle}>{t(project.locale, "moons.cycleLengthDays")}</div>
                <MoonNumberInput
                  value={moon.cycleLengthDays}
                  inputStyle={inputStyle}
                  onChange={(value) => onProjectUpdate(updateMoon(project, moon.id, { cycleLengthDays: value }))}
                />
              </label>
              <label style={{ display: "block" }}>
                <div style={labelStyle}>{t(project.locale, "moons.cycleOffsetDays")}</div>
                <MoonNumberInput
                  value={moon.cycleOffsetDays ?? 0}
                  inputStyle={inputStyle}
                  onChange={(value) => onProjectUpdate(updateMoon(project, moon.id, { cycleOffsetDays: value }))}
                />
              </label>
              <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 8 }}>
                {t(project.locale, "moons.currentPhase")}: {phase.icon} {moon.name} — {t(project.locale, `moon.phase.${phase.id}`)} — {phase.illumination} %
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>
                {t(project.locale, "moons.fullCycle")}: 🌑 {t(project.locale, "moon.phase.new")} · 🌒 {t(project.locale, "moon.phase.waxingCrescent")} · 🌓 {t(project.locale, "moon.phase.firstQuarter")} · 🌔 {t(project.locale, "moon.phase.waxingGibbous")} · 🌕 {t(project.locale, "moon.phase.full")} · 🌖 {t(project.locale, "moon.phase.waningGibbous")} · 🌗 {t(project.locale, "moon.phase.lastQuarter")} · 🌘 {t(project.locale, "moon.phase.waningCrescent")}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!confirm(t(project.locale, "moons.confirmDelete"))) return;
                  onProjectUpdate(deleteMoon(project, moon.id));
                }}
                style={smallButtonStyle}
              >
                {t(project.locale, "moons.delete")}
              </button>
            </div>
          );
        })}
      </div>
    )}
  </>
);

const labelStyle = { fontSize: 12, color: "#cbd5e1" };
const buttonStyle = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "6px 10px", cursor: "pointer" };
const smallButtonStyle = { ...buttonStyle, fontSize: 12, padding: "5px 8px" };

const MoonNumberInput = ({
  value,
  inputStyle,
  onChange
}: {
  value: number;
  inputStyle: React.CSSProperties;
  onChange: (value: number) => void;
}) => {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      onChange={(e) => {
        const nextDraft = e.target.value;
        setDraft(nextDraft);
        const parsed = parseWeatherInput(nextDraft);
        if (parsed === null) return;
        onChange(parsed);
      }}
      style={inputStyle}
    />
  );
};