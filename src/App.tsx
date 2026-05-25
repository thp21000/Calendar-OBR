import { useEffect, useRef, useState } from "react";
import type { CalendarDate, CalendarProject } from "./domain/types";
import type { CalendarNotification } from "./calendar/notifications";
import type { GlobalSearchResult } from "./calendar/globalSearch";
import { t } from "./i18n/messages";
import { EventsView } from "./components/EventsView";
import { MonthView } from "./components/MonthView";
import { SettingsView } from "./components/SettingsView";
import { TodayView } from "./components/TodayView";
import { PlayerView } from "./components/PlayerView";
import { appShellStyle, tabButtonStyle, tabsGridStyle, titleStyle } from "./components/ui/styles";
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

export const App = () => {
  const [scope, setScope] = useState<StorageScope | null>(null);
  const [project, setProject] = useState<CalendarProject | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<ViewerRole | null>(null);
  const [revision, setRevision] = useState(0);
  const [publicSnapshot, setPublicSnapshot] = useState<PublicCalendarTodaySnapshot | null>(null);
  const [pendingCreateEventDate, setPendingCreateEventDate] = useState<CalendarDate | null>(null);
  const [pendingMonthSelectedDate, setPendingMonthSelectedDate] = useState<CalendarDate | null>(null);
  const [pendingEditEventId, setPendingEditEventId] = useState<string | null>(null);
  const projectRef = useRef<CalendarProject | null>(null);
  const revisionRef = useRef(0);

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

  if (!scope || !project || !viewerRole) {
    return <main style={appShellStyle}>{t("fr", "common.loading")}</main>;
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
  
  const handleOpenSearchResult = (result: GlobalSearchResult) => {
    if (result.type === "event") {
      setActiveTab("events");
      return;
    }
    if (result.type === "dayNote") {
      setPendingMonthSelectedDate(result.date ?? null);
      setActiveTab("month");
      return;
    }
    if (result.type === "moonEvent") {
      setActiveTab("settings");
    }
  };

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
    if (viewerRole === "gm") publishPublicIndex(buildPublicCalendarIndex(reset, nextRev));
  };

  return <main style={appShellStyle}>
    <h1 style={titleStyle}>{t(project.locale, "app.title")}</h1>
    {viewerRole === "gm" ? <>
      <div style={tabsGridStyle}>
        <button type="button" onClick={() => setActiveTab("today")} style={tabButtonStyle(project.uiSettings.activeTab === "today")}>{t(project.locale, "nav.today")}</button>
        <button type="button" onClick={() => setActiveTab("month")} style={tabButtonStyle(project.uiSettings.activeTab === "month")}>{t(project.locale, "nav.month")}</button>
        <button type="button" onClick={() => setActiveTab("events")} style={tabButtonStyle(project.uiSettings.activeTab === "events")}>{t(project.locale, "nav.events")}</button>
        <button type="button" onClick={() => setActiveTab("settings")} style={tabButtonStyle(project.uiSettings.activeTab === "settings")}>{t(project.locale, "nav.settings")}</button>
        <button type="button" onClick={() => setActiveTab("player")} style={tabButtonStyle(project.uiSettings.activeTab === "player")}>{t(project.locale, "nav.player")}</button>
      </div>
      {project.uiSettings.activeTab === "month" ? <MonthView project={project} onProjectUpdate={updateProject} initialSelectedDate={pendingMonthSelectedDate} onCreateEventForDate={(date) => { setPendingCreateEventDate(date); setActiveTab("events"); }} /> : project.uiSettings.activeTab === "events" ? <EventsView project={project} onProjectUpdate={updateProject} initialCreateDate={pendingCreateEventDate} initialEditEventId={pendingEditEventId} onInitialCreateDateConsumed={() => setPendingCreateEventDate(null)} onInitialEditEventIdConsumed={() => setPendingEditEventId(null)} onOpenSearchResult={handleOpenSearchResult} /> : project.uiSettings.activeTab === "settings" ? <SettingsView project={project} onProjectUpdate={updateProject} saveError={saveError} scope={scope} onReset={handleReset} /> : project.uiSettings.activeTab === "player" ? <PlayerView project={project} /> : <TodayView project={project} onProjectUpdate={updateProject} onReset={handleReset} onOpenNotification={handleOpenNotification} />}
    </> : publicSnapshot ? <PlayerView project={project} snapshot={publicSnapshot} /> : <div style={{ color: "#9ca3af" }}>{t(project.locale, "player.waitingForGmData")}</div>}
  </main>;
};

const tabStyle = (active: boolean) => ({ border: "1px solid #374151", borderRadius: 6, background: active ? "#2563eb" : "#1f2937", color: "#f3f4f6", padding: "6px 8px", fontSize: 12 });