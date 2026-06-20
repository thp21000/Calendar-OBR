import { useEffect, useState } from "react";
import { addMinutes, absoluteDayToCalendarDate } from "../calendar/dateEngine";
import { applyEventCompletionActions, getCompletedEventsBetween, getEventsForCurrentDay, getReminderEventsBetween, getTriggeredEventsBetween, updateCalendarEvent } from "../calendar/eventsLogic";
import { formatDisplayDate } from "../calendar/formatDisplayDate";
import { createNotificationsFromTriggers, createReminderNotifications, type CalendarNotification } from "../calendar/notifications";
import * as moonLogic from "../calendar/moonLogic";
import { applyMoonEventTriggerActions, getNewlyTriggeredMoonEventsBetween, getTriggeredMoonEventsAtTime } from "../calendar/moonEventsLogic";
import { normalizeEventDisplayHistory, normalizeEventDisplaySettings, selectVisibleLunarEvents, selectVisibleWeatherEvents } from "../calendar/eventDisplayLogic";
import { cleanManualPublicationsForActiveEvents, normalizeManualPublications } from "../calendar/eventPublicationLogic";
import { getCurrentSeason } from "../calendar/seasonsLogic";
import {
  getCurrentlyMatchingWeatherEvents,
  generateWeatherForEventConditions,
  updateWeatherEventLifecycles
} from "../calendar/weatherEventsLogic";
import { getCurrentWeather, getHourlyWeatherForecast } from "../calendar/weatherLogic";
import { getWeatherUnitLabels } from "../calendar/weatherUnits";
import { notificationToPopupPayload, sendPopupNotification } from "../obr/popupNotifications";
import type { CalendarEvent, CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";
import { TodayEventsCard } from "./today/TodayEventsCard";
import { TodayLayout } from "./today/TodayLayout";
import { TodayStatusSummary, WeatherForecastCard } from "./today/WeatherAndSeasonCard";
import { EventDetailsPopup } from "./events/EventDetailsPopup";
import { MoonEventDetailsPopup } from "./events/MoonEventDetailsPopup";
import { setMoonEventPublicationFromUi, setWeatherEventPublicationFromUi } from "./events/manualEventPublication";
import { WeatherEventDetailsPopup } from "./events/WeatherEventDetailsPopup";
import { WeatherBiomePickerPopup } from "./weather/WeatherBiomePickerPopup";
import { AdventureContextPickerPopup } from "./adventure/AdventureContextPickerPopup";
import { PrimaryButton, SecondaryButton, SectionCard, SectionHeader, Toolbar } from "./ui";

type QuickAction = { key: string; deltaMinutes: number };
const quickActions: QuickAction[] = [
  { key: "time.minus2h", deltaMinutes: -120 }, { key: "time.minus1h", deltaMinutes: -60 }, { key: "time.minus15m", deltaMinutes: -15 }, { key: "time.minus5m", deltaMinutes: -5 },
  { key: "time.plus5m", deltaMinutes: 5 }, { key: "time.plus15m", deltaMinutes: 15 }, { key: "time.plus1h", deltaMinutes: 60 }, { key: "time.plus2h", deltaMinutes: 120 }
];

const quickActionsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(48px, 1fr))",
  gap: 6,
  width: "100%",
  marginBottom: 8
};

const quickActionButtonStyle: React.CSSProperties = {
  height: 34,
  padding: "0 6px",
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center"
};

const longRestButtonStyle: React.CSSProperties = {
  width: "100%",
  height: 36,
  padding: "0 10px",
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: 0.3,
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const quickChangeGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  gap: 6,
  width: "100%",
  minWidth: 0,
  marginBottom: 8
};

const quickChangeButtonStyle: React.CSSProperties = {
  ...longRestButtonStyle,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};

const quickChangeLabelStyle: React.CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};

const shortcutHelpStyle: React.CSSProperties = { fontSize: 11, color: "#9ca3af", margin: "-2px 0 8px", lineHeight: 1.35 };

type QuickActionShortcutHandlers = {
  onMinus2Hours: () => void;
  onMinus1Hour: () => void;
  onMinus15Minutes: () => void;
  onMinus5Minutes: () => void;
  onPlus5Minutes: () => void;
  onPlus15Minutes: () => void;
  onPlus1Hour: () => void;
  onPlus2Hours: () => void;
  onLongRest: () => void;
  onOpenBiomeChange: () => void;
  onOpenAdventureContext: () => void;
};

const isEditableShortcutTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  if (tagName === "input" || tagName === "textarea" || tagName === "select") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('[contenteditable="true"]'));
};

const DEBUG_QUICK_SHORTCUTS = false;

const debugQuickShortcut = (event: KeyboardEvent): void => {
  if (!DEBUG_QUICK_SHORTCUTS) return;
  console.debug("[Calendar OBR] quick shortcut", {
    code: event.code,
    key: event.key,
    shiftKey: event.shiftKey,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    metaKey: event.metaKey
  });
};

const getQuickActionShortcutHandler = (event: KeyboardEvent, handlers: QuickActionShortcutHandlers): (() => void) | undefined => {
  // Les raccourcis actions rapides utilisent volontairement uniquement le pavé numérique.
  const byCode: Record<string, () => void> = {
    Numpad1: handlers.onMinus2Hours,
    Numpad2: handlers.onMinus1Hour,
    Numpad3: handlers.onMinus15Minutes,
    Numpad4: handlers.onMinus5Minutes,
    Numpad5: handlers.onLongRest,
    Numpad6: handlers.onPlus5Minutes,
    Numpad7: handlers.onPlus15Minutes,
    Numpad8: handlers.onPlus1Hour,
    Numpad9: handlers.onPlus2Hours,
    Numpad0: handlers.onOpenBiomeChange,
    NumpadDecimal: handlers.onOpenAdventureContext,
    NumpadComma: handlers.onOpenAdventureContext
  };
  const exactNumpadHandler = byCode[event.code];
  if (exactNumpadHandler) return exactNumpadHandler;
  if (!event.shiftKey) return undefined;

  const byShiftedNumpadNavigation: Record<string, () => void> = {
    End: handlers.onMinus2Hours,
    ArrowDown: handlers.onMinus1Hour,
    PageDown: handlers.onMinus15Minutes,
    ArrowLeft: handlers.onMinus5Minutes,
    Clear: handlers.onLongRest,
    ArrowRight: handlers.onPlus5Minutes,
    Home: handlers.onPlus15Minutes,
    ArrowUp: handlers.onPlus1Hour,
    PageUp: handlers.onPlus2Hours,
    Insert: handlers.onOpenBiomeChange,
    Delete: handlers.onOpenAdventureContext
  };
  return byShiftedNumpadNavigation[event.code] ?? byShiftedNumpadNavigation[event.key];
};

const useQuickActionKeyboardShortcuts = ({ enabled, handlers }: { enabled: boolean; handlers: QuickActionShortcutHandlers }) => {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      debugQuickShortcut(event);
      if (!event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
      if (isEditableShortcutTarget(event.target)) return;

      const shortcutHandler = getQuickActionShortcutHandler(event, handlers);
      if (!shortcutHandler) return;

      event.preventDefault();
      event.stopPropagation();
      shortcutHandler();
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [enabled, handlers]);
};

export const TodayView = ({ project, onProjectUpdate, onReset, onOpenNotification }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; onReset: () => void; onOpenNotification?: (notification: CalendarNotification) => void; }) => {
  const dismissedStorageKey = `calendar-obr.notifications.dismissed.${project.id}`;
  const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
  const todayDateLabel = `${displayDate.weekdayName ?? ""} ${displayDate.dayOfMonth} ${displayDate.monthName} ${displayDate.year}`.trim();
  const currentSeason = getCurrentSeason(project);
  const currentWeather = getCurrentWeather(project);
  const conditionWeather = generateWeatherForEventConditions(project, project.currentTime);
  const triggeredWeatherEvents = conditionWeather
    ? getCurrentlyMatchingWeatherEvents(project, conditionWeather, project.currentTime)
    : [];
  const currentMoonPhases = moonLogic.getCurrentMoonPhases(project);
  const triggeredMoonEvents = getTriggeredMoonEventsAtTime(project, project.currentTime);
  const absoluteMinutes = project.currentTime.absoluteDay * 1440 + project.currentTime.hour * 60 + project.currentTime.minute;
  const displaySettings = normalizeEventDisplaySettings(project.eventDisplaySettings);
  const displayHistory = normalizeEventDisplayHistory(project.eventDisplayHistory);
  const manualPublications = normalizeManualPublications(project.manualPublications);
  const weatherDisplaySelection = selectVisibleWeatherEvents({
    activeEvents: triggeredWeatherEvents,
    settings: displaySettings,
    history: displayHistory,
    absoluteMinutes,
    seed: project.weatherSettings.seed ?? project.id
  });
  const moonDisplaySelection = selectVisibleLunarEvents({
    activeEvents: triggeredMoonEvents,
    settings: displaySettings,
    history: displayHistory,
    absoluteMinutes,
    seed: project.weatherSettings.seed ?? project.id
  });
  const hourlyForecast = getHourlyWeatherForecast(project, 5);
  const weatherUnits = getWeatherUnitLabels(project.units);
  const eventsToday = getEventsForCurrentDay(project);
  const [lastTriggeredEvents, setLastTriggeredEvents] = useState<CalendarEvent[]>([]);
  const [lastTriggeredWeatherEvents, setLastTriggeredWeatherEvents] = useState<CalendarProject["weatherEvents"]>([]);
  const [lastTriggeredMoonEvents, setLastTriggeredMoonEvents] = useState<NonNullable<CalendarProject["moonEvents"]>>([]);
  const [notifications, setNotifications] = useState<CalendarNotification[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedMoonEventId, setSelectedMoonEventId] = useState<string | null>(null);
  const [selectedWeatherEventId, setSelectedWeatherEventId] = useState<string | null>(null);
  const [biomePickerOpen, setBiomePickerOpen] = useState(false);
  const [adventureContextOpen, setAdventureContextOpen] = useState(false);
  const selectedEvent = selectedEventId ? project.events.find((event) => event.id === selectedEventId) ?? null : null;
  const selectedMoonEvent = selectedMoonEventId ? (project.moonEvents ?? []).find((event) => event.id === selectedMoonEventId) ?? null : null;
  const selectedWeatherEvent = selectedWeatherEventId ? project.weatherEvents.find((event) => event.id === selectedWeatherEventId) ?? null : null;

  const toggleWeatherPublication = (eventId: string, published: boolean) => {
    const event = project.weatherEvents.find((item) => item.id === eventId);
    if (!event) return;
    setWeatherEventPublicationFromUi(project, event, published, onProjectUpdate);
  };

  const toggleMoonPublication = (eventId: string, published: boolean) => {
    const event = (project.moonEvents ?? []).find((item) => item.id === eventId);
    if (!event) return;
    setMoonEventPublicationFromUi(project, event, published, onProjectUpdate, todayDateLabel);
  };

  const readDismissed = (): Set<string> => {
    try {
      const raw = sessionStorage.getItem(dismissedStorageKey);
      if (!raw) return new Set<string>();
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? new Set(parsed.filter((v): v is string => typeof v === "string")) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  };

  const persistDismissed = (values: Set<string>) => {
    try {
      sessionStorage.setItem(dismissedStorageKey, JSON.stringify([...values]));
    } catch {
      // noop
    }
  };

  const applyTimeDelta = (deltaMinutes: number) => {
    const previousTime = project.currentTime;
    const nextTime = addMinutes(project.currentTime, deltaMinutes);

    if (deltaMinutes > 0) {
      const triggered = getTriggeredEventsBetween(project, previousTime, nextTime);
      const weatherLifecycle = updateWeatherEventLifecycles(project, previousTime, nextTime);
      const triggeredWeather = weatherLifecycle.newlyTriggered;
      const triggeredMoon = getNewlyTriggeredMoonEventsBetween(project, previousTime, nextTime);
      const completed = getCompletedEventsBetween(project, previousTime, nextTime);
      const reminderEvents = getReminderEventsBetween(project, previousTime, nextTime);
      setLastTriggeredEvents(triggered);
      setLastTriggeredWeatherEvents(triggeredWeather);
      setLastTriggeredMoonEvents(triggeredMoon);
      const dismissed = readDismissed();
      const created = [
        ...createNotificationsFromTriggers(triggered, [], [], nextTime),
        ...createReminderNotifications(reminderEvents, nextTime)
      ].filter((item) => !dismissed.has(item.id));
      for (const notification of created) {
        void sendPopupNotification(notificationToPopupPayload(project, notification, nextTime));
      }
      setNotifications((prev) => {
        const merged = new Map<string, CalendarNotification>();
        [...prev, ...created].forEach((item) => {
          if (!dismissed.has(item.id)) merged.set(item.id, item);
        });
        return [...merged.values()];
      });
      const withEventsCompletion = applyEventCompletionActions(weatherLifecycle.project, completed);
      const withMoonEventStatus = applyMoonEventTriggerActions(withEventsCompletion, triggeredMoon, nextTime.absoluteDay);
      const nextConditionWeather = generateWeatherForEventConditions(withMoonEventStatus, nextTime);
      const nextActiveWeatherIds = nextConditionWeather ? getCurrentlyMatchingWeatherEvents(withMoonEventStatus, nextConditionWeather, nextTime).map((event) => event.id) : [];
      const nextActiveMoonIds = getTriggeredMoonEventsAtTime(withMoonEventStatus, nextTime).map((event) => event.id);
      onProjectUpdate(cleanManualPublicationsForActiveEvents(withMoonEventStatus, nextActiveWeatherIds, nextActiveMoonIds));
      return;
    } else {
      setLastTriggeredEvents([]);
      setLastTriggeredWeatherEvents([]);
      setLastTriggeredMoonEvents([]);
    }

    const nextProject = { ...project, currentTime: nextTime };
    const nextConditionWeather = generateWeatherForEventConditions(nextProject, nextTime);
    const nextActiveWeatherIds = nextConditionWeather ? getCurrentlyMatchingWeatherEvents(nextProject, nextConditionWeather, nextTime).map((event) => event.id) : [];
    const nextActiveMoonIds = getTriggeredMoonEventsAtTime(nextProject, nextTime).map((event) => event.id);
    onProjectUpdate(cleanManualPublicationsForActiveEvents(nextProject, nextActiveWeatherIds, nextActiveMoonIds));
  };

  const openBiomeChange = () => setBiomePickerOpen(true);
  const openAdventureContext = () => setAdventureContextOpen(true);
  const applyLongRest = () => applyTimeDelta(480);
  const shortcutHandlers: QuickActionShortcutHandlers = {
    onMinus2Hours: () => applyTimeDelta(-120),
    onMinus1Hour: () => applyTimeDelta(-60),
    onMinus15Minutes: () => applyTimeDelta(-15),
    onMinus5Minutes: () => applyTimeDelta(-5),
    onPlus5Minutes: () => applyTimeDelta(5),
    onPlus15Minutes: () => applyTimeDelta(15),
    onPlus1Hour: () => applyTimeDelta(60),
    onPlus2Hours: () => applyTimeDelta(120),
    onLongRest: applyLongRest,
    onOpenBiomeChange: openBiomeChange,
    onOpenAdventureContext: openAdventureContext
  };
  const hasQuickActionBlockingPopup = Boolean(selectedEvent || selectedMoonEvent || selectedWeatherEvent || biomePickerOpen || adventureContextOpen);
  useQuickActionKeyboardShortcuts({ enabled: !hasQuickActionBlockingPopup, handlers: shortcutHandlers });

  const quickActionsCard = (
    <SectionCard>
        <SectionHeader title={t(project.locale, "time.quickActions")} />
        <div style={quickActionsGridStyle}>
          {quickActions.map((action) => (
            <SecondaryButton
              key={action.key}
              type="button"
              onClick={() => applyTimeDelta(action.deltaMinutes)}
              style={quickActionButtonStyle}
            >
              {t(project.locale, action.key)}
            </SecondaryButton>
          ))}
        </div>
        <Toolbar>
          <PrimaryButton
            type="button"
            onClick={applyLongRest}
            style={longRestButtonStyle}
          >
            🛌 {t(project.locale, "time.longRest")}
          </PrimaryButton>
        </Toolbar>
        <div className="today-quick-change-grid" style={quickChangeGridStyle}>
          <SecondaryButton
            type="button"
            onClick={openBiomeChange}
            style={quickChangeButtonStyle}
          >
            <span style={quickChangeLabelStyle}>🌐 {t(project.locale, "weatherBiome.changeAction")}</span>
          </SecondaryButton>
          <SecondaryButton
            type="button"
            onClick={openAdventureContext}
            style={quickChangeButtonStyle}
          >
            <span style={quickChangeLabelStyle}>🧭 {t(project.locale, "adventureContext.changeAction")}</span>
          </SecondaryButton>
        </div>
        <div style={shortcutHelpStyle}>{t(project.locale, "time.quickActionsShortcutsHelp")}</div>
      </SectionCard>
    );

  return (
    <>
      <TodayLayout
        locale={project.locale}
        visibility={{
          showStatus: true,
          showDate: true,
          showSeason: true,
          showWeather: true,
          showBiome: true,
          showMoons: true,
          showWeatherEvents: true,
          showEvents: true,
          showMoonEvents: true,
          showDayNotes: true,
          showHourlyForecast: true,
          showQuickActions: true
        }}
        actions={{
          canEdit: true,
          canCreate: true,
          canChangeTime: true,
          canChangeBiome: true,
          canReset: true,
          canOpenGmDetails: true
        }}
        status={<TodayStatusSummary
          project={project}
          currentSeason={currentSeason}
          currentWeather={currentWeather}
          triggeredWeatherEvents={triggeredWeatherEvents}
          visibleWeatherEvents={weatherDisplaySelection.visibleEvents}
          hiddenWeatherEvents={weatherDisplaySelection.hiddenEvents}
          hiddenWeatherEventReasons={weatherDisplaySelection.hiddenReasons}
          weatherUnits={weatherUnits}
          currentMoonPhases={currentMoonPhases}
          onSelectWeatherEvent={setSelectedWeatherEventId}
        onToggleWeatherPublication={toggleWeatherPublication}
          publishedWeatherEventIds={manualPublications.weatherEventIds}
        />}
        events={<TodayEventsCard project={project} eventsToday={eventsToday} moonEventsToday={moonDisplaySelection.visibleEvents} hiddenMoonEvents={moonDisplaySelection.hiddenEvents} hiddenMoonEventReasons={moonDisplaySelection.hiddenReasons} onSelectEvent={setSelectedEventId} onSelectMoonEvent={setSelectedMoonEventId} onToggleMoonPublication={toggleMoonPublication} publishedMoonEventIds={manualPublications.lunarEventIds} />}
        forecast={<WeatherForecastCard project={project} hourlyForecast={hourlyForecast} weatherUnits={weatherUnits} />}
        quickActions={quickActionsCard}
      />

      {selectedEvent ? <EventDetailsPopup project={project} event={selectedEvent} onClose={() => setSelectedEventId(null)} onUpdate={(updatedEvent) => onProjectUpdate(updateCalendarEvent(project, updatedEvent.id, updatedEvent))} /> : null}
      {selectedMoonEvent ? <MoonEventDetailsPopup project={project} event={selectedMoonEvent} onClose={() => setSelectedMoonEventId(null)} contextDateLabel={todayDateLabel} onProjectUpdate={onProjectUpdate} /> : null}
      {selectedWeatherEvent ? <WeatherEventDetailsPopup project={project} event={selectedWeatherEvent} onClose={() => setSelectedWeatherEventId(null)} onProjectUpdate={onProjectUpdate} /> : null}
      {biomePickerOpen ? <WeatherBiomePickerPopup project={project} onClose={() => setBiomePickerOpen(false)} onApply={onProjectUpdate} /> : null}
      {adventureContextOpen ? <AdventureContextPickerPopup project={project} onClose={() => setAdventureContextOpen(false)} onApply={onProjectUpdate} /> : null}
    </>
  );
};