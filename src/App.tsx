import { useEffect, useState } from "react";
import type { CalendarProject } from "./domain/types";
import { t } from "./i18n/messages";
import { MonthView } from "./components/MonthView";
import { SettingsView } from "./components/SettingsView";
import { TodayView } from "./components/TodayView";
import { getStorageScope, type StorageScope } from "./obr/roomScope";
import { loadCalendarProject, resetCalendarProject, saveCalendarProject } from "./storage/calendarStorage";

export const App = () => {
  const [scope, setScope] = useState<StorageScope | null>(null);
  const [project, setProject] = useState<CalendarProject | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getStorageScope().then((resolved) => {
      setScope(resolved);
      setProject(loadCalendarProject(resolved.storageKey));
    });
  }, []);

  if (!scope || !project) {
    return <main style={{ width: 360, minHeight: 480, padding: 12, color: "#e5e7eb", background: "#10131a" }}>{t("fr", "common.loading")}</main>;
  }

  const updateProject = (nextProject: CalendarProject) => {
    const result = saveCalendarProject(nextProject, scope.storageKey);
    if (result.ok) {
      setProject(nextProject);
      setSaveError(null);
    } else setSaveError(result.error);
  };

  const setActiveTab = (activeTab: "today" | "month" | "settings") => {
    updateProject({ ...project, uiSettings: { ...project.uiSettings, activeTab } });
  };

  const handleReset = () => {
    const reset = resetCalendarProject(scope.storageKey);
    setProject(reset);
  };

  return (
    <main
      style={{
        width: "100%",
        maxWidth: 360,
        minHeight: 480,
        boxSizing: "border-box",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 13,
        background: "#10131a",
        color: "#e5e7eb",
        padding: 12,
        borderRadius: 8,
        overflowX: "hidden"
      }}
    >
      <h1 style={{ fontSize: 16, margin: "0 0 10px" }}>{t(project.locale, "app.title")}</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
        <button type="button" onClick={() => setActiveTab("today")} style={tabStyle(project.uiSettings.activeTab === "today")}>{t(project.locale, "nav.today")}</button>
        <button type="button" onClick={() => setActiveTab("month")} style={tabStyle(project.uiSettings.activeTab === "month")}>{t(project.locale, "nav.month")}</button>
        <button type="button" onClick={() => setActiveTab("settings")} style={tabStyle(project.uiSettings.activeTab === "settings")}>{t(project.locale, "nav.settings")}</button>
      </div>

      {project.uiSettings.activeTab === "month" ? (
        <MonthView project={project} />
      ) : project.uiSettings.activeTab === "settings" ? (
        <SettingsView project={project} onProjectUpdate={updateProject} saveError={saveError} />
      ) : (
        <TodayView project={project} onProjectUpdate={updateProject} onReset={handleReset} />
      )}
    </main>
  );
};

const tabStyle = (active: boolean) => ({ border: "1px solid #374151", borderRadius: 6, background: active ? "#2563eb" : "#1f2937", color: "#f3f4f6", padding: "6px 8px", fontSize: 12 });