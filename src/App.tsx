import { useEffect, useState } from "react";
import type { CalendarProject } from "./domain/types";
import { t } from "./i18n/messages";
import { EventsView } from "./components/EventsView";
import { MonthView } from "./components/MonthView";
import { SettingsView } from "./components/SettingsView";
import { TodayView } from "./components/TodayView";
import { PlayerView } from "./components/PlayerView";
import { getStorageScope, type StorageScope } from "./obr/roomScope";
import { getViewerRole, type ViewerRole } from "./obr/playerRole";
import { loadCalendarProject, resetCalendarProject, saveCalendarProject } from "./storage/calendarStorage";

export const App = () => {
  const [scope, setScope] = useState<StorageScope | null>(null);
  const [project, setProject] = useState<CalendarProject | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<ViewerRole | null>(null);

  useEffect(() => {
    getStorageScope().then((resolved) => {
      setScope(resolved);
      setProject(loadCalendarProject(resolved.storageKey));
      getViewerRole().then(setViewerRole);
    });
  }, []);

  if (!scope || !project || !viewerRole) {
    return <main style={{ width: 360, minHeight: 480, padding: 12, color: "#e5e7eb", background: "#10131a" }}>{t("fr", "common.loading")}</main>;
  }

  const updateProject = (nextProject: CalendarProject) => {
    const result = saveCalendarProject(nextProject, scope.storageKey);
    if (result.ok) {
      setProject(nextProject);
      setSaveError(null);
    } else setSaveError(result.error);
  };

  const setActiveTab = (activeTab: "today" | "month" | "events" | "settings" | "player") => {
    updateProject({ ...project, uiSettings: { ...project.uiSettings, activeTab } });
  };

  const handleReset = () => {
    const reset = resetCalendarProject(scope.storageKey);
    setProject(reset);
  };

  return (
    <main style={{ width: "100%", maxWidth: 360, minHeight: 480, boxSizing: "border-box", fontFamily: "Inter, system-ui, sans-serif", fontSize: 13, background: "#10131a", color: "#e5e7eb", padding: 12, borderRadius: 8, overflowX: "hidden" }}>
      <h1 style={{ fontSize: 16, margin: "0 0 10px" }}>{t(project.locale, "app.title")}</h1>

      {viewerRole === "gm" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6, marginBottom: 10 }}>
            <button type="button" onClick={() => setActiveTab("today")} style={tabStyle(project.uiSettings.activeTab === "today")}>{t(project.locale, "nav.today")}</button>
            <button type="button" onClick={() => setActiveTab("month")} style={tabStyle(project.uiSettings.activeTab === "month")}>{t(project.locale, "nav.month")}</button>
            <button type="button" onClick={() => setActiveTab("events")} style={tabStyle(project.uiSettings.activeTab === "events")}>{t(project.locale, "nav.events")}</button>
            <button type="button" onClick={() => setActiveTab("settings")} style={tabStyle(project.uiSettings.activeTab === "settings")}>{t(project.locale, "nav.settings")}</button>
            <button type="button" onClick={() => setActiveTab("player")} style={tabStyle(project.uiSettings.activeTab === "player")}>{t(project.locale, "nav.player")}</button>
          </div>

          {project.uiSettings.activeTab === "month" ? (
            <MonthView project={project} />
          ) : project.uiSettings.activeTab === "events" ? (
            <EventsView project={project} onProjectUpdate={updateProject} />
          ) : project.uiSettings.activeTab === "settings" ? (
            <SettingsView project={project} onProjectUpdate={updateProject} saveError={saveError} scope={scope} onReset={handleReset} />
          ) : project.uiSettings.activeTab === "player" ? (
            <PlayerView project={project} />
          ) : (
            <TodayView project={project} onProjectUpdate={updateProject} onReset={handleReset} />
          )}
        </>
      ) : (
        <PlayerView project={project} />
      )}
    </main>
  );
};

const tabStyle = (active: boolean) => ({ border: "1px solid #374151", borderRadius: 6, background: active ? "#2563eb" : "#1f2937", color: "#f3f4f6", padding: "6px 8px", fontSize: 12 });