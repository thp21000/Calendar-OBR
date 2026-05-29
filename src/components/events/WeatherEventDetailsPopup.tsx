import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import { conditionSummary } from "./WeatherEventForm";
import { getWeatherEventDiagnostics, getWeatherEventDurationHours, getWeatherEventUpcomingTriggerWindows, type WeatherEventUpcomingTriggerWindow } from "../../calendar/weatherEventsLogic";
import { getCurrentWeather } from "../../calendar/weatherLogic";
import type { CalendarProject, WeatherEvent, WeatherEventEffect } from "../../domain/types";
import { t } from "../../i18n/messages";
import { sendPopupNotification } from "../../obr/popupNotifications";
import { Badge, CollapsibleDetailSection, SecondaryButton } from "../ui";

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

const formatTime = (time: { hour: number; minute: number }): string =>
  `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;

const formatDate = (project: CalendarProject, time: { absoluteDay: number; hour: number; minute: number }): string => {
  const date = absoluteDayToCalendarDate(time, project.calendarSystem);
  return `${date.dayOfMonth} ${date.monthName} ${date.year}`;
};

const formatWindow = (project: CalendarProject, window: WeatherEventUpcomingTriggerWindow): string =>
  window.startTime.absoluteDay === window.endTime.absoluteDay
    ? `${formatDate(project, window.startTime)} — ${formatTime(window.startTime)}–${formatTime(window.endTime)}`
    : `${formatDate(project, window.startTime)} ${formatTime(window.startTime)} → ${formatDate(project, window.endTime)} ${formatTime(window.endTime)}`;

const formatCountMeta = (project: CalendarProject, key: string, count: number, emptyKey = "common.none"): string =>
  count === 0 ? t(project.locale, emptyKey) : t(project.locale, key).replace("{count}", String(count));

const getDiagnosticMeta = (project: CalendarProject, diagnostics: ReturnType<typeof getWeatherEventDiagnostics> | undefined): string => {
  if (!diagnostics) return t(project.locale, "weatherEvents.diagnosticUnavailableShort");
  if (diagnostics.isCurrentlyTriggerable) return t(project.locale, "weatherEvents.diagnosticTriggerableShort");
  return t(project.locale, "weatherEvents.diagnosticBlockedShort");
};

const formatWeatherHistoryDate = (project: CalendarProject, triggeredAtMinutes: number): string => {
  const absoluteDay = Math.floor(triggeredAtMinutes / 1440);
  const minuteOfDay = ((triggeredAtMinutes % 1440) + 1440) % 1440;
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const date = absoluteDayToCalendarDate({ absoluteDay, hour, minute }, project.calendarSystem);
  const timeLabel = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const dateLabel = `${date.weekdayName ?? ""} ${date.dayOfMonth} ${date.monthName} ${date.year}`.trim();
  return `${dateLabel} — ${timeLabel}`;
};
const textStyle = { whiteSpace: "pre-wrap" as const, color: "#d1d5db" };

export const WeatherEventDetailsPopup = ({ project, event, onClose }: { project: CalendarProject; event: WeatherEvent; onClose: () => void }) => {
  const kind = event.kind ?? "informational";
  const triggerChance = Math.max(0, Math.min(100, Math.round(event.triggerChancePercent ?? 100)));
  const duration = formatDuration(project, event);
  const effectLines = getEffectLines(project, event.effect);
  const conditions = event.conditions ?? [];
  const history = (event.triggerHistory ?? []).slice(-5).reverse();
  const currentWeather = getCurrentWeather(project);
  const diagnostics = currentWeather ? getWeatherEventDiagnostics(project, event, project.currentTime, currentWeather) : undefined;
  const upcomingWindows = getWeatherEventUpcomingTriggerWindows(project, event, project.currentTime, 48);
  const currentWeatherSummary = currentWeather
    ? [
        currentWeather.state ? `${t(project.locale, "weatherEvents.state")}: ${t(project.locale, `weather.state.${currentWeather.state}`)}` : undefined,
        `${t(project.locale, "weatherEvents.metricTemperature")}: ${currentWeather.temperature}`,
        `${t(project.locale, "weatherEvents.metricRain")}: ${currentWeather.rain}`,
        `${t(project.locale, "weatherEvents.metricWindSpeed")}: ${currentWeather.windSpeed}`,
        currentWeather.windDirection ? `${t(project.locale, "weatherEvents.windDirection")}: ${currentWeather.windDirection}` : undefined,
        currentWeather.dominantState ? `${t(project.locale, "weatherEvents.dominantState")}: ${t(project.locale, `weather.state.${currentWeather.dominantState}`)}` : undefined,
        currentWeather.trendKind ? `${t(project.locale, "weather.trend")}: ${t(project.locale, `weather.trend.${currentWeather.trendKind}`)}` : undefined
      ].filter(Boolean).join(" · ")
    : undefined;

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
          {event.summary ? (
            <CollapsibleDetailSection title={t(project.locale, "weatherEvents.summary")}>
              <div style={textStyle}>{event.summary}</div>
            </CollapsibleDetailSection>
          ) : null}
          <CollapsibleDetailSection title={t(project.locale, "weatherEvents.playerDescription")} empty={!event.playerDescription?.trim()} meta={!event.playerDescription?.trim() ? t(project.locale, "common.empty") : undefined}>
            <div style={textStyle}>{event.playerDescription?.trim() || t(project.locale, "weatherEvents.noPlayerDescription")}</div>
          </CollapsibleDetailSection>
          <CollapsibleDetailSection title={t(project.locale, "weatherEvents.gmDescription")} empty={!event.gmDescription?.trim()} tone="gm" meta={event.gmDescription?.trim() ? t(project.locale, "common.gm") : t(project.locale, "common.empty")}>
            <div style={textStyle}>{event.gmDescription?.trim() || t(project.locale, "weatherEvents.noGmDescription")}</div>
          </CollapsibleDetailSection>
          {event.link?.trim() ? <a href={event.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#93c5fd" }}>{t(project.locale, "common.openLink")}</a> : null}

          <CollapsibleDetailSection title={t(project.locale, "weatherEvents.diagnostics")} empty={!diagnostics} tone={diagnostics?.isCurrentlyTriggerable ? "success" : "warning"} meta={getDiagnosticMeta(project, diagnostics)}>
            {diagnostics ? (
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <Badge tone={diagnostics.isCurrentlyTriggerable ? "success" : "warning"}>
                    {diagnostics.isCurrentlyTriggerable ? t(project.locale, "weatherEvents.canTriggerNow") : t(project.locale, "weatherEvents.cannotTriggerNow")}
                  </Badge>
                  {diagnostics.blockedByStatus || !diagnostics.enabled ? <Badge>{t(project.locale, "weatherEvents.blockedByStatus")}</Badge> : null}
                  {diagnostics.blockedByCooldown ? <Badge>{t(project.locale, "weatherEvents.blockedByCooldown")}</Badge> : null}
                  {diagnostics.alreadyActive ? <Badge>{t(project.locale, "weatherEvents.alreadyActive")}</Badge> : null}
                </div>
                {currentWeatherSummary ? <div style={textStyle}>{currentWeatherSummary}</div> : null}
                <div style={textStyle}>{t(project.locale, "weatherEvents.triggerChance")}: {diagnostics.triggerChancePercent} %</div>
                <div style={textStyle}>{t(project.locale, "weatherEvents.effectiveDuration")}: {typeof diagnostics.durationHours === "number" ? t(project.locale, "weatherEvents.durationShort").replace("{count}", String(diagnostics.durationHours)) : t(project.locale, "weatherEvents.activeNow")}</div>
                <div style={textStyle}>{t(project.locale, "weatherEvents.lastTriggeredAtMinutes")}: {typeof diagnostics.lastTriggeredAtMinutes === "number" ? formatWeatherHistoryDate(project, diagnostics.lastTriggeredAtMinutes) : t(project.locale, "weatherEvents.neverTriggered")}</div>
                {typeof diagnostics.cooldownHours === "number" ? <div style={textStyle}>{t(project.locale, "weatherEvents.cooldownHours")}: {t(project.locale, "weatherEvents.durationShort").replace("{count}", String(diagnostics.cooldownHours))}</div> : null}
                <div style={{ display: "grid", gap: 4 }}>
                  {diagnostics.conditions.length === 0 ? <div style={textStyle}>{t(project.locale, "weatherEvents.noConditions")}</div> : diagnostics.conditions.map(({ condition, met }, index) => (
                    <div key={`${condition.type ?? "metric"}-diagnostic-${index}`} style={textStyle}>
                      {met ? "✅" : "❌"} {conditionSummary(project, condition)} — {met ? t(project.locale, "weatherEvents.conditionMet") : t(project.locale, "weatherEvents.conditionNotMet")}
                    </div>
                  ))}
                </div>
              </div>
            ) : <div style={textStyle}>{t(project.locale, "weatherEvents.noCurrentWeather")}</div>}
          </CollapsibleDetailSection>

          <CollapsibleDetailSection title={t(project.locale, "weatherEvents.upcomingWindows")} empty={upcomingWindows.length === 0} meta={formatCountMeta(project, "common.windowsCount", upcomingWindows.length)}>
            <div style={{ ...textStyle, fontSize: 11, marginBottom: 6 }}>{t(project.locale, "weatherEvents.upcomingWindowsHelp")}</div>
            {upcomingWindows.length === 0 ? (
              <div style={textStyle}>{t(project.locale, "weatherEvents.noUpcomingWindows")}</div>
            ) : (
              <div style={{ display: "grid", gap: 4 }}>
                {upcomingWindows.map((window) => {
                  const durationLabel = t(project.locale, "weatherEvents.windowDuration").replace("{count}", String(window.durationHours));
                  const conditionsLabel = t(project.locale, "weatherEvents.windowConditions")
                    .replace("{met}", String(window.matchedConditionsCount))
                    .replace("{total}", String(window.totalConditionsCount));
                  const timeLabel = formatWindow(project, window);
                  return <div key={`${window.startTime.absoluteDay}-${window.startTime.hour}-${window.endTime.absoluteDay}-${window.endTime.hour}`} style={textStyle}>• {timeLabel} — {durationLabel} · {conditionsLabel}</div>;
                })}
              </div>
            )}
          </CollapsibleDetailSection>

          <CollapsibleDetailSection title={t(project.locale, "weatherEvents.conditions")} empty={conditions.length === 0} meta={formatCountMeta(project, "common.conditionsCount", conditions.length)}>
            {conditions.length === 0 ? <div style={textStyle}>{t(project.locale, "weatherEvents.noConditions")}</div> : <div style={{ display: "grid", gap: 4 }}>{conditions.map((condition, index) => <div key={`${condition.type ?? "metric"}-${index}`} style={textStyle}>• {conditionSummary(project, condition)}</div>)}</div>}
          </CollapsibleDetailSection>

          {kind === "weatherEffect" ? (
            <CollapsibleDetailSection title={t(project.locale, "weatherEvents.effectSection")} empty={effectLines.length === 0} meta={formatCountMeta(project, "common.effectsCount", effectLines.length)}>
              {effectLines.length === 0 ? <div style={textStyle}>{t(project.locale, "weatherEvents.noEffect")}</div> : <div style={{ display: "grid", gap: 4 }}>{effectLines.map((line) => <div key={line} style={textStyle}>• {line}</div>)}</div>}
            </CollapsibleDetailSection>
          ) : null}

          <CollapsibleDetailSection title={t(project.locale, "weatherEvents.history")} empty={history.length === 0} meta={formatCountMeta(project, "common.entriesCount", history.length, "common.empty")}>
            {history.length === 0 ? <div style={textStyle}>{t(project.locale, "weatherEvents.noHistory")}</div> : <div style={{ display: "grid", gap: 4 }}>{history.map((entry) => <div key={entry.id} style={textStyle}>• {formatWeatherHistoryDate(project, entry.triggeredAtMinutes)}{entry.weatherState ? ` · ${t(project.locale, `weather.state.${entry.weatherState}`)}` : ""}{typeof entry.temperature === "number" ? ` · T:${entry.temperature}` : ""}{typeof entry.rain === "number" ? ` · R:${entry.rain}` : ""}{typeof entry.windSpeed === "number" ? ` · W:${entry.windSpeed}` : ""}</div>)}</div>}
          </CollapsibleDetailSection>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 10 }}>
          <SecondaryButton type="button" onClick={() => sendWeatherEventToPlayers(project, event)}>{t(project.locale, "common.send")}</SecondaryButton>
          <SecondaryButton type="button" onClick={onClose}>{t(project.locale, "month.closeDayDetails")}</SecondaryButton>
        </div>
      </div>
    </div>
  );
};
