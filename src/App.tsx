import { useEffect, useRef, useState } from "react";
import type { CalendarDate, CalendarProject } from "./domain/types";
import type { CalendarNotification } from "./calendar/notifications";
import { processAutomaticEventNotifications, type AutomaticEventNotificationEffect } from "./calendar/automaticEventNotifications";
import { absoluteDayToCalendarDate } from "./calendar/dateEngine";
import { t } from "./i18n/messages";
import { EventsView } from "./components/EventsView";
import { MonthView } from "./components/MonthView";
import { SettingsView } from "./components/SettingsView";
import { TodayView } from "./components/TodayView";
import { PlayerView } from "./components/PlayerView";
import { EmptyState, SectionCard } from "./components/ui";
import { appShellStyle, tabButtonStyle, tabsGridStyle } from "./components/ui/styles";
import { getStorageScope, type StorageScope } from "./obr/roomScope";
import { getViewerRole, type ViewerRole } from "./obr/playerRole";
import { loadCalendarProject, resetCalendarProject, saveCalendarProject } from "./storage/calendarStorage";
import { subscribeCalendarProjectUpdates } from "./storage/projectSync";
import {
  buildPublicCalendarIndex,
  publishPublicIndex,
  publishPublicSnapshot,
  readLatestPublicSnapshot,
  readScopedCachedPublicSnapshot,
  readPublicIndex,
  requestPublicSnapshot,
  setupGmSnapshotResponder,
  setupPlayerSnapshotListener,
  subscribeLatestPublicSnapshot,
  subscribePublicIndex,
  writeScopedCachedPublicSnapshot,
  type PublicCalendarTodaySnapshot
} from "./obr/publicSync";
import { useObrPopoverHeight } from "./obr/useObrPopoverHeight";
import { useObrTheme } from "./obr/useObrTheme";
import { SceneWeatherModalView } from "./components/SceneWeatherManagementPopup";
import { NotificationModalView } from "./components/notifications/NotificationModalView";
import { openLocalPopupNotification, sendPopupNotificationToPlayers, setupPopupNotificationListener, type PopupNotificationPayload } from "./obr/popupNotifications";

export const App = () => {
  const [scope, setScope] = useState<StorageScope | null>(null);
  const [project, setProject] = useState<CalendarProject | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<ViewerRole | null>(null);
  const [revision, setRevision] = useState(0);
  const [publicSnapshot, setPublicSnapshot] = useState<PublicCalendarTodaySnapshot | null>(null);
  const [playerPopupNotification, setPlayerPopupNotification] = useState<PopupNotificationPayload | null>(null);
  const [pendingCreateEventDate, setPendingCreateEventDate] = useState<CalendarDate | null>(null);
  const [pendingMonthSelectedDate, setPendingMonthSelectedDate] = useState<CalendarDate | null>(null);
  const [pendingEditEventId, setPendingEditEventId] = useState<string | null>(null);
  const projectRef = useRef<CalendarProject | null>(null);
  const revisionRef = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const modalView = new URLSearchParams(window.location.search).get("view");
  const isModalView = modalView === "scene-weather" || modalView === "scene-weather-confirm" || modalView === "notification";

  useObrPopoverHeight({ containerRef: contentRef, minHeight: 220, maxHeight: 700, padding: 20, disabled: isModalView });
  useObrTheme();
  
  const publishPublicState = (nextProject: CalendarProject, nextRevision: number): void => {
    void publishPublicIndex(buildPublicCalendarIndex(nextProject, nextRevision));
    void publishPublicSnapshot(nextProject, nextRevision);
  };

  const isPublicSnapshotNewer = (current: PublicCalendarTodaySnapshot | null, incoming: PublicCalendarTodaySnapshot): boolean =>
    !current || incoming.revision > current.revision || (incoming.revision === current.revision && incoming.updatedAt > current.updatedAt);

  const isPublicIndexNewerThanSnapshot = (snapshot: PublicCalendarTodaySnapshot | null, index: { revision: number; updatedAt: number }): boolean =>
    !snapshot || index.revision > snapshot.revision || (index.revision === snapshot.revision && index.updatedAt > snapshot.updatedAt);

  const getProjectDateLabel = (sourceProject: CalendarProject): string => {
    const date = absoluteDayToCalendarDate(sourceProject.currentTime, sourceProject.calendarSystem);
    return `${date.weekdayName ?? ""} ${date.dayOfMonth} ${date.monthName} ${date.year}`.trim();
  };

  const sendAutomaticEventNotification = (sourceProject: CalendarProject, effect: AutomaticEventNotificationEffect): void => {
    const event = effect.event;
    const isWeather = effect.type === "weather";
    const date = getProjectDateLabel(sourceProject);
    if (effect.channel === "gm") {
      void openLocalPopupNotification({
        type: effect.type,
        audience: "gm",
        title: t(sourceProject.locale, isWeather ? "automaticNotifications.weatherGmTitle" : "automaticNotifications.moonGmTitle").replace("{name}", event.name),
        body: event.gmDescription?.trim() || event.summary || event.name,
        date,
        icon: event.icon,
        summary: event.summary,
        gmDescription: event.gmDescription
      });
      return;
    }

    void sendPopupNotificationToPlayers({
      type: effect.type,
      audience: "players",
      title: event.name,
      body: event.playerDescription?.trim() || event.summary || event.name,
      date,
      icon: event.icon,
      summary: event.summary,
      playerDescription: event.playerDescription
    });
  };

  useEffect(() => {
    let cleanupGmResponder: (() => void) | null = null;
    let cleanupPlayerListener: (() => void) | null = null;
    let cleanupPublicIndexSubscription: (() => void) | null = null;
    let cleanupLatestSnapshotSubscription: (() => void) | null = null;
    let cleanupPopupNotificationListener: (() => void) | null = null;

    getStorageScope().then(async (resolved) => {
      setScope(resolved);
      const loaded = loadCalendarProject(resolved.storageKey);
      projectRef.current = loaded;
      setProject(loaded);
      const role = await getViewerRole();
      setViewerRole(role);
      cleanupPopupNotificationListener = setupPopupNotificationListener(role, setPlayerPopupNotification);

      if (role === "gm") {
        await publishPublicIndex(buildPublicCalendarIndex(loaded, revisionRef.current));
        await publishPublicSnapshot(loaded, revisionRef.current);
        cleanupGmResponder = setupGmSnapshotResponder(
          () => projectRef.current ?? loaded,
          () => revisionRef.current
        );
      } else {
        const cacheScopeId = resolved.id;
        const cached = readScopedCachedPublicSnapshot(cacheScopeId);
        if (cached) setPublicSnapshot(cached);
        const acceptPublicSnapshot = (snapshot: PublicCalendarTodaySnapshot): void => {
          setPublicSnapshot((current) => {
            if (!isPublicSnapshotNewer(current, snapshot)) return current;
            writeScopedCachedPublicSnapshot(snapshot, cacheScopeId);
            return snapshot;
          });
        };
        cleanupPlayerListener = setupPlayerSnapshotListener(acceptPublicSnapshot);
        cleanupLatestSnapshotSubscription = subscribeLatestPublicSnapshot(acceptPublicSnapshot);

        const roomSnapshot = await readLatestPublicSnapshot();
        if (roomSnapshot && isPublicSnapshotNewer(cached, roomSnapshot)) acceptPublicSnapshot(roomSnapshot);
        const bestSnapshot = roomSnapshot && isPublicSnapshotNewer(cached, roomSnapshot) ? roomSnapshot : cached;

        const idx = await readPublicIndex();
        if (idx && isPublicIndexNewerThanSnapshot(bestSnapshot, idx)) await requestPublicSnapshot();
        else if (!bestSnapshot) await requestPublicSnapshot();
        cleanupPublicIndexSubscription = subscribePublicIndex(async (index) => {
          const latestCached = readScopedCachedPublicSnapshot(cacheScopeId);
          const latestRoomSnapshot = await readLatestPublicSnapshot();
          const latestSnapshot = latestRoomSnapshot && isPublicSnapshotNewer(latestCached, latestRoomSnapshot) ? latestRoomSnapshot : latestCached;
          if (latestRoomSnapshot && isPublicSnapshotNewer(latestCached, latestRoomSnapshot)) acceptPublicSnapshot(latestRoomSnapshot);
          if (isPublicIndexNewerThanSnapshot(latestSnapshot, index)) {
            await requestPublicSnapshot();
          }
        });
      }
    });

    return () => {
      cleanupGmResponder?.();
      cleanupPlayerListener?.();
      cleanupPublicIndexSubscription?.();
      cleanupLatestSnapshotSubscription?.();
      cleanupPopupNotificationListener?.();
    };
  }, []);

  useEffect(() => {
    if (!scope || !viewerRole) return;
    return subscribeCalendarProjectUpdates((message) => {
      if (message.storageKey !== scope.storageKey) return;
      const loaded = loadCalendarProject(scope.storageKey);
      const nextRev = revisionRef.current + 1;
      revisionRef.current = nextRev;
      projectRef.current = loaded;
      setRevision(nextRev);
      setProject(loaded);
      setSaveError(null);
      if (viewerRole === "gm") publishPublicState(loaded, nextRev);
    });
  }, [scope, viewerRole]);

  if (!scope || !project || !viewerRole) {
    return <main><div ref={contentRef} style={appShellStyle}>{t("fr", "common.loading")}</div></main>;
  }

  const updateProject = (nextProject: CalendarProject) => {
    const previousProject = projectRef.current ?? project;
    const processed = viewerRole === "gm" ? processAutomaticEventNotifications(previousProject, nextProject) : { project: nextProject, effects: [] };
    const projectToSave = processed.project;
    const result = saveCalendarProject(projectToSave, scope.storageKey);
    if (result.ok) {
      const nextRev = revisionRef.current + 1;
      revisionRef.current = nextRev;
      projectRef.current = projectToSave;
      setRevision(nextRev);
      setProject(projectToSave);
      setSaveError(null);
      if (viewerRole === "gm") {
        publishPublicState(projectToSave, nextRev);
        processed.effects.forEach((effect) => sendAutomaticEventNotification(projectToSave, effect));
      }
    } else setSaveError(result.error);
  };

  if (isModalView) {
    if (modalView === "notification") return <NotificationModalView project={project} />;
    if (viewerRole !== "gm") {
      return <main><div ref={contentRef} style={appShellStyle}><SectionCard><EmptyState text={t(project.locale, "sceneWeather.gmOnly")} /></SectionCard></div></main>;
    }
    return <SceneWeatherModalView project={project} onProjectUpdate={updateProject} mode={modalView === "scene-weather-confirm" ? "confirm" : "menu"} />;
  }

  const setActiveTab = (activeTab: "today" | "month" | "events" | "settings" | "player") => updateProject({ ...project, uiSettings: { ...project.uiSettings, activeTab } });

  const handleOpenNotification = (notification: CalendarNotification) => {
    if (notification.type === "event" || notification.type === "eventReminder") {
      setPendingEditEventId(notification.sourceId);
      setActiveTab("events");
      return;
    }
    if (notification.type === "moon") {
      setActiveTab("settings");
      return;
    }
    if (notification.type === "weather") {
      setActiveTab("today");
    }
  };

  const handleReset = () => {
    const reset = resetCalendarProject(scope.storageKey);
    const nextRev = revisionRef.current + 1;
    revisionRef.current = nextRev;
    projectRef.current = reset;
    setRevision(nextRev);
    setProject(reset);
    if (viewerRole === "gm") publishPublicState(reset, nextRev);
  };

  return <main>
    <div ref={contentRef} style={appShellStyle}>
      {viewerRole === "gm" ? <>
      <div style={tabsGridStyle}>
        <button type="button" onClick={() => setActiveTab("today")} style={tabButtonStyle(project.uiSettings.activeTab === "today")}>{t(project.locale, "nav.today")}</button>
        <button type="button" onClick={() => setActiveTab("month")} style={tabButtonStyle(project.uiSettings.activeTab === "month")}>{t(project.locale, "nav.month")}</button>
        <button type="button" onClick={() => setActiveTab("events")} style={tabButtonStyle(project.uiSettings.activeTab === "events")}>{t(project.locale, "nav.events")}</button>
        <button type="button" onClick={() => setActiveTab("settings")} style={tabButtonStyle(project.uiSettings.activeTab === "settings")}>{t(project.locale, "nav.settings")}</button>
        <button type="button" onClick={() => setActiveTab("player")} style={tabButtonStyle(project.uiSettings.activeTab === "player")}>{t(project.locale, "nav.player")}</button>
      </div>
      {project.uiSettings.activeTab === "month" ? <MonthView project={project} onProjectUpdate={updateProject} initialSelectedDate={pendingMonthSelectedDate} /> : project.uiSettings.activeTab === "events" ? <EventsView project={project} onProjectUpdate={updateProject} initialCreateDate={pendingCreateEventDate} initialEditEventId={pendingEditEventId} onInitialCreateDateConsumed={() => setPendingCreateEventDate(null)} onInitialEditEventIdConsumed={() => setPendingEditEventId(null)} /> : project.uiSettings.activeTab === "settings" ? <SettingsView project={project} onProjectUpdate={updateProject} saveError={saveError} scope={scope} onReset={handleReset} /> : project.uiSettings.activeTab === "player" ? <PlayerView project={project} /> : <TodayView project={project} onProjectUpdate={updateProject} onReset={handleReset} onOpenNotification={handleOpenNotification} />}
    </> : publicSnapshot ? <PlayerView project={project} snapshot={publicSnapshot} popupNotification={playerPopupNotification} onDismissPopupNotification={() => setPlayerPopupNotification(null)} /> : <SectionCard><EmptyState text={t(project.locale, "player.waitingForGmData")} /></SectionCard>}
    </div>
  </main>;
};