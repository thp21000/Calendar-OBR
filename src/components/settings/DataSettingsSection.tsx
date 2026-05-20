import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { CalendarProject } from "../../domain/types";
import { exportCalendarProject, importCalendarProject } from "../../importExport/calendarImportExport";
import { t } from "../../i18n/messages";
import type { StorageScope } from "../../obr/roomScope";

type Props = {
  project: CalendarProject;
  onProjectUpdate: (project: CalendarProject) => void;
  locale: "fr" | "en";
  scope: StorageScope;
  onReset: () => void;
};

const buildExportFileName = (project: CalendarProject): string => {
  const safeName = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "export";
  const date = new Date().toISOString().slice(0, 10);
  return `calendar-obr-${safeName}-${date}.json`;
};

export const DataSettingsSection = ({ project, onProjectUpdate, locale, scope, onReset }: Props) => {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onExport = () => {
    const json = exportCalendarProject(project);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildExportFileName(project);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMessage(t(locale, "settings.exportSuccess"));
  };

  const onImportClick = () => fileInputRef.current?.click();

  const onImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!window.confirm(t(locale, "settings.importConfirm"))) {
      setStatusMessage(t(locale, "settings.importCancelled"));
      return;
    }
    try {
      const text = await file.text();
      const result = importCalendarProject(text, project);
      if (result.ok) {
        onProjectUpdate(result.project);
        setStatusMessage(t(locale, "settings.importSuccess"));
      } else {
        setStatusMessage(t(locale, "settings.importError"));
      }
    } catch {
      setStatusMessage(t(locale, "settings.importError"));
    }
  };

  return (
    <>
      <div>{t(locale, "settings.storageScope")}: {scope.type === "obr-room" ? t(locale, "settings.storageScopeRoom") : "Local"}</div>
      <RowButtons>
        <Action onClick={onReset}>{t(locale, "settings.resetCalendar")}</Action>
        <Action onClick={onExport}>{t(locale, "settings.exportJson")}</Action>
        <Action onClick={onImportClick}>{t(locale, "settings.importJson")}</Action>
      </RowButtons>
      <input ref={fileInputRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={onImportFile} />
      {statusMessage ? <div style={{ fontSize: 12, color: "#93c5fd" }}>{statusMessage}</div> : null}
    </>
  );
};

const RowButtons = ({ children }: { children: React.ReactNode }) => <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>{children}</div>;
const Action = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button type="button" style={{ border: "1px solid #4b5563", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "5px 8px", fontSize: 12 }} {...props}>{children}</button>;