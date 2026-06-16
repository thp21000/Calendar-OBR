import { useMemo, useState } from "react";
import type { CalendarProject, LocaleCode } from "../../../domain/types";
import { buildCalendarConfigurationFileName, buildCalendarCustomExportFileName, buildCalendarProjectFileName, buildCalendarCustomExportFile, buildCalendarConfigurationFile, CALENDAR_SECTION_IDS, CAMPAIGN_SECTION_IDS, CONFIGURATION_SECTION_IDS, type CalendarSectionId, downloadJsonFile } from "../../../calendar/calendarConfigurationFile";
import { exportCalendarProject } from "../../../importExport/calendarImportExport";
import { t } from "../../../i18n/messages";
import { DataSectionCheckboxList } from "./DataSectionCheckboxList";
import { JsonPreviewEditor } from "./JsonPreviewEditor";

type ExportMode = "project" | "configuration" | "custom";

export const ExportDataModal = ({ project, locale, onClose, onStatus }: { project: CalendarProject; locale: LocaleCode; onClose: () => void; onStatus: (message: string) => void }) => {
  const [mode, setMode] = useState<ExportMode>("configuration");
  const [selectedIds, setSelectedIds] = useState<CalendarSectionId[]>([...CONFIGURATION_SECTION_IDS]);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonOverride, setJsonOverride] = useState("");
  const [error, setError] = useState<string | null>(null);
  const effectiveIds = mode === "project" ? [...CALENDAR_SECTION_IDS] : mode === "configuration" ? [...CONFIGURATION_SECTION_IDS] : selectedIds;
  const generatedJson = useMemo(() => {
    if (mode === "project") return exportCalendarProject(project);
    if (mode === "configuration") return JSON.stringify(buildCalendarConfigurationFile(project), null, 2);
    return JSON.stringify(buildCalendarCustomExportFile(project, effectiveIds), null, 2);
  }, [project, mode, effectiveIds.join("|")]);
  const json = jsonOverride || generatedJson;

  const chooseMode = (nextMode: ExportMode) => {
    setMode(nextMode);
    setJsonOverride("");
    setSelectedIds(nextMode === "project" ? [...CALENDAR_SECTION_IDS] : nextMode === "configuration" ? [...CONFIGURATION_SECTION_IDS] : [...CONFIGURATION_SECTION_IDS]);
  };
  const exportFile = () => {
    if (effectiveIds.length === 0) { setError(t(locale, "settings.importExport.noSectionSelected")); return; }
    try { JSON.parse(json); } catch { setError(t(locale, "settings.invalidConfigurationFile")); return; }
    const fileName = mode === "project" ? buildCalendarProjectFileName() : mode === "configuration" ? buildCalendarConfigurationFileName() : buildCalendarCustomExportFileName();
    downloadJsonFile(json, fileName);
    onStatus(t(locale, "settings.exportSuccess"));
    onClose();
  };
  return <Modal title={t(locale, "settings.importExport.exportTitle")} onClose={onClose}>
    <Choice label={t(locale, "settings.importExport.fullProject")} help={t(locale, "settings.importExport.fullProjectHelp")} checked={mode === "project"} onClick={() => chooseMode("project")} />
    <Choice label={t(locale, "settings.importExport.configurationOnly")} help={t(locale, "settings.importExport.configurationOnlyHelp")} checked={mode === "configuration"} onClick={() => chooseMode("configuration")} />
    <Choice label={t(locale, "settings.importExport.customExport")} help={t(locale, "settings.importExport.customExportHelp")} checked={mode === "custom"} onClick={() => chooseMode("custom")} />
    {mode === "custom" ? <>
      <h4>{t(locale, "settings.importExport.sectionsToExport")}</h4>
      <QuickButtons locale={locale} onSet={setSelectedIds} />
      <DataSectionCheckboxList locale={locale} sectionIds={[...CALENDAR_SECTION_IDS]} selectedSectionIds={selectedIds} onChange={setSelectedIds} />
    </> : null}
    <JsonPreviewEditor locale={locale} open={jsonOpen} json={json} error={error} label={t(locale, "settings.importExport.editJsonExport")} onToggle={() => setJsonOpen((value) => !value)} onChange={setJsonOverride} />
    <Footer><button type="button" onClick={onClose} style={buttonStyle}>{t(locale, "common.cancel")}</button><button type="button" onClick={exportFile} style={primaryStyle}>{t(locale, "settings.importExport.exportFile")}</button></Footer>
  </Modal>;
};

const QuickButtons = ({ locale, onSet }: { locale: LocaleCode; onSet: (ids: CalendarSectionId[]) => void }) => <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
  <button style={buttonStyle} type="button" onClick={() => onSet([...CALENDAR_SECTION_IDS])}>{t(locale, "settings.importExport.selectAll")}</button>
  <button style={buttonStyle} type="button" onClick={() => onSet([])}>{t(locale, "settings.importExport.clearAll")}</button>
  <button style={buttonStyle} type="button" onClick={() => onSet([...CONFIGURATION_SECTION_IDS])}>{t(locale, "settings.importExport.configurationOnly")}</button>
  <button style={buttonStyle} type="button" onClick={() => onSet([...CAMPAIGN_SECTION_IDS])}>{t(locale, "settings.importExport.campaignOnly")}</button>
</div>;

const Choice = ({ label, help, checked, onClick }: { label: string; help: string; checked: boolean; onClick: () => void }) => <button type="button" onClick={onClick} style={{ ...choiceStyle, borderColor: checked ? "#60a5fa" : "#374151" }}><strong>{label}</strong><span>{help}</span></button>;
export const Modal = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => <div style={backdropStyle}><div style={modalStyle}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><h3 style={{ margin: 0 }}>{title}</h3><button type="button" onClick={onClose} style={buttonStyle}>×</button></div>{children}</div></div>;
export const Footer = ({ children }: { children: React.ReactNode }) => <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>{children}</div>;
export const buttonStyle = { border: "1px solid #4b5563", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "5px 8px", fontSize: 12 };
export const primaryStyle = { ...buttonStyle, background: "#2563eb", borderColor: "#60a5fa" };
export const textareaStyle = { minHeight: 180, resize: "vertical" as const, width: "100%", boxSizing: "border-box" as const, border: "1px solid #4b5563", borderRadius: 6, background: "#0f172a", color: "#e5e7eb", padding: 8, fontFamily: "monospace", fontSize: 12 };
const backdropStyle = { position: "fixed" as const, inset: 0, background: "rgba(2,6,23,0.72)", zIndex: 50, display: "grid", placeItems: "center", padding: 12 };
const modalStyle = { width: "min(720px, 100%)", maxHeight: "88vh", overflow: "auto", display: "grid", gap: 10, background: "#111827", border: "1px solid #374151", borderRadius: 10, padding: 12, color: "#e5e7eb", boxShadow: "0 20px 50px rgba(0,0,0,.45)" };
const choiceStyle = { display: "grid", gap: 3, textAlign: "left" as const, border: "1px solid #374151", borderRadius: 8, background: "#0f172a", color: "#e5e7eb", padding: 8 };
