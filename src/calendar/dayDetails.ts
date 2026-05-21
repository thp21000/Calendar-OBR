import { absoluteDayToCalendarDate, calendarDateToAbsoluteDay } from "./dateEngine";
import { getEventsForDay, getPlayerVisibleEventsForDay } from "./eventsLogic";
import { formatDisplayDate } from "./formatDisplayDate";
import { getMoonPhaseForDate } from "./moonLogic";
import { getSeasonForDate } from "./seasonsLogic";
import { generateWeatherForTime } from "./weatherLogic";
import type { CalendarDate, CalendarProject } from "../domain/types";

export type DayDetails = {
  date: CalendarDate;
  formattedDate: string;
  seasonName?: string;
  seasonIcon?: string;
  weather?: ReturnType<typeof generateWeatherForTime>;
  moonPhases: Array<{ moonId: string; moonName: string; moonIcon?: string; phaseId: string; phaseIcon: string; illumination: number }>;
  events: ReturnType<typeof getEventsForDay>;
  playerVisibleEvents: ReturnType<typeof getPlayerVisibleEventsForDay>;
};

export const getDayDetails = (project: CalendarProject, date: CalendarDate): DayDetails => {
  const normalizedDate = { ...date, hour: 0, minute: 0 };
  const absolute = calendarDateToAbsoluteDay(normalizedDate, project.calendarSystem);
  const displayDate = absoluteDayToCalendarDate({ absoluteDay: absolute.absoluteDay, hour: 0, minute: 0 }, project.calendarSystem);
  const season = getSeasonForDate(project, normalizedDate);

  return {
    date: displayDate,
    formattedDate: formatDisplayDate(displayDate, project.locale),
    seasonName: season?.name,
    seasonIcon: season?.icon,
    weather: generateWeatherForTime(project, absolute.absoluteDay, 12),
    moonPhases: project.moons.map((moon) => {
      const phase = getMoonPhaseForDate(moon, absolute.absoluteDay);
      return {
        moonId: moon.id,
        moonName: moon.name,
        moonIcon: moon.icon,
        phaseId: phase.id,
        phaseIcon: phase.icon,
        illumination: phase.illumination
      };
    }),
    events: getEventsForDay(project, normalizedDate),
    playerVisibleEvents: getPlayerVisibleEventsForDay(project, normalizedDate)
  };
};
