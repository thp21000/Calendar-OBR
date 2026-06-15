import { useMemo, useState } from "react";
import { normalizePlayerViewSettings } from "../calendar/playerViewSettings";
import type { CalendarProject, PlayerViewTab } from "../domain/types";
import { t } from "../i18n/messages";
import type { PublicCalendarTodaySnapshot } from "../obr/publicSnapshot";
import type { PublicEventDetails } from "./player/PublicEventDetailsPopup";
import { PublicEventDetailsPopup } from "./player/PublicEventDetailsPopup";
import { PlayerMonthView } from "./player/PlayerMonthView";
import { buildPlayerViewModelFromProject, buildPlayerViewModelFromSnapshot } from "./player/playerViewModel";
import { TodayEventsCard } from "./today/TodayEventsCard";
import { TodayLayout } from "./today/TodayLayout";
import { TodayStatusSummary, WeatherForecastCard } from "./today/WeatherAndSeasonCard";
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
  const hasVisibleTodayContent = settings.today.showDate || settings.today.showSeason || settings.today.showWeather || settings.today.showBiome || settings.today.showMoons || settings.today.showEvents || settings.today.showWeatherEvents || settings.today.showMoonEvents || settings.today.showDayNotes || settings.today.showHourlyForecast;

  return (
    <>
      {showTabSelector ? <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <TabButton active={activeTab === "today"} label={t(model.locale, "player.tab.today")} onClick={() => setSelectedTab("today")} />
        <TabButton active={activeTab === "month"} label={t(model.locale, "player.tab.month")} onClick={() => setSelectedTab("month")} />
      </div> : null}

      {activeTab === "month" ? <PlayerMonthView project={snapshot ? undefined : project} snapshotMonth={snapshot?.month} isSnapshotMode={Boolean(snapshot)} settings={settings} locale={model.locale} onSelectEvent={setSelectedPublicEvent} /> : <>
        <TodayLayout
          locale={model.locale}
          visibility={{
            showStatus: settings.today.showDate || settings.today.showSeason || settings.today.showWeather || settings.today.showBiome || settings.today.showMoons || settings.today.showWeatherEvents,
            showDate: settings.today.showDate,
            showSeason: settings.today.showSeason,
            showWeather: settings.today.showWeather,
            showBiome: settings.today.showBiome,
            showMoons: settings.today.showMoons,
            showWeatherEvents: settings.today.showWeatherEvents,
            showEvents: settings.today.showEvents,
            showMoonEvents: settings.today.showMoonEvents,
            showDayNotes: settings.today.showDayNotes,
            showHourlyForecast: settings.today.showHourlyForecast,
            showQuickActions: false
          }}
          actions={{
            canEdit: false,
            canCreate: false,
            canChangeTime: false,
            canChangeBiome: false,
            canReset: false,
            canOpenGmDetails: false
          }}
          status={<TodayStatusSummary
            project={project}
            mode="player"
            readonly
            visibility={{
              showDate: settings.today.showDate,
              showSeason: settings.today.showSeason,
              showWeather: settings.today.showWeather,
              showBiome: settings.today.showBiome,
              showMoons: settings.today.showMoons,
              showWeatherEvents: settings.today.showWeatherEvents
            }}
            playerModel={model}
            currentSeason={undefined}
            currentWeather={undefined}
            triggeredWeatherEvents={[]}
            weatherUnits={{ temperature: "", windSpeed: "", rain: "", rainTotal: "" }}
            currentMoonPhases={[]}
            onSelectPublicWeatherEvent={setSelectedPublicEvent}
          />}
          events={<TodayEventsCard
            project={project}
            mode="player"
            readonly
            events={settings.today.showEvents ? model.events : []}
            weatherEvents={settings.today.showWeatherEvents ? model.weatherEvents : []}
            moonEvents={settings.today.showMoonEvents ? model.moonEvents : []}
            dayNotes={settings.today.showDayNotes ? model.dayNotes : []}
            eventsToday={[]}
            onSelectPublicEvent={setSelectedPublicEvent}
          />}
          forecast={<WeatherForecastCard
            project={project}
            mode="player"
            readonly
            detailLevel={settings.today.forecastDetailLevel}
            playerForecast={model.hourlyForecast}
            hourlyForecast={[]}
            weatherUnits={{ temperature: "", windSpeed: "", rain: "", rainTotal: "" }}
          />}
        />
        {!hasVisibleTodayContent ? <SectionCard><EmptyState text={t(model.locale, "player.noVisibleContent")} /></SectionCard> : null}
      </>}

      {selectedPublicEvent ? <PublicEventDetailsPopup locale={model.locale} event={selectedPublicEvent} onClose={() => setSelectedPublicEvent(null)} /> : null}
    </>
  );
};

const TabButton = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} style={{ border: "1px solid #374151", borderRadius: 999, background: active ? "#2563eb" : "#111827", color: active ? "white" : "#d1d5db", padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>{label}</button>
);