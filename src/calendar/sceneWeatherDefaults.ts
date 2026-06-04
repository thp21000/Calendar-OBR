import type { CalendarProject, SceneWeatherProfile } from "../domain/types";

export const DEFAULT_SCENE_WEATHER_PROFILES: SceneWeatherProfile[] = [
  { id: "clear-day", name: "Journée claire", icon: "☀️", enabled: true, durationMinutes: 240, transitionMinutes: 15, override: { state: "clear", dominantState: "clear", trendKind: "stable", temperature: 20, dailyMinTemperature: 14, dailyMaxTemperature: 24, rain: 0, dailyRainTotal: 0, windSpeed: 8 } },
  { id: "cloudy-day", name: "Ciel voilé", icon: "🌤️", enabled: true, durationMinutes: 240, transitionMinutes: 15, override: { state: "cloudy", dominantState: "cloudy", trendKind: "stable", temperature: 18, dailyMinTemperature: 13, dailyMaxTemperature: 22, rain: 0, dailyRainTotal: 0, windSpeed: 10 } },
  { id: "overcast-day", name: "Ciel couvert", icon: "☁️", enabled: true, durationMinutes: 240, transitionMinutes: 15, override: { state: "overcast", dominantState: "overcast", trendKind: "stable", temperature: 16, dailyMinTemperature: 12, dailyMaxTemperature: 19, rain: 0.1, dailyRainTotal: 1.5, windSpeed: 12 } },
  { id: "morning-fog", name: "Brouillard matinal", icon: "🌫️", enabled: true, durationMinutes: 180, transitionMinutes: 10, override: { state: "fog", dominantState: "fog", trendKind: "stable", temperature: 10, dailyMinTemperature: 7, dailyMaxTemperature: 14, rain: 0, dailyRainTotal: 0.2, windSpeed: 3 } },
  { id: "damp-mist", name: "Brume humide", icon: "🌫️", enabled: true, durationMinutes: 240, transitionMinutes: 10, override: { state: "fog", dominantState: "fog", trendKind: "wet", temperature: 12, dailyMinTemperature: 9, dailyMaxTemperature: 15, rain: 0.2, dailyRainTotal: 3, windSpeed: 4 } },
  { id: "cold-drizzle", name: "Bruine froide", icon: "🌧️", enabled: true, durationMinutes: 180, transitionMinutes: 15, override: { state: "lightRain", dominantState: "lightRain", trendKind: "wet", temperature: 9, dailyMinTemperature: 6, dailyMaxTemperature: 12, rain: 0.6, dailyRainTotal: 6, windSpeed: 8 } },
  { id: "steady-rain", name: "Pluie régulière", icon: "🌧️", enabled: true, durationMinutes: 240, transitionMinutes: 15, override: { state: "lightRain", dominantState: "lightRain", trendKind: "wet", temperature: 13, dailyMinTemperature: 10, dailyMaxTemperature: 16, rain: 1.5, dailyRainTotal: 12, windSpeed: 12 } },
  { id: "heavy-rain", name: "Pluie battante", icon: "🌧️", enabled: true, durationMinutes: 180, transitionMinutes: 10, override: { state: "heavyRain", dominantState: "heavyRain", trendKind: "wet", temperature: 14, dailyMinTemperature: 11, dailyMaxTemperature: 17, rain: 4, dailyRainTotal: 35, windSpeed: 18 } },
  { id: "nearby-storm", name: "Orage proche", icon: "⛈️", enabled: true, durationMinutes: 120, transitionMinutes: 10, override: { state: "storm", dominantState: "storm", trendKind: "stormy", temperature: 19, dailyMinTemperature: 15, dailyMaxTemperature: 23, rain: 3, dailyRainTotal: 20, windSpeed: 30 } },
  { id: "violent-tempest", name: "Tempête violente", icon: "🌩️", enabled: true, durationMinutes: 90, transitionMinutes: 5, override: { state: "tempest", dominantState: "tempest", trendKind: "stormy", temperature: 16, dailyMinTemperature: 12, dailyMaxTemperature: 20, rain: 6, dailyRainTotal: 45, windSpeed: 60 } },
  { id: "strong-wind", name: "Vent fort", icon: "💨", enabled: true, durationMinutes: 180, transitionMinutes: 10, override: { state: "strongWind", dominantState: "strongWind", trendKind: "windy", temperature: 15, dailyMinTemperature: 11, dailyMaxTemperature: 19, rain: 0, dailyRainTotal: 0, windSpeed: 45 } },
  { id: "dry-gusts", name: "Rafales sèches", icon: "🍃", enabled: true, durationMinutes: 180, transitionMinutes: 10, override: { state: "strongWind", dominantState: "strongWind", trendKind: "dry", temperature: 22, dailyMinTemperature: 16, dailyMaxTemperature: 28, rain: 0, dailyRainTotal: 0, windSpeed: 38 } },
  { id: "dry-heatwave", name: "Canicule sèche", icon: "🏜️", enabled: true, durationMinutes: 360, transitionMinutes: 30, forceBiomeId: "desert", override: { state: "clear", dominantState: "clear", trendKind: "warm", temperature: 38, dailyMinTemperature: 28, dailyMaxTemperature: 44, rain: 0, dailyRainTotal: 0, windSpeed: 8 } },
  { id: "dry-cold", name: "Froid sec", icon: "🥶", enabled: true, durationMinutes: 360, transitionMinutes: 30, override: { state: "clear", dominantState: "clear", trendKind: "cold", temperature: -8, dailyMinTemperature: -15, dailyMaxTemperature: -2, rain: 0, dailyRainTotal: 0, windSpeed: 10 } },
  { id: "light-snow", name: "Neige légère", icon: "🌨️", enabled: true, durationMinutes: 240, transitionMinutes: 20, override: { state: "snow", dominantState: "snow", trendKind: "cold", temperature: -2, dailyMinTemperature: -6, dailyMaxTemperature: 1, rain: 0.4, dailyRainTotal: 5, windSpeed: 8 } },
  { id: "heavy-snow", name: "Neige forte", icon: "❄️", enabled: true, durationMinutes: 180, transitionMinutes: 15, override: { state: "snow", dominantState: "snow", trendKind: "cold", temperature: -5, dailyMinTemperature: -10, dailyMaxTemperature: -1, rain: 1.8, dailyRainTotal: 20, windSpeed: 18 } },
  { id: "snowstorm", name: "Tempête de neige", icon: "🌨️", enabled: true, durationMinutes: 120, transitionMinutes: 10, override: { state: "snow", dominantState: "strongWind", trendKind: "stormy", temperature: -8, dailyMinTemperature: -14, dailyMaxTemperature: -3, rain: 2.2, dailyRainTotal: 25, windSpeed: 45 } },
  { id: "tropical-rain", name: "Pluie tropicale", icon: "🌴", enabled: true, durationMinutes: 120, transitionMinutes: 10, forceBiomeId: "jungle", override: { state: "heavyRain", dominantState: "heavyRain", trendKind: "wet", temperature: 27, dailyMinTemperature: 24, dailyMaxTemperature: 31, rain: 5, dailyRainTotal: 50, windSpeed: 15 } },
  { id: "simple-monsoon", name: "Mousson simple", icon: "🌧️", enabled: true, durationMinutes: 240, transitionMinutes: 15, forceBiomeId: "jungle", override: { state: "heavyRain", dominantState: "storm", trendKind: "wet", temperature: 26, dailyMinTemperature: 23, dailyMaxTemperature: 29, rain: 6, dailyRainTotal: 70, windSpeed: 22 } },
  { id: "rough-sea", name: "Mer agitée", icon: "🌊", enabled: true, durationMinutes: 180, transitionMinutes: 10, forceBiomeId: "sea", override: { state: "strongWind", dominantState: "tempest", trendKind: "windy", temperature: 13, dailyMinTemperature: 10, dailyMaxTemperature: 16, rain: 2, dailyRainTotal: 25, windSpeed: 55 } },
  { id: "sea-fog", name: "Brume marine", icon: "🌫️", enabled: true, durationMinutes: 240, transitionMinutes: 15, forceBiomeId: "coast", override: { state: "fog", dominantState: "fog", trendKind: "wet", temperature: 12, dailyMinTemperature: 9, dailyMaxTemperature: 15, rain: 0.2, dailyRainTotal: 2, windSpeed: 6 } },
  { id: "volcanic-ash", name: "Cendres volcaniques", icon: "🌋", enabled: true, durationMinutes: 240, transitionMinutes: 20, forceBiomeId: "volcanic", override: { state: "overcast", dominantState: "fog", trendKind: "dry", temperature: 25, dailyMinTemperature: 20, dailyMaxTemperature: 31, rain: 0, dailyRainTotal: 0, windSpeed: 12 } },
  { id: "hellish-heat", name: "Chaleur infernale", icon: "🔥", enabled: true, durationMinutes: 240, transitionMinutes: 15, forceBiomeId: "hell", override: { state: "clear", dominantState: "clear", trendKind: "warm", temperature: 45, dailyMinTemperature: 35, dailyMaxTemperature: 55, rain: 0, dailyRainTotal: 0, windSpeed: 18 } },
  { id: "supernatural-calm", name: "Calme surnaturel", icon: "✨", enabled: true, durationMinutes: 180, transitionMinutes: 20, override: { state: "clear", dominantState: "clear", trendKind: "stable", temperature: 18, dailyMinTemperature: 16, dailyMaxTemperature: 20, rain: 0, dailyRainTotal: 0, windSpeed: 0 } },
  { id: "damp-cave", name: "Caverne humide", icon: "🕳️", enabled: true, durationMinutes: 360, transitionMinutes: 15, forceBiomeId: "cave", override: { state: "fog", dominantState: "fog", trendKind: "stable", temperature: 11, dailyMinTemperature: 9, dailyMaxTemperature: 13, rain: 0.1, dailyRainTotal: 2, windSpeed: 0 } },
  { id: "high-altitude", name: "Haute altitude", icon: "⛰️", enabled: true, durationMinutes: 240, transitionMinutes: 15, forceBiomeId: "mountain", override: { state: "strongWind", dominantState: "strongWind", trendKind: "windy", temperature: 0, dailyMinTemperature: -5, dailyMaxTemperature: 4, rain: 0.5, dailyRainTotal: 4, windSpeed: 40 } }
];

const cloneDefaults = (): SceneWeatherProfile[] => structuredClone(DEFAULT_SCENE_WEATHER_PROFILES);

export const getMissingDefaultSceneWeatherProfiles = (profiles: SceneWeatherProfile[] | undefined): SceneWeatherProfile[] => {
  const existingIds = new Set((profiles ?? []).map((profile) => profile.id));
  return cloneDefaults().filter((profile) => !existingIds.has(profile.id));
};

export const addMissingDefaultSceneWeatherProfiles = (project: CalendarProject): CalendarProject => {
  const profiles = project.sceneWeatherProfiles ?? [];
  const missing = getMissingDefaultSceneWeatherProfiles(profiles);
  if (missing.length === 0) return project;
  return { ...project, sceneWeatherProfiles: [...profiles, ...missing] };
};

export const ensureDefaultSceneWeatherProfiles = (project: CalendarProject): CalendarProject => {
  if ((project.sceneWeatherProfiles ?? []).length > 0) return project;
  return { ...project, sceneWeatherProfiles: cloneDefaults() };
};
