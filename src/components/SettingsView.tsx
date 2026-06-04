import type { CalendarProject } from "../domain/types";
import { t } from "../i18n/messages";
import type { StorageScope } from "../obr/roomScope";
import { CollapsibleSection } from "./CollapsibleSection";
import { CalendarStructureSettingsSection } from "./settings/CalendarStructureSettingsSection";
import { CurrentTimeSettingsSection } from "./settings/CurrentTimeSettingsSection";
import { DataSettingsSection } from "./settings/DataSettingsSection";
import { DisplaySettingsSection } from "./settings/DisplaySettingsSection";
import { FutureSettingsSection } from "./settings/FutureSettingsSection";
import { GeneralSettingsSection } from "./settings/GeneralSettingsSection";
import { MoonsSettingsSection } from "./settings/MoonsSettingsSection";
import { PacksSettingsSection } from "./settings/PacksSettingsSection";
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
  return (
    <div style={{ maxHeight: 380, overflowY: "auto", overflowX: "hidden", paddingRight: 2 }}>
      {saveError ? <div style={{ color: "#fca5a5", marginBottom: 8 }}>{t(project.locale, "settings.saveError")}</div> : null}

      <CollapsibleSection title={t(project.locale, "settings.section.general")} storageKey="calendar-obr.settings.section.general">
        <GeneralSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
      </CollapsibleSection>

      <CollapsibleSection title={t(project.locale, "settings.section.currentTime")} storageKey="calendar-obr.settings.section.currentTime">
        <CurrentTimeSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
      </CollapsibleSection>

      <CollapsibleSection title={t(project.locale, "settings.section.calendarStructure")} storageKey="calendar-obr.settings.section.calendarStructure">
        <CalendarStructureSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
      </CollapsibleSection>

      <CollapsibleSection title={t(project.locale, "settings.section.display")} storageKey="calendar-obr.settings.section.display">
        <DisplaySettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
      </CollapsibleSection>

      <CollapsibleSection title={t(project.locale, "settings.section.seasons")} storageKey="calendar-obr.settings.section.seasons">
        <SeasonsSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
      </CollapsibleSection>

      <CollapsibleSection title={t(project.locale, "settings.section.weatherBiomes")} storageKey="calendar-obr.settings.section.weatherBiomes">
        <WeatherBiomesSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
      </CollapsibleSection>

      <CollapsibleSection title={t(project.locale, "settings.section.sceneWeatherProfiles")} storageKey="calendar-obr.settings.section.sceneWeatherProfiles">
        <SceneWeatherProfilesSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
      </CollapsibleSection>
      
      <CollapsibleSection title={t(project.locale, "settings.section.moons")} storageKey="calendar-obr.settings.section.moons">
        <MoonsSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
      </CollapsibleSection>

      <CollapsibleSection title={t(project.locale, "settings.section.weather")} storageKey="calendar-obr.settings.section.weather">
        <WeatherSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
      </CollapsibleSection>

      <CollapsibleSection title={t(project.locale, "settings.weatherAdvancedConfig")} storageKey="calendar-obr.settings.section.weatherAdvancedConfig">
        <WeatherAdvancedConfigSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
      </CollapsibleSection>

      <CollapsibleSection title={t(project.locale, "settings.section.packs")} storageKey="calendar-obr.settings.section.packs">
        <PacksSettingsSection project={project} onProjectUpdate={onProjectUpdate} />
      </CollapsibleSection>

      <CollapsibleSection title={t(project.locale, "settings.section.data")} storageKey="calendar-obr.settings.section.data">
        <DataSettingsSection project={project} onProjectUpdate={onProjectUpdate} locale={project.locale} scope={scope} onReset={onReset} />
      </CollapsibleSection>

      <CollapsibleSection title={t(project.locale, "settings.section.future")} storageKey="calendar-obr.settings.section.future">
        <FutureSettingsSection locale={project.locale} />
      </CollapsibleSection>
    </div>
  );
};

const inputStyle = { width: "100%", margin: "4px 0 8px", background: "#1f2937", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 6, padding: "6px 8px", boxSizing: "border-box" as const };