import type { CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";
import type { StorageScope } from "../obr/roomScope";
import { CollapsibleSection } from "./CollapsibleSection";
import { CalendarStructureSettingsSection } from "./settings/CalendarStructureSettingsSection";
import { CurrentTimeSettingsSection } from "./settings/CurrentTimeSettingsSection";
import { DataSettingsSection } from "./settings/DataSettingsSection";
import { DisplaySettingsSection } from "./settings/DisplaySettingsSection";
import { GeneralSettingsSection } from "./settings/GeneralSettingsSection";
import { MoonsSettingsSection } from "./settings/MoonsSettingsSection";
import { PacksSettingsSection } from "./settings/PacksSettingsSection";
import { PlayerViewSettingsSection } from "./settings/PlayerViewSettingsSection";
import { SeasonsSettingsSection } from "./settings/SeasonsSettingsSection";
import { SceneWeatherProfilesSettingsSection } from "./settings/SceneWeatherProfilesSettingsSection";
import { WeatherBiomesSettingsSection } from "./settings/WeatherBiomesSettingsSection";
import { WeatherAdvancedConfigSection } from "./settings/WeatherAdvancedConfigSection";
import { WeatherSettingsSection } from "./settings/WeatherSettingsSection";

export const SettingsView = ({
  project,
  onProjectUpdate,
  saveError,
  scope,
  onReset
}: {
  project: CalendarProject;
  onProjectUpdate: (project: CalendarProject) => void;
  saveError: string | null;
  scope: StorageScope;
  onReset: () => void;
}) => {
  const switchToEvents = () => onProjectUpdate({ ...project, uiSettings: { ...project.uiSettings, activeTab: "events" } });

  return (
    <div style={{ maxHeight: 380, overflowY: "auto", overflowX: "hidden", paddingRight: 2 }}>
      {saveError ? <div style={{ color: "#fca5a5", marginBottom: 8 }}>{t(project.locale, "settings.saveError")}</div> : null}

      <SettingsGroup title={t(project.locale, "settings.group.essential")} help={t(project.locale, "settings.group.essentialHelp")} storageKey="calendar-obr.settings.group.essential" defaultOpen>
        <GeneralSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
      </SettingsGroup>

      <SettingsGroup title={t(project.locale, "settings.group.dateDisplay")} help={t(project.locale, "settings.group.dateDisplayHelp")} storageKey="calendar-obr.settings.group.dateDisplay">
        <CollapsibleSection title={t(project.locale, "settings.section.currentTime")} storageKey="calendar-obr.settings.section.currentTime">
          <CurrentTimeSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
        </CollapsibleSection>
        <CollapsibleSection title={t(project.locale, "settings.section.display")} storageKey="calendar-obr.settings.section.display">
          <DisplaySettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
        </CollapsibleSection>
      </SettingsGroup>

      <SettingsGroup title={t(project.locale, "settings.group.calendarStructure")} help={t(project.locale, "settings.group.calendarStructureHelp")} storageKey="calendar-obr.settings.group.calendarStructure">
        <CalendarStructureSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
      </SettingsGroup>

      <SettingsGroup title={t(project.locale, "settings.group.moons")} help={t(project.locale, "settings.group.moonsHelp")} storageKey="calendar-obr.settings.group.moons">
        <MoonsSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
      </SettingsGroup>

      <SettingsGroup title={t(project.locale, "settings.group.weather")} help={t(project.locale, "settings.group.weatherHelp")} storageKey="calendar-obr.settings.group.weather">
        <CollapsibleSection title={t(project.locale, "settings.weatherLayer.base")} storageKey="calendar-obr.settings.weatherLayer.base">
          <HelpText text={t(project.locale, "settings.weatherLayer.baseHelp")} />
          <WeatherSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} showOverrides={false} />
        </CollapsibleSection>
        <CollapsibleSection title={t(project.locale, "settings.weatherLayer.biomes")} storageKey="calendar-obr.settings.weatherLayer.biomes">
          <HelpText text={t(project.locale, "settings.weatherLayer.biomesHelp")} />
          <WeatherBiomesSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
        </CollapsibleSection>
        <CollapsibleSection title={t(project.locale, "settings.weatherLayer.seasons")} storageKey="calendar-obr.settings.weatherLayer.seasons">
          <HelpText text={t(project.locale, "settings.weatherLayer.seasonsHelp")} />
          <SeasonsSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
        </CollapsibleSection>
        <WeatherAdvancedConfigSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
        <CollapsibleSection title={t(project.locale, "settings.weatherLayer.events")} storageKey="calendar-obr.settings.weatherLayer.events">
          <HelpText text={t(project.locale, "settings.weatherLayer.eventsHelp")} />
          <button type="button" onClick={switchToEvents} style={buttonStyle}>{t(project.locale, "settings.weatherLayer.openEvents")}</button>
        </CollapsibleSection>
        <CollapsibleSection title={t(project.locale, "settings.weatherLayer.sceneForced")} storageKey="calendar-obr.settings.weatherLayer.sceneForced">
          <HelpText text={t(project.locale, "settings.weatherLayer.sceneForcedHelp")} />
          <CollapsibleSection title={t(project.locale, "settings.section.sceneWeatherProfiles")} storageKey="calendar-obr.settings.section.sceneWeatherProfiles">
            <SceneWeatherProfilesSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
          </CollapsibleSection>
          <CollapsibleSection title={t(project.locale, "weatherOverride.title")} storageKey="calendar-obr.settings.weatherOverrides">
            <WeatherSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} showBase={false} />
          </CollapsibleSection>
        </CollapsibleSection>
      </SettingsGroup>

      <SettingsGroup title={t(project.locale, "settings.group.playerView")} help={t(project.locale, "settings.group.playerViewHelp")} storageKey="calendar-obr.settings.group.playerView">
        <PlayerViewSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
      </SettingsGroup>

      <SettingsGroup title={t(project.locale, "settings.group.data")} help={t(project.locale, "settings.group.dataHelp")} storageKey="calendar-obr.settings.group.data">
        <CollapsibleSection title={t(project.locale, "settings.section.data")} storageKey="calendar-obr.settings.section.data">
          <DataSettingsSection project={project} onProjectUpdate={onProjectUpdate} locale={project.locale} scope={scope} />
        </CollapsibleSection>
        <CollapsibleSection title={t(project.locale, "settings.section.packs")} storageKey="calendar-obr.settings.section.packs">
          <PacksSettingsSection project={project} onProjectUpdate={onProjectUpdate} />
        </CollapsibleSection>
      </SettingsGroup>

      <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #374151" }}>
        <button
          type="button"
          onClick={() => { if (window.confirm(t(project.locale, "settings.resetCalendarConfirm"))) onReset(); }}
          style={resetButtonStyle}
        >
          {t(project.locale, "settings.resetCalendar")}
        </button>
      </div>
    </div>
  );
};

const SettingsGroup = ({ title, help, storageKey, defaultOpen, children }: { title: string; help: string; storageKey: string; defaultOpen?: boolean; children: React.ReactNode }) => (
  <CollapsibleSection title={title} storageKey={storageKey} defaultOpen={defaultOpen}>
    <HelpText text={help} />
    {children}
  </CollapsibleSection>
);

const HelpText = ({ text }: { text: string }) => <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.4, marginBottom: 8 }}>{text}</div>;

const inputStyle = { width: "100%", margin: "4px 0 8px", background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 6, padding: "6px 8px", boxSizing: "border-box" as const };
const buttonStyle = { border: "1px solid #374151", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "6px 10px", cursor: "pointer", fontSize: 12 };
const resetButtonStyle = { width: "100%", border: "1px solid #f87171", borderRadius: 8, background: "#7f1d1d", color: "#fee2e2", padding: "9px 12px", cursor: "pointer", fontSize: 13, fontWeight: 800 };