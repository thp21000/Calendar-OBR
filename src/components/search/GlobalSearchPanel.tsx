import { useMemo, useState } from "react";
import { searchCalendarProject, type GlobalSearchResult } from "../../calendar/globalSearch";
import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";

export const GlobalSearchPanel = ({ project, onOpenResult }: { project: CalendarProject; onOpenResult?: (result: GlobalSearchResult) => void }) => {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchCalendarProject(project, query), [project, query]);
  const normalized = query.trim();

  return (
    <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t(project.locale, "globalSearch.title")}</div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t(project.locale, "globalSearch.placeholder")}
        style={{ width: "100%", background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 6, padding: "6px 8px", fontSize: 12, boxSizing: "border-box" }}
      />
      {normalized.length > 0 && normalized.length < 2 ? <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 6 }}>{t(project.locale, "globalSearch.minChars")}</div> : null}
      {normalized.length >= 2 && results.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 6 }}>{t(project.locale, "globalSearch.noResults")}</div> : null}
      {results.length > 0 ? (
        <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
          {results.map((result) => (
            <div key={result.id} style={{ border: "1px solid #374151", borderRadius: 6, padding: 6, background: "#111827" }}>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>
                {result.type === "event"
                  ? t(project.locale, "globalSearch.resultEvent")
                  : result.type === "moonEvent"
                    ? t(project.locale, "globalSearch.resultMoonEvent")
                    : t(project.locale, "globalSearch.resultDayNote")}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{result.title}</div>
              {result.summary ? <div style={{ fontSize: 12, color: "#d1d5db" }}>{result.summary.slice(0, 120)}</div> : null}
              <div style={{ fontSize: 11, color: "#9ca3af" }}>
                {result.date ? `${result.date.dayOfMonth}/${result.date.monthId}/${result.date.year}` : ""}
                {result.visibility ? ` · ${t(project.locale, "globalSearch.visibility")}: ${result.visibility}` : ""}
              </div>
              {onOpenResult ? <div style={{ marginTop: 4 }}><button type="button" style={{ border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#f3f4f6", padding: "4px 8px", fontSize: 11 }} onClick={() => onOpenResult(result)}>{t(project.locale, "globalSearch.open")}</button></div> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
