import {
  DEFAULT_WEATHER_BIOME_PROFILES,
  WEATHER_BIOME_DEFINITIONS,
  normalizeWeatherBiomeProfile,
  type WeatherBiomeId,
  type WeatherBiomeProfile
} from "../../calendar/weather/biomes";
import { getWeatherUnitLabels } from "../../calendar/weatherUnits";
import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { CollapsibleSection } from "../CollapsibleSection";
import { BiomeProfileEditor } from "./WeatherProfileEditor";

export const WeatherBiomesSettingsSection = ({
  project,
  onProjectUpdate,
  inputStyle
}: {
  project: CalendarProject;
  onProjectUpdate: (project: CalendarProject) => void;
  inputStyle: React.CSSProperties;
}) => {
  const units = getWeatherUnitLabels(project.locale);

  const getProfile = (biomeId: WeatherBiomeId): WeatherBiomeProfile =>
    normalizeWeatherBiomeProfile(project.weatherBiomeProfiles?.[biomeId] ?? DEFAULT_WEATHER_BIOME_PROFILES[biomeId]);

  const updateProfile = (biomeId: WeatherBiomeId, profile: WeatherBiomeProfile) => {
    onProjectUpdate({
      ...project,
      weatherBiomeProfiles: {
        ...(project.weatherBiomeProfiles ?? {}),
        [biomeId]: normalizeWeatherBiomeProfile(profile)
      }
    });
  };

  const resetProfile = (biomeId: WeatherBiomeId) => {
    if (!window.confirm(t(project.locale, "weatherBiomes.confirmReset"))) return;
    const nextProfiles = { ...(project.weatherBiomeProfiles ?? {}) };
    delete nextProfiles[biomeId];
    onProjectUpdate({
      ...project,
      weatherBiomeProfiles: Object.keys(nextProfiles).length > 0 ? nextProfiles : undefined
    });
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>{t(project.locale, "weatherBiomes.baseProfileHelp")}</div>
      {WEATHER_BIOME_DEFINITIONS.map((definition) => (
        <CollapsibleSection
          key={definition.id}
          title={`${definition.icon} ${t(project.locale, definition.nameKey)}`}
          storageKey={`calendar-obr.settings.weatherBiome.${definition.id}`}
        >
          <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 8 }}>{t(project.locale, definition.descriptionKey)}</div>
          <BiomeProfileEditor
            locale={project.locale}
            units={units}
            inputStyle={inputStyle}
            profile={getProfile(definition.id)}
            onChange={(profile) => updateProfile(definition.id, profile)}
          />
          <button
            type="button"
            onClick={() => resetProfile(definition.id)}
            title={t(project.locale, "weatherProfile.help.resetBiome")}
            style={{ border: "1px solid #7f1d1d", borderRadius: 6, background: "#450a0a", color: "#fecaca", padding: "5px 8px", fontSize: 12 }}
          >
            {t(project.locale, "weatherBiomes.reset")}
          </button>
        </CollapsibleSection>
      ))}
    </div>
  );
};
