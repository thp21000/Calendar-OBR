import { useMemo, useState } from "react";
import { normalizePlayerViewSettings } from "../calendar/playerViewSettings";
import type { CalendarProject, PlayerViewTab } from "../domain/types";
import { t } from "../i18n/messages";
import type { PublicCalendarTodaySnapshot } from "../obr/publicSnapshot";
import type { PublicEventDetails } from "./player/PublicEventDetailsPopup";
import { PublicEventDetailsPopup } from "./player/PublicEventDetailsPopup";
import { PlayerDayNotesCard } from "./player/PlayerDayNotesCard";
import { PlayerHeaderCard } from "./player/PlayerHeaderCard";
import { PlayerOverviewCard } from "./player/PlayerOverviewCard";
import { PlayerPublicEventsCard } from "./player/PlayerPublicEventsCard";
import { PlayerPublicMoonEventsCard } from "./player/PlayerPublicMoonEventsCard";
import { PlayerWeatherCard } from "./player/PlayerWeatherCard";
import { PlayerHourlyForecastCard } from "./player/PlayerHourlyForecastCard";
import { PlayerMonthView } from "./player/PlayerMonthView";
import { buildPlayerViewModelFromProject, buildPlayerViewModelFromSnapshot } from "./player/playerViewModel";
import { EmptyState, SectionCard } from "./ui";

export const PlayerView = ({ project, snapshot }: { project: CalendarProject; snapshot?: PublicCalendarTodaySnapshot | null }) => {
  const [selectedPublicEvent, setSelectedPublicEvent] = useState<PublicEventDetails | null>(null);
  const settings = useMemo(() => normalizePlayerViewSettings(snapshot?.playerView ?? project.uiSettings.playerView), [project.uiSettings.playerView, snapshot?.playerView]);
  const [selectedTab, setSelectedTab] = useState<PlayerViewTab>(settings.defaultTab);
  const activeTab = settings.enabledTabs[selectedTab] ? selectedTab : settings.defaultTab;
  const showTabSelector = settings.enabledTabs.today && settings.enabledTabs.month;
  const model = useMemo(
    () => snapshot ? buildPlayerViewModelFromSnapshot(project, snapshot, settings) : buildPlayerViewModelFromProject(project, settings),
    [project, settings, snapshot]
  );
  const overviewBlocks = {
    season: settings.today.showSeason,
    weather: settings.today.showWeather,
    biome: settings.today.showBiome,
    moons: settings.today.showMoons
  };
  const shouldShowOverview = overviewBlocks.season || overviewBlocks.weather || overviewBlocks.biome || overviewBlocks.moons;
  const hasVisibleTodayContent = settings.today.showHeader || settings.today.showDate || shouldShowOverview || model.hourlyForecast.length > 0 || model.events.length > 0 || model.weatherEvents.length > 0 || model.moonEvents.length > 0 || model.dayNotes.length > 0;
  
  return (
    <>
      {showTabSelector ? <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <TabButton active={activeTab === "today"} label={t(model.locale, "player.tab.today")} onClick={() => setSelectedTab("today")} />
        <TabButton active={activeTab === "month"} label={t(model.locale, "player.tab.month")} onClick={() => setSelectedTab("month")} />
      </div> : null}

      {activeTab === "month" ? <PlayerMonthView project={snapshot ? undefined : project} snapshotMonth={snapshot?.month} isSnapshotMode={Boolean(snapshot)} settings={settings} locale={model.locale} onSelectEvent={setSelectedPublicEvent} /> : <>
        {settings.today.showHeader || settings.today.showDate ? <PlayerHeaderCard locale={model.locale} calendarName={model.calendarName} formattedDate={model.formattedDate} showHeader={settings.today.showHeader} showDate={settings.today.showDate} /> : null}
        {shouldShowOverview ? <PlayerOverviewCard locale={model.locale} model={model} visibleBlocks={overviewBlocks} /> : null}
        {model.weather ? <PlayerWeatherCard locale={model.locale} model={{ weather: model.weather, biome: model.biome }} /> : null}
        {model.hourlyForecast.length > 0 ? <PlayerHourlyForecastCard locale={model.locale} forecast={model.hourlyForecast} /> : null}
        {settings.today.showEvents ? <PlayerPublicEventsCard locale={model.locale} events={model.events} onSelectEvent={setSelectedPublicEvent} /> : null}
        {model.weatherEvents.length > 0 ? (
          <PlayerPublicEventsCard
            locale={model.locale}
            title={t(model.locale, "player.publicWeatherEvents")}
            emptyText={t(model.locale, "player.noPublicWeatherEvents")}
            events={model.weatherEvents}
            onSelectEvent={setSelectedPublicEvent}
          />
        ) : null}
        {settings.today.showMoonEvents ? <PlayerPublicMoonEventsCard locale={model.locale} events={model.moonEvents} onSelectEvent={setSelectedPublicEvent} /> : null}
        {settings.today.showDayNotes ? <PlayerDayNotesCard locale={model.locale} notes={model.dayNotes} /> : null}
        {!hasVisibleTodayContent ? <SectionCard><EmptyState text={t(model.locale, "player.noVisibleContent")} /></SectionCard> : null}
      </>}

      {selectedPublicEvent ? <PublicEventDetailsPopup locale={model.locale} event={selectedPublicEvent} onClose={() => setSelectedPublicEvent(null)} /> : null}
    </>
  );
};

const TabButton = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} style={{ border: "1px solid #374151", borderRadius: 999, background: active ? "#2563eb" : "#111827", color: active ? "white" : "#d1d5db", padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>{label}</button>
);