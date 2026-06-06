import type { LocaleCode } from "../../domain/types";
import { t } from "../../i18n/messages";
import { EmptyState, SectionCard, SectionHeader } from "../ui";
import type { PublicEventDetails } from "./PublicEventDetailsPopup";
import { PlayerPublicEventButton } from "./PlayerPublicEventsCard";

export const PlayerPublicMoonEventsCard = ({ locale, events, onSelectEvent }: { locale: LocaleCode; events: PublicEventDetails[]; onSelectEvent: (event: PublicEventDetails) => void }) => (
  <SectionCard>
    <SectionHeader title={t(locale, "player.publicMoonEvents")} />
    {events.length === 0 ? (
      <EmptyState text={t(locale, "player.noPublicMoonEvents")} />
    ) : (
      <div style={{ display: "grid", gap: 6 }}>
        {events.map((event) => <PlayerPublicEventButton key={event.id} event={event} onSelectEvent={onSelectEvent} />)}
      </div>
    )}
  </SectionCard>
);