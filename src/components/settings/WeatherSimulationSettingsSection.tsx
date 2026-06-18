import { useMemo, useState } from "react";
import { getAdventureContextLabel, normalizeAdventureContext } from "../../calendar/adventureContext";
import { runWeatherSimulation, weatherSimulationToCsv, type WeatherSimulationResult } from "../../calendar/weatherSimulation";
import { WEATHER_BIOME_DEFINITIONS, getWeatherBiomeDefinition, type WeatherBiomeId } from "../../calendar/weather/biomes";
import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";

const downloadText = (filename: string, contents: string, type: string) => {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const WeatherSimulationSettingsSection = ({ project, inputStyle }: { project: CalendarProject; inputStyle: React.CSSProperties }) => {
  const adventureContext = normalizeAdventureContext(project.adventureContext);
  const yearDays = useMemo(() => project.calendarSystem.months.reduce((total, month) => total + Math.max(0, month.days), 0) || 365, [project.calendarSystem.months]);
  const [durationDays, setDurationDays] = useState<number>(yearDays);
  const [startAbsoluteDay, setStartAbsoluteDay] = useState<number>(project.currentTime.absoluteDay);
  const [biomeId, setBiomeId] = useState<WeatherBiomeId>(project.weatherBiome?.currentBiomeId ?? "temperate");
  const [activeContextIds, setActiveContextIds] = useState<string[]>(adventureContext.activeContextIds);
  const [seed, setSeed] = useState<string>(project.weatherSettings.seed ?? "");
  const [result, setResult] = useState<WeatherSimulationResult | null>(null);

  const run = () => setResult(runWeatherSimulation(project, { startAbsoluteDay, durationDays, biomeId, activeContextIds, seed }));
  const filenameBase = `weather-simulation-${project.id}-${Date.now()}`;
  const summary = result?.summary;

  return <div style={{ display: "grid", gap: 8 }}>
    <label style={fieldStyle}>
      <span style={labelStyle}>{t(project.locale, "weatherSimulation.duration")}</span>
      <input type="number" min={1} max={3660} value={durationDays} onChange={(event) => setDurationDays(Math.max(1, Math.trunc(Number(event.target.value) || 1)))} style={inputStyle} />
    </label>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <button type="button" style={buttonStyle} onClick={() => setDurationDays(30)}>{t(project.locale, "weatherSimulation.durationMonth")}</button>
      <button type="button" style={buttonStyle} onClick={() => setDurationDays(Math.max(1, Math.round(yearDays / Math.max(1, project.seasons.length || 4))))}>{t(project.locale, "weatherSimulation.durationSeason")}</button>
      <button type="button" style={buttonStyle} onClick={() => setDurationDays(yearDays)}>{t(project.locale, "weatherSimulation.durationYear")}</button>
    </div>
    <label style={fieldStyle}>
      <span style={labelStyle}>{t(project.locale, "weatherSimulation.startDay")}</span>
      <input type="number" value={startAbsoluteDay} onChange={(event) => setStartAbsoluteDay(Math.trunc(Number(event.target.value) || 0))} style={inputStyle} />
    </label>
    <label style={fieldStyle}>
      <span style={labelStyle}>{t(project.locale, "weatherSimulation.biome")}</span>
      <select value={biomeId} onChange={(event) => setBiomeId(event.target.value as WeatherBiomeId)} style={inputStyle}>
        {WEATHER_BIOME_DEFINITIONS.map((definition) => <option key={definition.id} value={definition.id}>{definition.icon} {t(project.locale, definition.nameKey)}</option>)}
      </select>
    </label>
    <label style={fieldStyle}>
      <span style={labelStyle}>{t(project.locale, "weatherSimulation.seed")}</span>
      <input value={seed} onChange={(event) => setSeed(event.target.value)} placeholder={project.weatherSettings.seed ?? project.id} style={inputStyle} />
    </label>
    <div style={labelStyle}>{t(project.locale, "weatherSimulation.contexts")}</div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {adventureContext.availableContexts.filter((context) => context.enabled).map((context) => {
        const selected = activeContextIds.includes(context.id);
        return <button key={context.id} type="button" title={context.description?.[project.locale]} onClick={() => setActiveContextIds((prev) => selected ? prev.filter((id) => id !== context.id) : [...prev, context.id])} style={{ ...tagStyle, borderColor: selected ? "#8b7cf6" : "#374151", background: selected ? "rgba(139,124,246,0.35)" : "#1f2937" }}>{context.icon} {getAdventureContextLabel(context, project.locale)}</button>;
      })}
    </div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <button type="button" style={buttonStyle} onClick={run}>{t(project.locale, "weatherSimulation.run")}</button>
      <button type="button" style={buttonStyle} disabled={!result} onClick={() => result && downloadText(`${filenameBase}.json`, JSON.stringify(result, null, 2), "application/json")}>{t(project.locale, "weatherSimulation.exportJson")}</button>
      <button type="button" style={buttonStyle} disabled={!result} onClick={() => result && downloadText(`${filenameBase}.csv`, weatherSimulationToCsv(result), "text/csv;charset=utf-8")}>{t(project.locale, "weatherSimulation.exportCsv")}</button>
    </div>
    {summary ? <div style={summaryStyle}>
      <strong>{t(project.locale, "weatherSimulation.summary")}</strong>
      <div>{summary.daysSimulated} {t(project.locale, "weatherSimulation.days")} · {summary.totalHours} {t(project.locale, "weatherSimulation.hours")}</div>
      <div>{t(project.locale, "weatherSimulation.rainHours")}: {summary.rainHours} · {t(project.locale, "weatherSimulation.snowHours")}: {summary.snowHours} · {t(project.locale, "weatherSimulation.fogHours")}: {summary.fogHours}</div>
      <div>{t(project.locale, "weatherSimulation.stormHours")}: {summary.stormHours} · {t(project.locale, "weatherSimulation.strongWindHours")}: {summary.strongWindHours} · {t(project.locale, "weatherSimulation.tempestHours")}: {summary.tempestHours}</div>
      <div>{t(project.locale, "weatherSimulation.dryDays")}: {summary.dryDays} · {t(project.locale, "weatherSimulation.rainyDays")}: {summary.rainyDays} · {t(project.locale, "weatherSimulation.snowyDays")}: {summary.snowyDays}</div>
      <div>{t(project.locale, "weatherSimulation.biome")}: {t(project.locale, getWeatherBiomeDefinition(result.options.biomeId).nameKey)}</div>
    </div> : null}
  </div>;
};

const fieldStyle: React.CSSProperties = { display: "grid", gap: 3 };
const labelStyle: React.CSSProperties = { fontSize: 12, color: "#cbd5e1" };
const buttonStyle: React.CSSProperties = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "6px 10px", cursor: "pointer", fontSize: 12 };
const tagStyle: React.CSSProperties = { border: "1px solid #374151", borderRadius: 999, color: "#e5e7eb", padding: "4px 8px", cursor: "pointer", fontSize: 11 };
const summaryStyle: React.CSSProperties = { border: "1px solid #374151", borderRadius: 8, background: "#111827", color: "#d1d5db", padding: 8, fontSize: 12, display: "grid", gap: 4 };
