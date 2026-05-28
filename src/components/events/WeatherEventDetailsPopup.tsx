import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import { conditionSummary } from "./WeatherEventForm";
import { getWeatherEventDurationHours } from "../../calendar/weatherEventsLogic";
import type { CalendarProject, WeatherEvent, WeatherEventEffect } from "../../domain/types";
import { t } from "../../i18n/messages";
import { sendPopupNotification } from "../../obr/popupNotifications";
import { Badge, SecondaryButton } from "../ui";

const formatVisibility = (project: CalendarProject, visibility: WeatherEvent["visibility"] = "gm") => {
  if (visibility === "players") return t(project.locale, "weatherEvents.visibilityPlayers");
  if (visibility === "revealOnTrigger") return t(project.locale, "weatherEvents.visibilityRevealOnTrigger");
  return t(project.locale, "weatherEvents.visibilityGm");
};

const formatDuration = (project: CalendarProject, event: WeatherEvent): string | undefined => {
  const durationHours = getWeatherEventDurationHours(event);
  if (typeof durationHours !== "number") return undefined;
  return t(project.locale, "weatherEvents.durationBadge").replace("{count}", String(durationHours));
};

const getWeatherEventTimeLabel = (project: CalendarProject, event: WeatherEvent): string => {
  const durationHours = getWeatherEventDurationHours(event);
  if (typeof durationHours === "number") return t(project.locale, "weatherEvents.durationShort").replace("{count}", String(durationHours));
  return t(project.locale, "weatherEvents.activeNow");
};

const getCurrentDateLabel = (project: CalendarProject): string => {
  const date = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  return `${date.weekdayName ?? ""} ${date.dayOfMonth} ${date.monthName} ${date.year}`.trim();
};

const sendWeatherEventToPlayers = (project: CalendarProject, event: WeatherEvent) => {
  sendPopupNotification({
    type: "weather",
    audience: "players",
    title: event.name,
    body: event.playerDescription?.trim() || event.summary || event.name,
    date: getCurrentDateLabel(project),
    icon: event.icon,
    summary: event.summary,
    playerDescription: event.playerDescription,
    timeLabel: getWeatherEventTimeLabel(project, event)
  });
};

const getEffectLines = (project: CalendarProject, effect: WeatherEventEffect | undefined): string[] => {
  if (!effect) return [];
  const lines: string[] = [];
  if (effect.state) lines.push(`${t(project.locale, "weatherEvents.effectState")}: ${t(project.locale, `weather.state.${effect.state}`)}`);
  if (effect.dominantState) lines.push(`${t(project.locale, "weatherEvents.effectDominantState")}: ${t(project.locale, `weather.state.${effect.dominantState}`)}`);
  if (typeof effect.temperature === "number") lines.push(`${t(project.locale, "weatherEvents.effectTemperature")}: ${effect.temperature}`);
  if (typeof effect.dailyMinTemperature === "number") lines.push(`${t(project.locale, "weatherEvents.effectDailyMinTemperature")}: ${effect.dailyMinTemperature}`);
  if (typeof effect.dailyMaxTemperature === "number") lines.push(`${t(project.locale, "weatherEvents.effectDailyMaxTemperature")}: ${effect.dailyMaxTemperature}`);
  if (typeof effect.rain === "number") lines.push(`${t(project.locale, "weatherEvents.effectRain")}: ${effect.rain}`);
  if (typeof effect.dailyRainTotal === "number") lines.push(`${t(project.locale, "weatherEvents.effectDailyRainTotal")}: ${effect.dailyRainTotal}`);
  if (typeof effect.windSpeed === "number") lines.push(`${t(project.locale, "weatherEvents.effectWindSpeed")}: ${effect.windSpeed}`);
  if (effect.windDirection) lines.push(`${t(project.locale, "weatherEvents.effectWindDirection")}: ${effect.windDirection}`);
  if (effect.trendKind) lines.push(`${t(project.locale, "weatherEvents.effectTrendKind")}: ${t(project.locale, `weather.trend.${effect.trendKind}`)}`);
  return lines;
};

const fieldBoxStyle = { fontSize: 12, border: "1px solid #374151", borderRadius: 6, background: "#0f172a", padding: 6 };
const boxTitleStyle = { fontWeight: 700, marginBottom: 4 };
const textStyle = { whiteSpace: "pre-wrap" as const, color: "#d1d5db" };

export const WeatherEventDetailsPopup = ({ project, event, onClose }: { project: CalendarProject; event: WeatherEvent; onClose: () => void }) => {
  const kind = event.kind ?? "informational";
  const triggerChance = Math.max(0, Math.min(100, Math.round(event.triggerChancePercent ?? 100)));
  const duration = formatDuration(project, event);
  const effectLines = getEffectLines(project, event.effect);
  const conditions = event.conditions ?? [];
  const history = (event.triggerHistory ?? []).slice(-5).reverse();

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 380, maxHeight: "85vh", overflow: "auto", border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span>{event.icon ?? "🌩️"}</span>
            <strong style={{ lineHeight: 1.2, overflowWrap: "anywhere" }}>{event.name}</strong>
          </div>
          <button type="button" onClick={onClose} title={t(project.locale, "month.closeDayDetails")} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb", fontSize: 18, lineHeight: 1, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          <Badge>{t(project.locale, "weatherEvents.detailsTitle")}</Badge>
          <Badge>{kind === "weatherEffect" ? t(project.locale, "weatherEvents.kindWeatherEffect") : t(project.locale, "weatherEvents.kindInformational")}</Badge>
          <Badge>{t(project.locale, "weatherEvents.visibility")}: {formatVisibility(project, event.visibility)}</Badge>
          <Badge>{event.enabled !== false ? t(project.locale, "weatherEvents.enabled") : t(project.locale, "weatherEvents.disabled")}</Badge>
          {triggerChance !== 100 ? <Badge>{t(project.locale, "weatherEvents.triggerChanceBadge").replace("{count}", String(triggerChance))}</Badge> : null}
          {duration ? <Badge>{duration}</Badge> : null}
          {typeof event.cooldownHours === "number" ? <Badge>{t(project.locale, "weatherEvents.cooldownBadge").replace("{count}", String(event.cooldownHours))}</Badge> : null}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {event.summary ? <div style={fieldBoxStyle}><div style={boxTitleStyle}>{t(project.locale, "weatherEvents.summary")}</div><div style={textStyle}>{event.summary}</div></div> : null}
          <div style={fieldBoxStyle}><div style={boxTitleStyle}>{t(project.locale, "weatherEvents.playerDescription")}</div><div style={textStyle}>{event.playerDescription?.trim() || t(project.locale, "weatherEvents.noPlayerDescription")}</div></div>
          <div style={fieldBoxStyle}><div style={boxTitleStyle}>{t(project.locale, "weatherEvents.gmDescription")}</div><div style={textStyle}>{event.gmDescription?.trim() || t(project.locale, "weatherEvents.noGmDescription")}</div></div>
          {event.link?.trim() ? <a href={event.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#93c5fd" }}>{t(project.locale, "common.openLink")}</a> : null}

          <div style={fieldBoxStyle}>
            <div style={boxTitleStyle}>{t(project.locale, "weatherEvents.conditions")}</div>
            {conditions.length === 0 ? <div style={textStyle}>{t(project.locale, "weatherEvents.noConditions")}</div> : <div style={{ display: "grid", gap: 4 }}>{conditions.map((condition, index) => <div key={`${condition.type ?? "metric"}-${index}`} style={textStyle}>• {conditionSummary(project, condition)}</div>)}</div>}
          </div>

          {kind === "weatherEffect" ? <div style={fieldBoxStyle}>
            <div style={boxTitleStyle}>{t(project.locale, "weatherEvents.effectSection")}</div>
            {effectLines.length === 0 ? <div style={textStyle}>{t(project.locale, "weatherEvents.noEffect")}</div> : <div style={{ display: "grid", gap: 4 }}>{effectLines.map((line) => <div key={line} style={textStyle}>• {line}</div>)}</div>}
          </div> : null}

          <div style={fieldBoxStyle}>
            <div style={boxTitleStyle}>{t(project.locale, "weatherEvents.history")}</div>
            {history.length === 0 ? <div style={textStyle}>{t(project.locale, "weatherEvents.noHistory")}</div> : <div style={{ display: "grid", gap: 4 }}>{history.map((entry) => <div key={entry.id} style={textStyle}>• {t(project.locale, "weatherEvents.historyAt")} {entry.triggeredAtMinutes}{entry.weatherState ? ` · ${t(project.locale, `weather.state.${entry.weatherState}`)}` : ""}{typeof entry.temperature === "number" ? ` · T:${entry.temperature}` : ""}{typeof entry.rain === "number" ? ` · R:${entry.rain}` : ""}{typeof entry.windSpeed === "number" ? ` · W:${entry.windSpeed}` : ""}</div>)}</div>}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 10 }}>
          <SecondaryButton type="button" onClick={() => sendWeatherEventToPlayers(project, event)}>{t(project.locale, "common.send")}</SecondaryButton>
          <SecondaryButton type="button" onClick={onClose}>{t(project.locale, "month.closeDayDetails")}</SecondaryButton>
        </div>
      </div>
    </div>
  );
};
