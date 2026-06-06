import { absoluteDayToCalendarDate, calendarDateToAbsoluteDay } from "./dateEngine";
import { getEventsForDay, getPlayerVisibleEventsForDay } from "./eventsLogic";
import { formatDisplayDate } from "./formatDisplayDate";
import { getMoonPhaseForDate } from "./moonLogic";
import { getTriggeredMoonEvents } from "./moonEventsLogic";
import { getSeasonForDate } from "./seasonsLogic";
import { generateWeatherForTime } from "./weatherLogic";
import { getDailyWeatherSummary } from "./weatherDaily";
import { getHourlyWindForDay } from "./weatherWind";
import type { CalendarDate, CalendarProject, DisplayDate, WeatherTrendKind, WindDirection, WeatherState } from "../domain/types";

export type DailyWeatherSummaryForDisplay = {
  dominantState: WeatherState;
  averageTemperature: number;
  averageWindSpeed: number;
  dominantWindDirection: WindDirection;
  rainTotal24h: number;
  trendKind?: WeatherTrendKind;
};

export type DailyWeatherForecastEntry = {
  offsetDays: number;
  absoluteDay: number;
  date: DisplayDate;
  dailyWeather?: DailyWeatherSummaryForDisplay;
};

export type DayDetails = {
  date: CalendarDate;
  formattedDate: string;
  seasonName?: string;
  seasonIcon?: string;
  weather?: ReturnType<typeof generateWeatherForTime>;
  dailyWeather?: DailyWeatherSummaryForDisplay;
  moonPhases: Array<{ moonId: string; moonName: string; moonIcon?: string; phaseId: string; phaseIcon: string; illumination: number }>;
  events: ReturnType<typeof getEventsForDay>;
  playerVisibleEvents: ReturnType<typeof getPlayerVisibleEventsForDay>;
  moonEvents: NonNullable<CalendarProject["moonEvents"]>;
};

const getDailyWeatherForAbsoluteDay = (project: CalendarProject, absoluteDay: number): DailyWeatherSummaryForDisplay | undefined => {
  const dailySummary = getDailyWeatherSummary(project, absoluteDay);
  const windPlan = dailySummary ? getHourlyWindForDay(project, absoluteDay, dailySummary) : [];
  const averageWindSpeed = windPlan.length > 0
    ? Math.round((windPlan.reduce((sum, hour) => sum + hour.windSpeed, 0) / windPlan.length) * 10) / 10
    : 0;

  return dailySummary
    ? {
        dominantState: dailySummary.dominantState,
        averageTemperature: dailySummary.averageTemperature,
        averageWindSpeed,
        dominantWindDirection: dailySummary.dominantWindDirection,
        rainTotal24h: dailySummary.rainTotal24h,
        trendKind: dailySummary.trendKind
      }
    : undefined;
};

export const getDailyWeatherForecastEntries = (
  project: CalendarProject,
  count = 5,
  startAbsoluteDay = project.currentTime.absoluteDay
): DailyWeatherForecastEntry[] => {
  const safeCount = Math.max(0, Math.floor(count));
  return Array.from({ length: safeCount }, (_, offsetDays) => {
    const absoluteDay = startAbsoluteDay + offsetDays;
    return {
      offsetDays,
      absoluteDay,
      date: absoluteDayToCalendarDate({ absoluteDay, hour: 0, minute: 0 }, project.calendarSystem),
      dailyWeather: getDailyWeatherForAbsoluteDay(project, absoluteDay)
    };
  });
};

export const getDayDetails = (project: CalendarProject, date: CalendarDate): DayDetails => {
  const normalizedDate = { ...date, hour: 0, minute: 0 };
  const absolute = calendarDateToAbsoluteDay(normalizedDate, project.calendarSystem);
  const displayDate = absoluteDayToCalendarDate({ absoluteDay: absolute.absoluteDay, hour: 0, minute: 0 }, project.calendarSystem);
  const season = getSeasonForDate(project, normalizedDate);
  const dailyWeather = getDailyWeatherForAbsoluteDay(project, absolute.absoluteDay);

  return {
    date: displayDate,
    formattedDate: formatDisplayDate(displayDate, project.locale, project.uiSettings.dateFormat, project.uiSettings.timeFormat),
    seasonName: season?.name,
    seasonIcon: season?.icon,
    weather: generateWeatherForTime(project, absolute.absoluteDay, 12),
    dailyWeather,
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
    playerVisibleEvents: getPlayerVisibleEventsForDay(project, normalizedDate),
    moonEvents: getTriggeredMoonEvents(project, absolute.absoluteDay)
  };
};