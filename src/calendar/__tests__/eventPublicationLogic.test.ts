import { describe, expect, it } from "vitest";
import { createDefaultCalendarProject } from "../../storage/calendarStorage";
import type { MoonEvent, WeatherEvent } from "../../domain/types";
import {
  cleanManualPublicationsForActiveEvents,
  filterPlayerPublishableLunarEvents,
  filterPlayerPublishableWeatherEvents,
  getPlayerWeatherEventDisplayCandidates,
  normalizeManualPublications,
  setLunarEventManualPublication,
  setWeatherEventManualPublication
} from "../eventPublicationLogic";

describe("eventPublicationLogic", () => {
  const weatherEvent = (id: string, visibilityMode: WeatherEvent["visibilityMode"]): WeatherEvent => ({
    id,
    name: id,
    visibilityMode,
    enabled: true,
    requireAllConditions: true,
    conditions: [{ metric: "temperature", operator: "gte", value: 0 }],
    status: "active"
  });

  const moonEvent = (id: string, visibilityMode: MoonEvent["visibilityMode"]): MoonEvent => ({
    id,
    name: id,
    summary: "",
    moonId: "moon-main",
    phaseId: "full",
    visibility: "gm",
    visibilityMode,
    enabled: true,
    notifyOnTrigger: true,
    status: "active"
  });

  it("normalise les publications manuelles absentes", () => {
    expect(normalizeManualPublications(undefined)).toEqual({ weatherEventIds: [], lunarEventIds: [] });
  });

  it("publie seulement les événements auto ou manuels explicitement publiés", () => {
    let project = createDefaultCalendarProject();
    project.weatherEvents = [weatherEvent("auto", "auto"), weatherEvent("manual", "manual"), weatherEvent("gm", "gmOnly")];
    project = setWeatherEventManualPublication(project, "manual", true);
    expect(filterPlayerPublishableWeatherEvents(project, project.weatherEvents, true).map((event) => event.id)).toEqual(["auto", "manual"]);
    expect(filterPlayerPublishableWeatherEvents(project, project.weatherEvents, false)).toEqual([]);
  });

  it("applique les mêmes règles aux événements lunaires", () => {
    let project = createDefaultCalendarProject();
    project.currentTime = { ...project.currentTime, hour: 20, minute: 0 };
    project.moonEvents = [moonEvent("auto", "auto"), moonEvent("manual", "manual"), moonEvent("gm", "gmOnly")];
    project = setLunarEventManualPublication(project, "manual", true);
    expect(filterPlayerPublishableLunarEvents(project, project.moonEvents ?? [], true).map((event) => event.id)).toEqual(["auto", "manual"]);
    const daytimeProject = { ...project, currentTime: { ...project.currentTime, hour: 12 } };
    expect(filterPlayerPublishableLunarEvents(daytimeProject, project.moonEvents ?? [], true)).toEqual([]);
    expect(filterPlayerPublishableLunarEvents(daytimeProject, project.moonEvents ?? [], true, { enforceDisplayTime: false }).map((event) => event.id)).toEqual(["auto", "manual"]);
  });

  it("réintègre les événements manuels publiés même s'ils sont masqués par l'affichage intelligent", () => {
    let project = createDefaultCalendarProject();
    const autoVisible = weatherEvent("auto-visible", "auto");
    const manualHidden = weatherEvent("manual-hidden", "manual");
    const autoHidden = weatherEvent("auto-hidden", "auto");
    project = setWeatherEventManualPublication(project, "manual-hidden", true);
    const candidates = getPlayerWeatherEventDisplayCandidates(project, [autoVisible], [manualHidden, autoHidden]);
    expect(candidates.map((event) => event.id)).toEqual(["auto-visible", "manual-hidden"]);
    expect(filterPlayerPublishableWeatherEvents(project, candidates, true).map((event) => event.id)).toEqual(["auto-visible", "manual-hidden"]);
  });

  it("retire les publications lorsque les événements ne sont plus actifs", () => {
    let project = createDefaultCalendarProject();
    project = setWeatherEventManualPublication(project, "w1", true);
    project = setWeatherEventManualPublication(project, "w2", true);
    project = setLunarEventManualPublication(project, "m1", true);
    const cleaned = cleanManualPublicationsForActiveEvents(project, ["w2"], []);
    expect(cleaned.manualPublications).toEqual({ weatherEventIds: ["w2"], lunarEventIds: [] });
  });
});