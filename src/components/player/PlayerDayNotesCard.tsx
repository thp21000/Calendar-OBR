import type { LocaleCode } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EmptyState, SectionCard, SectionHeader } from "../ui";

export const PlayerDayNotesCard = ({ locale, notes }: { locale: LocaleCode; notes: Array<{ id: string; playerNote?: string }> }) => (
  <SectionCard>
    <SectionHeader title={t(locale, "player.dayNotes")} />
    {notes.length === 0 ? <EmptyState text={t(locale, "player.noDayNotes")} /> : <div style={{ display: "grid", gap: 6 }}>
      {notes.map((note) => <div key={note.id} style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827", fontSize: 12, color: "#e5e7eb", whiteSpace: "pre-wrap" }}>{note.playerNote}</div>)}
    </div>}
  </SectionCard>
);