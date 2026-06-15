import type { LocaleCode } from "../../domain/types";
import { t } from "../../i18n/messages";
import { Badge, SectionCard } from "../ui";
import { ui } from "../ui/styles";

export const PlayerHeaderCard = ({ locale, calendarName, formattedDate, showHeader = true, showDate = true }: { locale: LocaleCode; calendarName: string; formattedDate: string; showHeader?: boolean; showDate?: boolean }) => (
  <SectionCard style={{ display: "grid", gap: 6, background: ui.colors.surfaceElevated, borderColor: "#475569", boxShadow: "0 2px 10px rgba(2,6,23,0.22)" }}>
    {showHeader ? <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
      <div>
        <div style={{ fontSize: 11, color: "#93c5fd", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>{t(locale, "player.publicToday")}</div>
        <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>{calendarName}</div>
      </div>
      <Badge>{t(locale, "player.readOnly")}</Badge>
    </div> : null}
    {showDate ? <div style={{ fontSize: 14, color: "#e5e7eb", fontWeight: 700 }}>{formattedDate}</div> : null}
  </SectionCard>
);