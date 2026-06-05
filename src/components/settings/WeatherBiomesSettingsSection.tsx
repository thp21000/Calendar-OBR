import {
  DEFAULT_WEATHER_BIOME_ID,
  DEFAULT_WEATHER_BIOME_PROFILES,
  WEATHER_BIOME_DEFINITIONS,
  getAbsoluteMinutes,
  getWeatherBiomeDefinition,
  getWeatherBiomeState,
  normalizeWeatherBiomeProfile,
  type WeatherBiomeId,
  type WeatherBiomeProfile
} from "../../calendar/weather/biomes";
import { getWeatherUnitLabels } from "../../calendar/weatherUnits";
import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { CollapsibleSection } from "../CollapsibleSection";
import { BiomeProfileEditor } from "./WeatherProfileEditor";

const helpStyle: React.CSSProperties = { fontSize: 12, color: "#9ca3af", marginBottom: 8, lineHeight: 1.4 };
const panelStyle: React.CSSProperties = { border: "1px solid #334155", borderRadius: 8, background: "#0f172a", padding: 10, marginBottom: 10 };
const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" };
const badgeStyle: React.CSSProperties = { border: "1px solid #475569", borderRadius: 999, padding: "2px 7px", color: "#cbd5e1", fontSize: 11, background: "#1e293b" };
const disabledBadgeStyle: React.CSSProperties = { ...badgeStyle, borderColor: "#7f1d1d", color: "#fecaca", background: "#450a0a" };
const resetButtonStyle: React.CSSProperties = { border: "1px solid #7f1d1d", borderRadius: 6, background: "#450a0a", color: "#fecaca", padding: "5px 8px", fontSize: 12 };
const secondaryButtonStyle: React.CSSProperties = { border: "1px solid #475569", borderRadius: 6, background: "#1e293b", color: "#e2e8f0", padding: "5px 8px", fontSize: 12 };

const confirmAction = (message: string): boolean => (typeof window === "undefined" ? true : window.confirm(message));

const withoutBiomeProfile = (profiles: CalendarProject["weatherBiomeProfiles"], biomeId: WeatherBiomeId) => {
  const nextProfiles = { ...(profiles ?? {}) };
  delete nextProfiles[biomeId];
  return Object.keys(nextProfiles).length > 0 ? nextProfiles : undefined;
};

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
  const biomeState = getWeatherBiomeState(project);
  const currentDefinition = getWeatherBiomeDefinition(biomeState.currentBiomeId);
  const disabledBiomeIds = new Set(biomeState.disabledBiomeIds ?? []);
  const selectableDefinitions = WEATHER_BIOME_DEFINITIONS.filter((definition) => definition.id === biomeState.currentBiomeId || !disabledBiomeIds.has(definition.id));

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
    if (!confirmAction(t(project.locale, "weatherBiomes.confirmReset"))) return;
    onProjectUpdate({ ...project, weatherBiomeProfiles: withoutBiomeProfile(project.weatherBiomeProfiles, biomeId) });
  };

  const resetAllProfiles = () => {
    if (!confirmAction(t(project.locale, "weatherBiomes.confirmResetAll"))) return;
    onProjectUpdate({ ...project, weatherBiomeProfiles: undefined });
  };

  const changeCurrentBiome = (biomeId: WeatherBiomeId) => {
    if (biomeId === biomeState.currentBiomeId) return;
    const nextDefinition = getWeatherBiomeDefinition(biomeId);
    const absoluteMinutes = getAbsoluteMinutes(project.currentTime);
    onProjectUpdate({
      ...project,
      weatherBiome: {
        ...biomeState,
        currentBiomeId: biomeId,
        previousBiomeId: biomeState.currentBiomeId,
        biomeChangedAtMinutes: absoluteMinutes,
        transitionDurationMinutes: nextDefinition.transitionDurationMinutes,
        disabledBiomeIds: biomeState.disabledBiomeIds?.filter((id) => id !== biomeId)
      }
    });
  };

  const resetBiomeTransition = () => {
    const stableState = { ...biomeState };
    delete stableState.previousBiomeId;
    delete stableState.biomeChangedAtMinutes;
    delete stableState.transitionDurationMinutes;
    onProjectUpdate({ ...project, weatherBiome: stableState });
  };

  const setBiomeAvailability = (biomeId: WeatherBiomeId, available: boolean) => {
    const nextDisabled = new Set(disabledBiomeIds);
    if (available || biomeId === biomeState.currentBiomeId) nextDisabled.delete(biomeId);
    else nextDisabled.add(biomeId);
    const disabledList = Array.from(nextDisabled);
    onProjectUpdate({
      ...project,
      weatherBiome: {
        ...biomeState,
        currentBiomeId: biomeState.currentBiomeId ?? DEFAULT_WEATHER_BIOME_ID,
        disabledBiomeIds: disabledList.length > 0 ? disabledList : undefined
      }
    });
  };

  return (
    <div>
      <div style={helpStyle}>{t(project.locale, "weatherBiomes.baseProfileHelp")}</div>
      <div style={helpStyle}>{t(project.locale, "weatherBiomes.customBiomesLater")}</div>

      <div style={panelStyle}>
        <div style={rowStyle}>
          <div>
            <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 700 }}>{t(project.locale, "weatherBiomes.currentBiome")}</div>
            <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>
              {currentDefinition.icon} {t(project.locale, currentDefinition.nameKey)} · {t(project.locale, currentDefinition.descriptionKey)}
            </div>
            <div style={{ ...helpStyle, marginBottom: 0, marginTop: 6 }}>{t(project.locale, "weatherBiomes.currentBiomeHelp")}</div>
          </div>
          <select value={biomeState.currentBiomeId} onChange={(event) => changeCurrentBiome(event.target.value as WeatherBiomeId)} style={{ ...inputStyle, minWidth: 180 }}>
            {selectableDefinitions.map((definition) => (
              <option key={definition.id} value={definition.id}>
                {definition.icon} {t(project.locale, definition.nameKey)}
              </option>
            ))}
          </select>
        </div>
        <div style={{ ...rowStyle, justifyContent: "flex-start", marginTop: 8 }}>
          {(biomeState.previousBiomeId || biomeState.biomeChangedAtMinutes !== undefined) && (
            <button type="button" onClick={resetBiomeTransition} style={secondaryButtonStyle}>
              {t(project.locale, "weatherBiomes.resetTransition")}
            </button>
          )}
          <button type="button" onClick={() => resetProfile(biomeState.currentBiomeId)} style={secondaryButtonStyle}>
            {t(project.locale, "weatherBiomes.resetCurrent")}
          </button>
          <button type="button" onClick={resetAllProfiles} style={resetButtonStyle}>
            {t(project.locale, "weatherBiomes.resetAll")}
          </button>
        </div>
      </div>

      {WEATHER_BIOME_DEFINITIONS.map((definition) => {
        const isCurrent = definition.id === biomeState.currentBiomeId;
        const isDisabled = disabledBiomeIds.has(definition.id) && !isCurrent;
        return (
          <CollapsibleSection
            key={definition.id}
            title={`${definition.icon} ${t(project.locale, definition.nameKey)}${isCurrent ? ` · ${t(project.locale, "weatherBiomes.currentBadge")}` : ""}${isDisabled ? ` · ${t(project.locale, "weatherBiomes.disabledBadge")}` : ""}`}
            storageKey={`calendar-obr.settings.weatherBiome.${definition.id}`}
          >
            <div style={panelStyle}>
              <div style={rowStyle}>
                <div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{t(project.locale, "weatherBiomes.technicalId")}: {definition.id}</div>
                  <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>{t(project.locale, definition.descriptionKey)}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={badgeStyle}>{t(project.locale, "weatherBiomes.predefinedBadge")}</span>
                  {isCurrent && <span style={badgeStyle}>{t(project.locale, "weatherBiomes.currentBadge")}</span>}
                  {isDisabled && <span style={disabledBadgeStyle}>{t(project.locale, "weatherBiomes.disabledBadge")}</span>}
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12, color: "#cbd5e1" }}>
                <input
                  type="checkbox"
                  checked={!isDisabled}
                  disabled={isCurrent}
                  onChange={(event) => setBiomeAvailability(definition.id, event.target.checked)}
                />
                {t(project.locale, "weatherBiomes.available")}
              </label>
              {isCurrent && <div style={{ ...helpStyle, marginTop: 4, marginBottom: 0 }}>{t(project.locale, "weatherBiomes.currentCannotDisable")}</div>}
            </div>

            <BiomeProfileEditor
              locale={project.locale}
              units={units}
              inputStyle={inputStyle}
              profile={getProfile(definition.id)}
              project={project}
              onChange={(profile) => updateProfile(definition.id, profile)}
            />
            <button
              type="button"
              onClick={() => resetProfile(definition.id)}
              title={t(project.locale, "weatherProfile.help.resetBiome")}
              style={resetButtonStyle}
            >
              {t(project.locale, "weatherBiomes.reset")}
            </button>
          </CollapsibleSection>
        );
      })}
    </div>
  );
};