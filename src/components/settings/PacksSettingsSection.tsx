import { useRef, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import type { CalendarPack, CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { getBuiltInCalendarPacks, getCalendarPackSummary, importCalendarPack, validateCalendarPack } from "../../packs/calendarPacks";

type Props = {
  project: CalendarProject;
  onProjectUpdate: (project: CalendarProject) => void;
};

export const PacksSettingsSection = ({ project, onProjectUpdate }: Props) => {
  const buttonStyle = {
    border: "1px solid #4b5563",
    borderRadius: 6,
    background: "#1f2937",
    color: "#e5e7eb",
    padding: "5px 8px",
    fontSize: 12,
    width: "fit-content"
  } as const;

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPack, setSelectedPack] = useState<CalendarPack | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const packs = useMemo(() => getBuiltInCalendarPacks(project.locale), [project.locale]);

  const onApplyPack = (pack: CalendarPack) => {
    if (!window.confirm(t(project.locale, "packs.confirmApply"))) return;
    const result = importCalendarPack(pack, project);
    if (result.ok) {
      setErrorMessage(null);
      onProjectUpdate(result.project);
      return;
    }
    setErrorMessage(t(project.locale, "packs.applyError"));
  };

  const onImportFileClick = () => fileInputRef.current?.click();

  const onImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const validation = validateCalendarPack(parsed);
      if (!validation.ok) {
        setSelectedPack(null);
        setErrorMessage(t(project.locale, "packs.importError"));
        return;
      }

      setSelectedPack(validation.pack);
      setErrorMessage(null);

      if (!window.confirm(t(project.locale, "packs.importConfirm"))) return;

      const result = importCalendarPack(validation.pack, project);
      if (result.ok) {
        onProjectUpdate(result.project);
        return;
      }
      setErrorMessage(t(project.locale, "packs.importError"));
    } catch {
      setSelectedPack(null);
      setErrorMessage(t(project.locale, "packs.importError"));
    }
  };

  if (packs.length === 0) return <div>{t(project.locale, "packs.empty")}</div>;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div>
        <button type="button" onClick={onImportFileClick} style={buttonStyle}>{t(project.locale, "packs.importJson")}</button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={onImportFile} />
      </div>

      {selectedPack ? (
        <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, display: "grid", gap: 4 }}>
          <div style={{ fontWeight: 600 }}>{t(project.locale, "packs.selectedPack")}</div>
          <div style={{ fontWeight: 600 }}>{selectedPack.name}</div>
          {selectedPack.description ? <div style={{ color: "#d1d5db" }}>{selectedPack.description}</div> : null}
          {selectedPack.author ? <div style={{ fontSize: 12 }}>{t(project.locale, "packs.author")}: {selectedPack.author}</div> : null}
          <div style={{ fontSize: 12 }}>{t(project.locale, "packs.version")}: {selectedPack.packVersion}</div>
          <div style={{ fontSize: 12 }}>{t(project.locale, "packs.language")}: {selectedPack.locale}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12, color: "#93c5fd" }}>
            <span>{t(project.locale, "packs.months")}: {getCalendarPackSummary(selectedPack).months}</span>
            <span>{t(project.locale, "packs.seasons")}: {getCalendarPackSummary(selectedPack).seasons}</span>
            <span>{t(project.locale, "packs.moons")}: {getCalendarPackSummary(selectedPack).moons}</span>
            <span>{t(project.locale, "packs.weatherEvents")}: {getCalendarPackSummary(selectedPack).weatherEvents}</span>
          </div>
        </div>
      ) : null}

      {packs.map((pack) => {
        const summary = getCalendarPackSummary(pack);
        return (
          <div key={pack.packId} style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, display: "grid", gap: 4 }}>
            <div style={{ fontWeight: 600 }}>{pack.name}</div>
            {pack.description ? <div style={{ color: "#d1d5db" }}>{pack.description}</div> : null}
            {pack.author ? <div style={{ fontSize: 12 }}>{t(project.locale, "packs.author")}: {pack.author}</div> : null}
            <div style={{ fontSize: 12 }}>{t(project.locale, "packs.version")}: {pack.packVersion}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12, color: "#93c5fd" }}>
              <span>{t(project.locale, "packs.months")}: {summary.months}</span>
              <span>{t(project.locale, "packs.seasons")}: {summary.seasons}</span>
              <span>{t(project.locale, "packs.moons")}: {summary.moons}</span>
              <span>{t(project.locale, "packs.weatherEvents")}: {summary.weatherEvents}</span>
            </div>
            <button type="button" onClick={() => onApplyPack(pack)} style={buttonStyle}>
              {t(project.locale, "packs.apply")}
            </button>
          </div>
        );
      })}
      {errorMessage ? <div style={{ color: "#fca5a5", fontSize: 12 }}>{errorMessage}</div> : null}
    </div>
  );
};