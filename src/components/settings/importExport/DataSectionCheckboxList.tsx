import type { CalendarSectionId } from "../../../calendar/calendarConfigurationFile";
import { t } from "../../../i18n/messages";
import type { LocaleCode } from "../../../domain/types";

export const DataSectionCheckboxList = ({ locale, sectionIds, selectedSectionIds, onChange }: { locale: LocaleCode; sectionIds: CalendarSectionId[]; selectedSectionIds: CalendarSectionId[]; onChange: (ids: CalendarSectionId[]) => void }) => {
  const selected = new Set(selectedSectionIds);
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 6 }}>
    {sectionIds.map((id) => <label key={id} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#0f172a" }}>
      <input type="checkbox" checked={selected.has(id)} onChange={(event) => onChange(event.target.checked ? [...selectedSectionIds, id] : selectedSectionIds.filter((item) => item !== id))} />
      <span>{t(locale, `settings.importExport.section.${id}`)}</span>
    </label>)}
  </div>;
};
