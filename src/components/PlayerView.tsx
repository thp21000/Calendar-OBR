import { useMemo, useState } from "react";
import type { CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";
import type { PublicCalendarTodaySnapshot } from "../obr/publicSnapshot";
import type { PublicEventDetails } from "./player/PublicEventDetailsPopup";
import { PublicEventDetailsPopup } from "./player/PublicEventDetailsPopup";
import { PlayerHeaderCard } from "./player/PlayerHeaderCard";
import { PlayerDayNotesCard } from "./player/PlayerDayNotesCard";
import { PlayerOverviewCard } from "./player/PlayerOverviewCard";
import { PlayerPublicEventsCard } from "./player/PlayerPublicEventsCard";
import { PlayerPublicMoonEventsCard } from "./player/PlayerPublicMoonEventsCard";
import { PlayerWeatherCard } from "./player/PlayerWeatherCard";
import { buildPlayerViewModelFromProject, buildPlayerViewModelFromSnapshot } from "./player/playerViewModel";

export const PlayerView = ({ project, snapshot }: { project: CalendarProject; snapshot?: PublicCalendarTodaySnapshot | null }) => {
  const [selectedPublicEvent, setSelectedPublicEvent] = useState<PublicEventDetails | null>(null);
  const model = useMemo(
    () => snapshot ? buildPlayerViewModelFromSnapshot(project, snapshot) : buildPlayerViewModelFromProject(project),
    [project, snapshot]
  );
  
    return (
      <>
        <PlayerHeaderCard locale={model.locale} calendarName={model.calendarName} formattedDate={model.formattedDate} />
      <PlayerOverviewCard locale={model.locale} model={model} />
      <PlayerWeatherCard locale={model.locale} model={model} />
      <PlayerPublicEventsCard locale={model.locale} events={model.events} onSelectEvent={setSelectedPublicEvent} />
      {model.weatherEvents.length > 0 ? (
        <PlayerPublicEventsCard
          locale={model.locale}
          title={t(model.locale, "player.publicWeatherEvents")}
          emptyText={t(model.locale, "player.noPublicWeatherEvents")}
          events={model.weatherEvents}
          onSelectEvent={setSelectedPublicEvent}
        />
      ) : null}
      <PlayerPublicMoonEventsCard locale={model.locale} events={model.moonEvents} onSelectEvent={setSelectedPublicEvent} />
      <PlayerDayNotesCard locale={model.locale} notes={model.dayNotes} />

      {selectedPublicEvent ? <PublicEventDetailsPopup locale={model.locale} event={selectedPublicEvent} onClose={() => setSelectedPublicEvent(null)} /> : null}
    </>
  );
};