import { useEffect, useState } from "react";
import type { LocaleCode, WeatherState } from "../../domain/types";
import type { WeatherBiomeProfile, WeatherValueRange } from "../../calendar/weather/biomes";
import { normalizeWeatherBiomeProfile } from "../../calendar/weather/biomes";
import type { SeasonWeatherModifier } from "../../calendar/weather/seasonModifiers";
import { t } from "../../i18n/messages";
import { WEATHER_STATES } from "../../calendar/weatherStates";
import { CollapsibleSection } from "../CollapsibleSection";

type Units = { temperature: string; windSpeed: string; rain: string };

const parseDecimalInput = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "-" || trimmed === "." || trimmed === "," || trimmed === "-.") return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const labelWithHelpStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#cbd5e1" };
const infoIconStyle: React.CSSProperties = { fontSize: 12, color: "#93c5fd", cursor: "help" };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, marginBottom: 8 };
const twoColGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6, marginBottom: 8 };

const FieldWithHelp = ({ label, help, children }: { label: string; help: string; children: React.ReactNode }) => (
  <label style={{ display: "block", minWidth: 0 }}>
    <div style={labelWithHelpStyle}>
      <span>{label}</span>
      <span style={infoIconStyle} title={help}>ⓘ</span>
    </div>
    {children}
  </label>
);

const NumericField = ({
  label,
  help,
  value,
  onChange,
  inputStyle,
  allowNegative = false,
  min,
  max,
  displayMultiplier = 1,
  storeDivisor = 1,
  suffix
}: {
  label: string;
  help: string;
  value: number;
  onChange: (value: number) => void;
  inputStyle: React.CSSProperties;
  allowNegative?: boolean;
  min?: number;
  max?: number;
  displayMultiplier?: number;
  storeDivisor?: number;
  suffix?: string;
}) => {
  const shownValue = value * displayMultiplier;
  const [draft, setDraft] = useState(String(Math.round(shownValue * 100) / 100));

  useEffect(() => {
    setDraft(String(Math.round(shownValue * 100) / 100));
  }, [shownValue]);

  return (
    <FieldWithHelp label={suffix ? `${label} (${suffix})` : label} help={help}>
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(event) => {
          const raw = event.target.value;
          setDraft(raw);
          const parsed = parseDecimalInput(raw);
          if (parsed === null) return;
          let next = parsed / storeDivisor;
          if (!allowNegative) next = Math.max(0, next);
          if (typeof min === "number") next = Math.max(min, next);
          if (typeof max === "number") next = Math.min(max, next);
          onChange(next);
        }}
        style={inputStyle}
      />
    </FieldWithHelp>
  );
};

const updateRange = (range: WeatherValueRange, key: keyof WeatherValueRange, value: number): WeatherValueRange => ({ ...range, [key]: value });

export const BiomeProfileEditor = ({
  locale,
  units,
  inputStyle,
  profile,
  onChange
}: {
  locale: LocaleCode;
  units: Units;
  inputStyle: React.CSSProperties;
  profile: WeatherBiomeProfile;
  onChange: (profile: WeatherBiomeProfile) => void;
}) => {
  const patch = (next: WeatherBiomeProfile) => onChange(normalizeWeatherBiomeProfile(next));
  const patchRange = (section: "temperature" | "rain" | "dailyRain" | "windSpeed", key: keyof WeatherValueRange, value: number) =>
    patch({ ...profile, [section]: updateRange(profile[section], key, value) });
  const patchTrait = (key: keyof WeatherBiomeProfile["traits"], value: number) => patch({ ...profile, traits: { ...profile.traits, [key]: value } });
  const patchWeight = (state: WeatherState, value: number) => patch({ ...profile, stateWeights: { ...profile.stateWeights, [state]: value } });

  return (
    <>
      <CollapsibleSection title={t(locale, "weatherProfile.temperatureGroup")}>
        <div style={gridStyle}>
          <NumericField label={t(locale, "weatherProfile.temperatureMin")} help={t(locale, "weatherProfile.help.temperatureMin")} value={profile.temperature.min} onChange={(value) => patchRange("temperature", "min", value)} inputStyle={inputStyle} allowNegative suffix={units.temperature} />
          <NumericField label={t(locale, "weatherProfile.temperatureAverage")} help={t(locale, "weatherProfile.help.temperatureAverage")} value={profile.temperature.average} onChange={(value) => patchRange("temperature", "average", value)} inputStyle={inputStyle} allowNegative suffix={units.temperature} />
          <NumericField label={t(locale, "weatherProfile.temperatureMax")} help={t(locale, "weatherProfile.help.temperatureMax")} value={profile.temperature.max} onChange={(value) => patchRange("temperature", "max", value)} inputStyle={inputStyle} allowNegative suffix={units.temperature} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection title={t(locale, "weatherProfile.rainGroup")}>
        <div style={gridStyle}>
          <NumericField label={t(locale, "weatherProfile.rainMin")} help={t(locale, "weatherProfile.help.rainMin")} value={profile.rain.min} onChange={(value) => patchRange("rain", "min", value)} inputStyle={inputStyle} suffix={units.rain} />
          <NumericField label={t(locale, "weatherProfile.rainAverage")} help={t(locale, "weatherProfile.help.rainAverage")} value={profile.rain.average} onChange={(value) => patchRange("rain", "average", value)} inputStyle={inputStyle} suffix={units.rain} />
          <NumericField label={t(locale, "weatherProfile.rainMax")} help={t(locale, "weatherProfile.help.rainMax")} value={profile.rain.max} onChange={(value) => patchRange("rain", "max", value)} inputStyle={inputStyle} suffix={units.rain} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection title={t(locale, "weatherProfile.dailyRainGroup")}>
        <div style={gridStyle}>
          <NumericField label={t(locale, "weatherProfile.dailyRainMin")} help={t(locale, "weatherProfile.help.dailyRainMin")} value={profile.dailyRain.min} onChange={(value) => patchRange("dailyRain", "min", value)} inputStyle={inputStyle} suffix={units.rain} />
          <NumericField label={t(locale, "weatherProfile.dailyRainAverage")} help={t(locale, "weatherProfile.help.dailyRainAverage")} value={profile.dailyRain.average} onChange={(value) => patchRange("dailyRain", "average", value)} inputStyle={inputStyle} suffix={units.rain} />
          <NumericField label={t(locale, "weatherProfile.dailyRainMax")} help={t(locale, "weatherProfile.help.dailyRainMax")} value={profile.dailyRain.max} onChange={(value) => patchRange("dailyRain", "max", value)} inputStyle={inputStyle} suffix={units.rain} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection title={t(locale, "weatherProfile.windGroup")}>
        <div style={gridStyle}>
          <NumericField label={t(locale, "weatherProfile.windMin")} help={t(locale, "weatherProfile.help.windMin")} value={profile.windSpeed.min} onChange={(value) => patchRange("windSpeed", "min", value)} inputStyle={inputStyle} suffix={units.windSpeed} />
          <NumericField label={t(locale, "weatherProfile.windAverage")} help={t(locale, "weatherProfile.help.windAverage")} value={profile.windSpeed.average} onChange={(value) => patchRange("windSpeed", "average", value)} inputStyle={inputStyle} suffix={units.windSpeed} />
          <NumericField label={t(locale, "weatherProfile.windMax")} help={t(locale, "weatherProfile.help.windMax")} value={profile.windSpeed.max} onChange={(value) => patchRange("windSpeed", "max", value)} inputStyle={inputStyle} suffix={units.windSpeed} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection title={t(locale, "weatherProfile.traitsGroup")}>
        <div style={twoColGridStyle}>
          <NumericField label={t(locale, "weatherProfile.stability")} help={t(locale, "weatherProfile.help.stability")} value={profile.traits.stability} onChange={(value) => patchTrait("stability", value)} inputStyle={inputStyle} min={0} max={1} displayMultiplier={100} storeDivisor={100} suffix="%" />
          <NumericField label={t(locale, "weatherProfile.precipitationChance")} help={t(locale, "weatherProfile.help.precipitationChance")} value={profile.traits.precipitationChance} onChange={(value) => patchTrait("precipitationChance", value)} inputStyle={inputStyle} min={0} max={1} displayMultiplier={100} storeDivisor={100} suffix="%" />
          <NumericField label={t(locale, "weatherProfile.fogChance")} help={t(locale, "weatherProfile.help.fogChance")} value={profile.traits.fogChance} onChange={(value) => patchTrait("fogChance", value)} inputStyle={inputStyle} min={0} max={1} displayMultiplier={100} storeDivisor={100} suffix="%" />
          <NumericField label={t(locale, "weatherProfile.stormChance")} help={t(locale, "weatherProfile.help.stormChance")} value={profile.traits.stormChance} onChange={(value) => patchTrait("stormChance", value)} inputStyle={inputStyle} min={0} max={1} displayMultiplier={100} storeDivisor={100} suffix="%" />
          <NumericField label={t(locale, "weatherProfile.dayNightAmplitude")} help={t(locale, "weatherProfile.help.dayNightAmplitude")} value={profile.traits.dayNightAmplitude} onChange={(value) => patchTrait("dayNightAmplitude", value)} inputStyle={inputStyle} suffix={units.temperature} />
          <NumericField label={t(locale, "weatherProfile.windVariability")} help={t(locale, "weatherProfile.help.windVariability")} value={profile.traits.windVariability} onChange={(value) => patchTrait("windVariability", value)} inputStyle={inputStyle} min={0} max={1} displayMultiplier={100} storeDivisor={100} suffix="%" />
        </div>
      </CollapsibleSection>
      <CollapsibleSection title={t(locale, "weatherProfile.stateWeightsGroup")}>
        <div style={twoColGridStyle}>
          {WEATHER_STATES.map((state) => (
            <NumericField key={state} label={t(locale, "weatherProfile.stateWeight") + ` · ${t(locale, `weather.state.${state}`)}`} help={t(locale, "weatherProfile.help.stateWeight")} value={profile.stateWeights[state] ?? 1} onChange={(value) => patchWeight(state, value)} inputStyle={inputStyle} />
          ))}
        </div>
      </CollapsibleSection>
    </>
  );
};

const neutralModifierValue = (value: number | undefined, fallback: number) => typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const SeasonWeatherModifierEditor = ({
  locale,
  units,
  inputStyle,
  modifier,
  onChange
}: {
  locale: LocaleCode;
  units: Units;
  inputStyle: React.CSSProperties;
  modifier: SeasonWeatherModifier | undefined;
  onChange: (modifier: SeasonWeatherModifier) => void;
}) => {
  const patch = (next: SeasonWeatherModifier) => onChange(next);
  const patchNested = <Section extends keyof SeasonWeatherModifier>(section: Section, key: string, value: number) =>
    patch({ ...modifier, [section]: { ...((modifier?.[section] as object | undefined) ?? {}), [key]: value } });
  const patchWeight = (state: WeatherState, value: number) => patch({ ...modifier, stateWeights: { ...(modifier?.stateWeights ?? {}), [state]: Math.max(0, value) } });

  return (
    <>
      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>{t(locale, "seasons.weatherModifierHelp")}</div>
      <CollapsibleSection title={t(locale, "weatherProfile.temperatureGroup")}>
        <div style={gridStyle}>
          <NumericField label={t(locale, "weatherProfile.modifierTemperatureMin")} help={t(locale, "weatherProfile.help.seasonTemperatureMin")} value={neutralModifierValue(modifier?.temperature?.minOffset, 0)} onChange={(value) => patchNested("temperature", "minOffset", value)} inputStyle={inputStyle} allowNegative suffix={units.temperature} />
          <NumericField label={t(locale, "weatherProfile.modifierTemperatureAverage")} help={t(locale, "weatherProfile.help.seasonTemperatureAverage")} value={neutralModifierValue(modifier?.temperature?.averageOffset, 0)} onChange={(value) => patchNested("temperature", "averageOffset", value)} inputStyle={inputStyle} allowNegative suffix={units.temperature} />
          <NumericField label={t(locale, "weatherProfile.modifierTemperatureMax")} help={t(locale, "weatherProfile.help.seasonTemperatureMax")} value={neutralModifierValue(modifier?.temperature?.maxOffset, 0)} onChange={(value) => patchNested("temperature", "maxOffset", value)} inputStyle={inputStyle} allowNegative suffix={units.temperature} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection title={t(locale, "weatherProfile.rainGroup")}>
        <div style={gridStyle}>
          <NumericField label={t(locale, "weatherProfile.multiplierRainMin")} help={t(locale, "weatherProfile.help.seasonRainMin")} value={neutralModifierValue(modifier?.rain?.minMultiplier, 1)} onChange={(value) => patchNested("rain", "minMultiplier", value)} inputStyle={inputStyle} />
          <NumericField label={t(locale, "weatherProfile.multiplierRainAverage")} help={t(locale, "weatherProfile.help.seasonRainAverage")} value={neutralModifierValue(modifier?.rain?.averageMultiplier, 1)} onChange={(value) => patchNested("rain", "averageMultiplier", value)} inputStyle={inputStyle} />
          <NumericField label={t(locale, "weatherProfile.multiplierRainMax")} help={t(locale, "weatherProfile.help.seasonRainMax")} value={neutralModifierValue(modifier?.rain?.maxMultiplier, 1)} onChange={(value) => patchNested("rain", "maxMultiplier", value)} inputStyle={inputStyle} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection title={t(locale, "weatherProfile.dailyRainGroup")}>
        <div style={gridStyle}>
          <NumericField label={t(locale, "weatherProfile.multiplierDailyRainMin")} help={t(locale, "weatherProfile.help.seasonDailyRainMin")} value={neutralModifierValue(modifier?.dailyRain?.minMultiplier, 1)} onChange={(value) => patchNested("dailyRain", "minMultiplier", value)} inputStyle={inputStyle} />
          <NumericField label={t(locale, "weatherProfile.multiplierDailyRainAverage")} help={t(locale, "weatherProfile.help.seasonDailyRainAverage")} value={neutralModifierValue(modifier?.dailyRain?.averageMultiplier, 1)} onChange={(value) => patchNested("dailyRain", "averageMultiplier", value)} inputStyle={inputStyle} />
          <NumericField label={t(locale, "weatherProfile.multiplierDailyRainMax")} help={t(locale, "weatherProfile.help.seasonDailyRainMax")} value={neutralModifierValue(modifier?.dailyRain?.maxMultiplier, 1)} onChange={(value) => patchNested("dailyRain", "maxMultiplier", value)} inputStyle={inputStyle} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection title={t(locale, "weatherProfile.windGroup")}>
        <div style={gridStyle}>
          <NumericField label={t(locale, "weatherProfile.multiplierWindMin")} help={t(locale, "weatherProfile.help.seasonWindMin")} value={neutralModifierValue(modifier?.windSpeed?.minMultiplier, 1)} onChange={(value) => patchNested("windSpeed", "minMultiplier", value)} inputStyle={inputStyle} />
          <NumericField label={t(locale, "weatherProfile.multiplierWindAverage")} help={t(locale, "weatherProfile.help.seasonWindAverage")} value={neutralModifierValue(modifier?.windSpeed?.averageMultiplier, 1)} onChange={(value) => patchNested("windSpeed", "averageMultiplier", value)} inputStyle={inputStyle} />
          <NumericField label={t(locale, "weatherProfile.multiplierWindMax")} help={t(locale, "weatherProfile.help.seasonWindMax")} value={neutralModifierValue(modifier?.windSpeed?.maxMultiplier, 1)} onChange={(value) => patchNested("windSpeed", "maxMultiplier", value)} inputStyle={inputStyle} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection title={t(locale, "weatherProfile.traitsGroup")}>
        <div style={twoColGridStyle}>
          <NumericField label={t(locale, "weatherProfile.modifierStability")} help={t(locale, "weatherProfile.help.seasonStability")} value={neutralModifierValue(modifier?.traits?.stabilityOffset, 0)} onChange={(value) => patchNested("traits", "stabilityOffset", value)} inputStyle={inputStyle} allowNegative displayMultiplier={100} storeDivisor={100} suffix="%" />
          <NumericField label={t(locale, "weatherProfile.modifierPrecipitationChance")} help={t(locale, "weatherProfile.help.seasonPrecipitationChance")} value={neutralModifierValue(modifier?.traits?.precipitationChanceOffset, 0)} onChange={(value) => patchNested("traits", "precipitationChanceOffset", value)} inputStyle={inputStyle} allowNegative displayMultiplier={100} storeDivisor={100} suffix="%" />
          <NumericField label={t(locale, "weatherProfile.modifierFogChance")} help={t(locale, "weatherProfile.help.seasonFogChance")} value={neutralModifierValue(modifier?.traits?.fogChanceOffset, 0)} onChange={(value) => patchNested("traits", "fogChanceOffset", value)} inputStyle={inputStyle} allowNegative displayMultiplier={100} storeDivisor={100} suffix="%" />
          <NumericField label={t(locale, "weatherProfile.modifierStormChance")} help={t(locale, "weatherProfile.help.seasonStormChance")} value={neutralModifierValue(modifier?.traits?.stormChanceOffset, 0)} onChange={(value) => patchNested("traits", "stormChanceOffset", value)} inputStyle={inputStyle} allowNegative displayMultiplier={100} storeDivisor={100} suffix="%" />
          <NumericField label={t(locale, "weatherProfile.multiplierDayNightAmplitude")} help={t(locale, "weatherProfile.help.seasonDayNightAmplitude")} value={neutralModifierValue(modifier?.traits?.dayNightAmplitudeMultiplier, 1)} onChange={(value) => patchNested("traits", "dayNightAmplitudeMultiplier", value)} inputStyle={inputStyle} />
          <NumericField label={t(locale, "weatherProfile.multiplierWindVariability")} help={t(locale, "weatherProfile.help.seasonWindVariability")} value={neutralModifierValue(modifier?.traits?.windVariabilityMultiplier, 1)} onChange={(value) => patchNested("traits", "windVariabilityMultiplier", value)} inputStyle={inputStyle} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection title={t(locale, "weatherProfile.stateWeightsGroup")}>
        <div style={twoColGridStyle}>
          {WEATHER_STATES.map((state) => (
            <NumericField key={state} label={t(locale, "weatherProfile.stateWeight") + ` · ${t(locale, `weather.state.${state}`)}`} help={t(locale, "weatherProfile.help.seasonStateWeight")} value={modifier?.stateWeights?.[state] ?? 1} onChange={(value) => patchWeight(state, value)} inputStyle={inputStyle} />
          ))}
        </div>
      </CollapsibleSection>
    </>
  );
};
