import OBR from "@owlbear-rodeo/sdk";
import { applySceneWeatherProfile, disableSceneWeatherForScene, hasActiveSceneWeatherOverride } from "./calendar/sceneWeather";
import { toAbsoluteMinutes } from "./calendar/weatherEventsLogic";
import { getViewerRole } from "./obr/playerRole";
import { getStorageScope } from "./obr/roomScope";
import { getCurrentObrSceneInfo, subscribeToObrSceneChange } from "./obr/sceneInfo";
import { getSceneWeatherState, setSceneWeatherState } from "./obr/sceneWeatherMetadata";
import { loadCalendarProject, saveCalendarProject } from "./storage/calendarStorage";

const SCENE_WEATHER_TOOL_ID = "calendar-obr/scene-weather-tool";
const SCENE_WEATHER_ACTION_ID = "calendar-obr/scene-weather-action";
const SCENE_WEATHER_MODAL_ID = "calendar-obr/scene-weather-modal";
const SCENE_WEATHER_CONFIRM_MODAL_ID = "calendar-obr/scene-weather-confirm-modal";
const SCENE_WEATHER_MODAL_WIDTH = 520;
const SCENE_WEATHER_MODAL_HEIGHT = 620;

const backgroundBaseUrl = typeof window !== "undefined" ? window.location.href : "https://thp21000.github.io/Calendar-OBR/background.html";
const sceneWeatherIconUrl = new URL("scene-weather.svg", backgroundBaseUrl).href;
const sceneWeatherModalUrl = (confirm = false): string => {
  const url = new URL("index.html", backgroundBaseUrl);
  url.searchParams.set("view", confirm ? "scene-weather-confirm" : "scene-weather");
  return url.href;
};


const synchronizeSceneWeatherForScene = async () => {
  const role = await getViewerRole();
  if (role !== "gm") return;

  const scope = await getStorageScope();
  const project = loadCalendarProject(scope.storageKey);
  const [sceneInfo, state] = await Promise.all([getCurrentObrSceneInfo(), getSceneWeatherState()]);
  const sceneId = sceneInfo?.id ?? "current-obr-scene";
  const now = toAbsoluteMinutes(project.currentTime);

  if (!state?.profileId) {
    saveCalendarProject(disableSceneWeatherForScene(project), scope.storageKey);
    return;
  }

  const profile = (project.sceneWeatherProfiles ?? []).find((item) => item.id === state.profileId && item.enabled);
  if (!profile) {
    saveCalendarProject(disableSceneWeatherForScene(project, sceneId), scope.storageKey);
    return;
  }

  if (state.isActive) {
    if (!hasActiveSceneWeatherOverride(project, profile.id, now, sceneId)) {
      saveCalendarProject(applySceneWeatherProfile(project, profile, { sceneId, sceneName: sceneInfo?.name }), scope.storageKey);
    }
    return;
  }

  saveCalendarProject(disableSceneWeatherForScene(project, sceneId), scope.storageKey);
  if (state.lastPromptedAtMinutes === now) return;
  await setSceneWeatherState({ ...state, lastPromptedAtMinutes: now });
  await OBR.modal.open({
    id: SCENE_WEATHER_CONFIRM_MODAL_ID,
    url: sceneWeatherModalUrl(true),
    width: SCENE_WEATHER_MODAL_WIDTH,
    height: 320
  });
};

const openSceneWeatherModal = async () => {
  await OBR.modal.open({
    id: SCENE_WEATHER_MODAL_ID,
    url: sceneWeatherModalUrl(false),
    width: SCENE_WEATHER_MODAL_WIDTH,
    height: SCENE_WEATHER_MODAL_HEIGHT
  });
};

const registerSceneWeatherTool = async () => {
  await OBR.tool.create({
    id: SCENE_WEATHER_TOOL_ID,
    icons: [
      {
        icon: sceneWeatherIconUrl,
        label: "Météo de scène",
        filter: { roles: ["GM"] }
      }
    ],
    // Activate the tool only; it has no drawing mode and does not create scene items.
    onClick: () => true
  });

  await OBR.tool.createAction({
    id: SCENE_WEATHER_ACTION_ID,
    icons: [
      {
        icon: sceneWeatherIconUrl,
        label: "Gérer la météo de scène",
        filter: { activeTools: [SCENE_WEATHER_TOOL_ID], roles: ["GM"] }
      }
    ],
    onClick: openSceneWeatherModal
  });
};

if (OBR.isAvailable) {
  OBR.onReady(() => {
    void registerSceneWeatherTool();
    void synchronizeSceneWeatherForScene();
    subscribeToObrSceneChange(() => {
      void synchronizeSceneWeatherForScene();
    });
  });
}