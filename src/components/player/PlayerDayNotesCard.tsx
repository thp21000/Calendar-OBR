import { t } from "../../i18n/messages";

export const PlayerDayNotesCard = ({ locale, notes }: { locale: "fr" | "en"; notes: Array<{ id: string; playerNote?: string }> }) => (
  <div style={{ border: "1px solid #374151", borderRadius: 8, padding: 8, marginTop: 10 }}>
    <div style={{ fontWeight: 700, marginBottom: 6 }}>{t(locale, "player.dayNotes")}</div>
    {notes.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 12 }}>{t(locale, "player.noDayNotes")}</div> : notes.map((n) => <div key={n.id} style={{ fontSize: 12 }}>{n.playerNote}</div>)}
  </div>
);
