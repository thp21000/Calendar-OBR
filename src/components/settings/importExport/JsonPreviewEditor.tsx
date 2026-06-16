import type { LocaleCode } from "../../../domain/types";
import { t } from "../../../i18n/messages";
import { buttonStyle, textareaStyle } from "./ExportDataModal";

export const JsonPreviewEditor = ({ locale, open, json, error, label, onToggle, onChange }: { locale: LocaleCode; open: boolean; json: string; error?: string | null; label?: string; onToggle: () => void; onChange: (json: string) => void }) => <div style={{ display: "grid", gap: 6 }}>
  <button type="button" onClick={onToggle} style={buttonStyle}>{open ? t(locale, "common.collapse") : label ?? t(locale, "settings.importExport.editJsonImport")}</button>
  {open ? <>
    <textarea value={json} onChange={(event) => onChange(event.target.value)} style={textareaStyle} />
    {error ? <div style={{ color: "#fca5a5", fontSize: 12 }}>{error}</div> : null}
  </> : null}
</div>;
