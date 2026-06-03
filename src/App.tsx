import { useEffect, useRef, useState } from "react";
import type { CalendarDate, CalendarProject } from "./domain/types";
import type { CalendarNotification } from "./calendar/notifications";
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
import {
  buildPublicCalendarIndex,
  publishPublicIndex,
  readScopedCachedPublicSnapshot,
  readPublicIndex,
  requestPublicSnapshot,
  setupGmSnapshotResponder,
  setupPlayerSnapshotListener,
  subscribePublicIndex,
  writeScopedCachedPublicSnapshot,
  type PublicCalendarTodaySnapshot
} from "./obr/publicSync";
import { useObrPopoverHeight } from "./obr/useObrPopoverHeight";
import { useObrTheme } from "./obr/useObrTheme";
import { SceneWeatherApplyPrompt, SceneWeatherManagementPopup } from "./components/SceneWeatherManagementPopup";
import { applySceneWeatherProfile, disableSceneWeatherForScene } from "./calendar/sceneWeather";
import { toAbsoluteMinutes } from "./calendar/weatherEventsLogic";
import { getCurrentObrSceneInfo, getSceneWeatherState, setSceneWeatherState, subscribeToObrSceneChange } from "./obr/sceneWeatherMetadata";
import type { SceneWeatherSceneState } from "./domain/types";

export const App = () => {
  const [scope, setScope] = useState<StorageScope | null>(null);
  const [project, setProject] = useState<CalendarProject | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<ViewerRole | null>(null);
  const [revision, setRevision] = useState(0);
  const [publicSnapshot, setPublicSnapshot] = useState<PublicCalendarTodaySnapshot | null>(null);
  const [pendingCreateEventDate, setPendingCreateEventDate] = useState<CalendarDate | null>(null);
  const [pendingMonthSelectedDate, setPendingMonthSelectedDate] = useState<CalendarDate | null>(null);
  const [sceneWeatherMenuOpen, setSceneWeatherMenuOpen] = useState(false);
  const [sceneWeatherPrompt, setSceneWeatherPrompt] = useState<SceneWeatherSceneState | null>(null);
  const [pendingEditEventId, setPendingEditEventId] = useState<string | null>(null);
  const projectRef = useRef<CalendarProject | null>(null);
  const revisionRef = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useObrPopoverHeight({ containerRef: contentRef, minHeight: 420, maxHeight: 900, padding: 20 });
  useObrTheme();
  
  useEffect(() => {
    let cleanupGmResponder: (() => void) | null = null;
    let cleanupPlayerListener: (() => void) | null = null;
    let cleanupPublicIndexSubscription: (() => void) | null = null;

    getStorageScope().then(async (resolved) => {
      setScope(resolved);
      const loaded = loadCalendarProject(resolved.storageKey);
      projectRef.current = loaded;
      setProject(loaded);
      const role = await getViewerRole();
      setViewerRole(role);

      if (role === "gm") {
        await publishPublicIndex(buildPublicCalendarIndex(loaded, revisionRef.current));
        cleanupGmResponder = setupGmSnapshotResponder(
          () => projectRef.current ?? loaded,
          () => revisionRef.current
        );
      } else {
        const cacheScopeId = resolved.id;
        const cached = readScopedCachedPublicSnapshot(cacheScopeId);
        if (cached) setPublicSnapshot(cached);
        cleanupPlayerListener = setupPlayerSnapshotListener((snapshot: PublicCalendarTodaySnapshot) => {
          setPublicSnapshot(snapshot);
          writeScopedCachedPublicSnapshot(snapshot, cacheScopeId);
        });
        const idx = await readPublicIndex();
        if (!cached || (idx && cached.revision < idx.revision)) await requestPublicSnapshot();
        cleanupPublicIndexSubscription = subscribePublicIndex(async (index) => {
          const latestCached = readScopedCachedPublicSnapshot(cacheScopeId);
          if (!latestCached || latestCached.revision < index.revision) {
            await requestPublicSnapshot();
          }
        });
      }
    });

    return () => {
      cleanupGmResponder?.();
      cleanupPlayerListener?.();
      cleanupPublicIndexSubscription?.();
    };
  }, []);

  useEffect(() => {
    if (!scope || viewerRole !== "gm") return;
    const promptedKeys = new Set<string>();

    const persistProject = (nextProject: CalendarProject) => {
      const result = saveCalendarProject(nextProject, scope.storageKey);
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }
      const nextRev = revisionRef.current + 1;
      revisionRef.current = nextRev;
      projectRef.current = nextProject;
      setRevision(nextRev);
      setProject(nextProject);
      setSaveError(null);
      void publishPublicIndex(buildPublicCalendarIndex(nextProject, nextRev));
    };

    const handleSceneChange = async () => {
      const currentProject = projectRef.current;
      if (!currentProject) return;
      const [sceneInfo, state] = await Promise.all([getCurrentObrSceneInfo(), getSceneWeatherState()]);
      const sceneId = sceneInfo?.id ?? "local-scene";
      const sceneName = sceneInfo?.name;
      if (!state?.profileId) {
        persistProject(disableSceneWeatherForScene(currentProject));
        setSceneWeatherPrompt(null);
        return;
      }
      const profile = (currentProject.sceneWeatherProfiles ?? []).find((item) => item.id === state.profileId && item.enabled);
      if (!profile) {
        persistProject(disableSceneWeatherForScene(currentProject, sceneId));
        setSceneWeatherPrompt(null);
        return;
      }
      if (state.isActive) {
        persistProject(applySceneWeatherProfile(currentProject, profile, { sceneId, sceneName }));
        setSceneWeatherPrompt(null);
        return;
      }
      persistProject(disableSceneWeatherForScene(currentProject, sceneId));
      const now = toAbsoluteMinutes(currentProject.currentTime);
      const key = `${sceneId}:${state.profileId}:${now}`;
      if (promptedKeys.has(key) || state.lastPromptedAtMinutes === now) return;
      promptedKeys.add(key);
      const nextState = { ...state, lastPromptedAtMinutes: now };
      await setSceneWeatherState(nextState);
      setSceneWeatherPrompt(nextState);
    };

    void handleSceneChange();
    return subscribeToObrSceneChange(() => { void handleSceneChange(); });
  }, [scope, viewerRole]);

  if (!scope || !project || !viewerRole) {
    return <main><div ref={contentRef} style={appShellStyle}>{t("fr", "common.loading")}</div></main>;
  }

  const updateProject = (nextProject: CalendarProject) => {
    const result = saveCalendarProject(nextProject, scope.storageKey);
    if (result.ok) {
      const nextRev = revisionRef.current + 1;
      revisionRef.current = nextRev;
      projectRef.current = nextProject;
      setRevision(nextRev);
      setProject(nextProject);
      setSaveError(null);
      if (viewerRole === "gm") publishPublicIndex(buildPublicCalendarIndex(nextProject, nextRev));
    } else setSaveError(result.error);
  };

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
  
  const handleApplySceneWeatherPrompt = async (accepted: boolean) => {
    const state = sceneWeatherPrompt;
    if (!state) return;
    const sceneInfo = await getCurrentObrSceneInfo();
    const sceneId = sceneInfo?.id ?? "local-scene";
    const sceneName = sceneInfo?.name;
    if (accepted) {
      const profile = (project.sceneWeatherProfiles ?? []).find((item) => item.id === state.profileId && item.enabled);
      if (profile) updateProject(applySceneWeatherProfile(project, profile, { sceneId, sceneName }));
      await setSceneWeatherState({ ...state, isActive: true, lastAppliedAtMinutes: toAbsoluteMinutes(project.currentTime) });
    } else {
      updateProject(disableSceneWeatherForScene(project, sceneId));
      await setSceneWeatherState({ ...state, isActive: false });
    }
    setSceneWeatherPrompt(null);
  };

  const handleReset = () => {
    const reset = resetCalendarProject(scope.storageKey);
    const nextRev = revisionRef.current + 1;
    revisionRef.current = nextRev;
    projectRef.current = reset;
    setRevision(nextRev);
    setProject(reset);
    if (viewerRole === "gm") publishPublicIndex(buildPublicCalendarIndex(reset, nextRev));
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
        <button type="button" onClick={() => setSceneWeatherMenuOpen(true)} style={tabButtonStyle(false)}>🎬 {t(project.locale, "sceneWeather.open")}</button>
      </div>
      {project.uiSettings.activeTab === "month" ? <MonthView project={project} onProjectUpdate={updateProject} initialSelectedDate={pendingMonthSelectedDate} /> : project.uiSettings.activeTab === "events" ? <EventsView project={project} onProjectUpdate={updateProject} initialCreateDate={pendingCreateEventDate} initialEditEventId={pendingEditEventId} onInitialCreateDateConsumed={() => setPendingCreateEventDate(null)} onInitialEditEventIdConsumed={() => setPendingEditEventId(null)} /> : project.uiSettings.activeTab === "settings" ? <SettingsView project={project} onProjectUpdate={updateProject} saveError={saveError} scope={scope} onReset={handleReset} /> : project.uiSettings.activeTab === "player" ? <PlayerView project={project} /> : <TodayView project={project} onProjectUpdate={updateProject} onReset={handleReset} onOpenNotification={handleOpenNotification} />}
    </> : publicSnapshot ? <PlayerView project={project} snapshot={publicSnapshot} /> : <SectionCard><EmptyState text={t(project.locale, "player.waitingForGmData")} /></SectionCard>}
      {sceneWeatherMenuOpen ? <SceneWeatherManagementPopup project={project} onProjectUpdate={updateProject} onClose={() => setSceneWeatherMenuOpen(false)} /> : null}
      {sceneWeatherPrompt ? <SceneWeatherApplyPrompt project={project} state={sceneWeatherPrompt} onYes={() => void handleApplySceneWeatherPrompt(true)} onNo={() => void handleApplySceneWeatherPrompt(false)} /> : null}
    </div>
  </main>;
};