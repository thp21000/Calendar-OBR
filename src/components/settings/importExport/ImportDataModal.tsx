import { useState } from "react";
import type { ChangeEvent } from "react";
import type { CalendarProject, LocaleCode } from "../../../domain/types";
import { applyCalendarSections, CAMPAIGN_SECTION_IDS, CALENDAR_SECTION_IDS, CONFIGURATION_SECTION_IDS, readCalendarImportFileFromText, type CalendarImportFile, type CalendarSectionId } from "../../../calendar/calendarConfigurationFile";
import { t } from "../../../i18n/messages";
import { DataSectionCheckboxList } from "./DataSectionCheckboxList";
import { Footer, Modal, buttonStyle, primaryStyle } from "./ExportDataModal";
import { JsonPreviewEditor } from "./JsonPreviewEditor";

type ImportMode = "replace" | "configuration" | "custom";

export const ImportDataModal = ({ project, locale, onClose, onProjectUpdate, onStatus }: { project: CalendarProject; locale: LocaleCode; onClose: () => void; onProjectUpdate: (project: CalendarProject) => void; onStatus: (message: string) => void }) => {
  const [detected, setDetected] = useState<CalendarImportFile | null>(null);
  const [selectedIds, setSelectedIds] = useState<CalendarSectionId[]>([]);
  const [mode, setMode] = useState<ImportMode>("custom");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualJson, setManualJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const detectText = (text: string) => {
    const result = readCalendarImportFileFromText(text);
    if (!result.ok) { setError(result.error || t(locale, "settings.importExport.unrecognizedFile")); setDetected(null); setSelectedIds([]); return; }
    setDetected(result.importFile);
    setError(null);
    if (result.importFile.type === "project") { setMode("replace"); setSelectedIds([...CALENDAR_SECTION_IDS]); }
    else { setMode("custom"); setSelectedIds(result.importFile.defaultSelectedSectionIds); }
  };
  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; detectText(await file.text());
  };
  const apply = () => {
    if (!detected) { setError(t(locale, "settings.importExport.unrecognizedFile")); return; }
    const ids = mode === "replace" && detected.type === "project" ? [...CALENDAR_SECTION_IDS] : mode === "configuration" ? [...CONFIGURATION_SECTION_IDS].filter((id) => detected.availableSectionIds.includes(id)) : selectedIds;
    if (ids.length === 0) { setError(t(locale, "settings.importExport.noSectionSelected")); return; }
    const risky = detected.type === "project" && mode === "replace" || ids.some((id) => CAMPAIGN_SECTION_IDS.includes(id));
    if (risky && !window.confirm(t(locale, "settings.importExport.campaignWarning"))) return;
    const applied = mode === "replace" && detected.type === "project" ? { ok: true as const, project: detected.project } : applyCalendarSections(project, detected.sections, ids);
    if (!applied.ok) { setError(applied.error); return; }
    onProjectUpdate(applied.project); onStatus(t(locale, "settings.importSuccess")); onClose();
  };
  return <Modal title={t(locale, "settings.importExport.importTitle")} onClose={onClose}>
    <label style={{ display: "grid", gap: 4, fontSize: 12 }}><span>{t(locale, "settings.importExport.importFile")}</span><input type="file" accept="application/json,.json" onChange={onFile} /></label>
    <JsonPreviewEditor locale={locale} open={manualOpen} json={manualJson} error={null} label={t(locale, "settings.importExport.editJsonImport")} onToggle={() => setManualOpen((value) => !value)} onChange={setManualJson} />
    {manualOpen ? <button type="button" onClick={() => detectText(manualJson)} style={buttonStyle}>{t(locale, "settings.importExport.detectFileType")}</button> : null}
    {detected ? <div style={{ fontSize: 12, color: "#cbd5e1" }}>{t(locale, "settings.importExport.detectedFileType")}: {t(locale, `settings.importExport.type.${detected.type}`)}</div> : null}
    {detected?.type === "project" ? <div style={{ display: "grid", gap: 6 }}>
      <Choice label={t(locale, "settings.importExport.replaceFullProject")} checked={mode === "replace"} onClick={() => { setMode("replace"); setSelectedIds([...CALENDAR_SECTION_IDS]); }} />
      <Choice label={t(locale, "settings.importExport.configurationOnly")} checked={mode === "configuration"} onClick={() => { setMode("configuration"); setSelectedIds([...CONFIGURATION_SECTION_IDS]); }} />
      <Choice label={t(locale, "settings.importExport.customExport")} checked={mode === "custom"} onClick={() => setMode("custom")} />
    </div> : null}
    {detected && mode !== "replace" ? <><h4>{t(locale, "settings.importExport.sectionsToImport")}</h4><DataSectionCheckboxList locale={locale} sectionIds={detected.availableSectionIds} selectedSectionIds={selectedIds} onChange={setSelectedIds} /></> : null}
    {selectedIds.some((id) => CAMPAIGN_SECTION_IDS.includes(id)) || (detected?.type === "project" && mode === "replace") ? <div style={{ color: "#fbbf24", fontSize: 12 }}>{t(locale, "settings.importExport.campaignWarning")}</div> : null}
    {error ? <div style={{ color: "#fca5a5", fontSize: 12 }}>{error}</div> : null}
    <Footer><button type="button" onClick={onClose} style={buttonStyle}>{t(locale, "common.cancel")}</button><button type="button" onClick={apply} style={primaryStyle}>{t(locale, "settings.importExport.importSelected")}</button></Footer>
  </Modal>;
};

const Choice = ({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) => <button type="button" onClick={onClick} style={{ ...buttonStyle, borderColor: checked ? "#60a5fa" : "#4b5563", textAlign: "left" }}>{label}</button>;
