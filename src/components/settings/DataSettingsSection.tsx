import { useState } from "react";
import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import type { StorageScope } from "../../obr/roomScope";
import { ExportDataModal } from "./importExport/ExportDataModal";
import { ImportDataModal } from "./importExport/ImportDataModal";

type Props = { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; locale: "fr" | "en"; scope: StorageScope; onReset: () => void };

export const DataSettingsSection = ({ project, onProjectUpdate, locale, scope }: Props) => {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [modal, setModal] = useState<"export" | "import" | null>(null);
  return <>
    <div>{t(locale, "settings.storageScope")}: {scope.type === "obr-room" ? t(locale, "settings.storageScopeRoom") : "Local"}</div>
    <RowButtons>
      <Action onClick={() => setModal("export")}>{t(locale, "settings.importExport.export")}</Action>
      <Action onClick={() => setModal("import")}>{t(locale, "settings.importExport.import")}</Action>
    </RowButtons>
    {statusMessage ? <div style={{ fontSize: 12, color: "#93c5fd", marginTop: 6 }}>{statusMessage}</div> : null}
    {modal === "export" ? <ExportDataModal project={project} locale={locale} onClose={() => setModal(null)} onStatus={setStatusMessage} /> : null}
    {modal === "import" ? <ImportDataModal project={project} locale={locale} onClose={() => setModal(null)} onProjectUpdate={onProjectUpdate} onStatus={setStatusMessage} /> : null}
  </>;
};

const RowButtons = ({ children }: { children: React.ReactNode }) => <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>{children}</div>;
const Action = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button type="button" style={{ border: "1px solid #4b5563", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "5px 8px", fontSize: 12 }} {...props}>{children}</button>;