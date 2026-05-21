import type { CalendarPack } from "../domain/types";

export const defaultFantasyCalendarPackFr: CalendarPack = {
  schemaVersion: 1,
  packId: "fantasy-classic-fr",
  packVersion: "1.0.0",
  name: "Calendrier fantasy classique",
  description: "Calendrier de campagne fantasy avec saisons, lune principale et météo de base.",
  author: "Calendar OBR",
  locale: "fr",
  project: {
    schemaVersion: 1,
    appVersion: "0.1.0",
    id: "fantasy-classic-calendar-fr",
    name: "Calendrier fantasy classique",
    locale: "fr",
    units: { temperature: "celsius", windSpeed: "kmh", rain: "mm" },
    currentTime: { absoluteDay: 0, hour: 8, minute: 0 },
    calendarSystem: {
      eraName: "AR",
      startYear: 1000,
      firstWeekdayOffset: 0,
      months: [
        { id: "month-1", name: "Aubefer", order: 1, days: 31 },
        { id: "month-2", name: "Brumelune", order: 2, days: 28 },
        { id: "month-3", name: "Verdesève", order: 3, days: 31 },
        { id: "month-4", name: "Soleclair", order: 4, days: 30 },
        { id: "month-5", name: "Hautzénith", order: 5, days: 31 },
        { id: "month-6", name: "Moissonor", order: 6, days: 30 },
        { id: "month-7", name: "Feuillombre", order: 7, days: 31 },
        { id: "month-8", name: "Braisedor", order: 8, days: 30 },
        { id: "month-9", name: "Ventgris", order: 9, days: 30 },
        { id: "month-10", name: "Pluienuit", order: 10, days: 31 },
        { id: "month-11", name: "Givreciel", order: 11, days: 30 },
        { id: "month-12", name: "Longhiver", order: 12, days: 31 }
      ],
      weekdays: [
        { id: "day-1", name: "Lundor", order: 1 },
        { id: "day-2", name: "Mardor", order: 2 },
        { id: "day-3", name: "Merdor", order: 3 },
        { id: "day-4", name: "Jeudor", order: 4 },
        { id: "day-5", name: "Vendror", order: 5 },
        { id: "day-6", name: "Samdor", order: 6 },
        { id: "day-7", name: "Dimdor", order: 7 }
      ]
    },
    events: [],
    seasons: [
      {
        id: "spring",
        name: "Printemps",
        icon: "🌱",
        start: { monthId: "month-3", dayOfMonth: 1 },
        end: { monthId: "month-5", dayOfMonth: 31 },
        weatherProfile: {
          temperature: { min: 4, average: 15, max: 24 },
          windSpeed: { min: 4, average: 15, max: 35 },
          rain: { min: 0, average: 3, max: 10 }
        }
      },
      {
        id: "summer",
        name: "Été",
        icon: "☀️",
        start: { monthId: "month-6", dayOfMonth: 1 },
        end: { monthId: "month-8", dayOfMonth: 30 },
        weatherProfile: {
          temperature: { min: 16, average: 27, max: 35 },
          windSpeed: { min: 2, average: 10, max: 25 },
          rain: { min: 0, average: 1, max: 6 }
        }
      },
      {
        id: "autumn",
        name: "Automne",
        icon: "🍂",
        start: { monthId: "month-9", dayOfMonth: 1 },
        end: { monthId: "month-11", dayOfMonth: 30 },
        weatherProfile: {
          temperature: { min: 6, average: 14, max: 23 },
          windSpeed: { min: 5, average: 18, max: 40 },
          rain: { min: 1, average: 4, max: 12 }
        }
      },
      {
        id: "winter",
        name: "Hiver",
        icon: "❄️",
        start: { monthId: "month-12", dayOfMonth: 1 },
        end: { monthId: "month-2", dayOfMonth: 28 },
        weatherProfile: {
          temperature: { min: -10, average: 1, max: 9 },
          windSpeed: { min: 8, average: 22, max: 55 },
          rain: { min: 0, average: 2, max: 8 }
        }
      }
    ],
    moons: [{ id: "moon-main", name: "Lune principale", icon: "🌕", cycleLengthDays: 29.5, cycleOffsetDays: 0 }],
    weatherSettings: { seed: "fantasy-classic", forecastMode: "wide" },
    weatherEvents: [
      {
        id: "heat-wave",
        name: "Alerte chaleur",
        icon: "🔥",
        summary: "Chaleur marquée aujourd’hui.",
        enabled: true,
        requireAllConditions: true,
        conditions: [{ metric: "temperature", operator: "gte", value: 32 }]
      },
      {
        id: "strong-wind",
        name: "Vents forts",
        icon: "💨",
        summary: "Rafales soutenues en cours.",
        enabled: true,
        requireAllConditions: true,
        conditions: [{ metric: "windSpeed", operator: "gte", value: 45 }]
      }
    ],
    uiSettings: { activeTab: "today", compactMode: true, defaultMoonSystemInitialized: true }
  }
};

export const defaultFantasyCalendarPackEn: CalendarPack = {
  schemaVersion: 1,
  packId: "fantasy-classic-en",
  packVersion: "1.0.0",
  name: "Classic fantasy calendar",
  description: "Fantasy campaign calendar with seasons, main moon, and basic weather.",
  author: "Calendar OBR",
  locale: "en",
  project: {
    schemaVersion: 1,
    appVersion: "0.1.0",
    id: "fantasy-classic-calendar-en",
    name: "Classic fantasy calendar",
    locale: "en",
    units: { temperature: "celsius", windSpeed: "kmh", rain: "mm" },
    currentTime: { absoluteDay: 0, hour: 8, minute: 0 },
    calendarSystem: {
      eraName: "AR",
      startYear: 1000,
      firstWeekdayOffset: 0,
      months: [
        { id: "month-1", name: "Dawnforge", order: 1, days: 31 },
        { id: "month-2", name: "Mistmoon", order: 2, days: 28 },
        { id: "month-3", name: "Greensap", order: 3, days: 31 },
        { id: "month-4", name: "Brightsun", order: 4, days: 30 },
        { id: "month-5", name: "Highzenith", order: 5, days: 31 },
        { id: "month-6", name: "Goldharvest", order: 6, days: 30 },
        { id: "month-7", name: "Leafshade", order: 7, days: 31 },
        { id: "month-8", name: "Emberfall", order: 8, days: 30 },
        { id: "month-9", name: "Greywind", order: 9, days: 30 },
        { id: "month-10", name: "NightRain", order: 10, days: 31 },
        { id: "month-11", name: "Frostsky", order: 11, days: 30 },
        { id: "month-12", name: "Longwinter", order: 12, days: 31 }
      ],
      weekdays: [
        { id: "day-1", name: "Moonday", order: 1 },
        { id: "day-2", name: "Marsday", order: 2 },
        { id: "day-3", name: "Wyrmsday", order: 3 },
        { id: "day-4", name: "Thorsday", order: 4 },
        { id: "day-5", name: "Freeday", order: 5 },
        { id: "day-6", name: "Starday", order: 6 },
        { id: "day-7", name: "Sunday", order: 7 }
      ]
    },
    events: [],
    seasons: [
      {
        id: "spring",
        name: "Spring",
        icon: "🌱",
        start: { monthId: "month-3", dayOfMonth: 1 },
        end: { monthId: "month-5", dayOfMonth: 31 },
        weatherProfile: {
          temperature: { min: 4, average: 15, max: 24 },
          windSpeed: { min: 4, average: 15, max: 35 },
          rain: { min: 0, average: 3, max: 10 }
        }
      },
      {
        id: "summer",
        name: "Summer",
        icon: "☀️",
        start: { monthId: "month-6", dayOfMonth: 1 },
        end: { monthId: "month-8", dayOfMonth: 30 },
        weatherProfile: {
          temperature: { min: 16, average: 27, max: 35 },
          windSpeed: { min: 2, average: 10, max: 25 },
          rain: { min: 0, average: 1, max: 6 }
        }
      },
      {
        id: "autumn",
        name: "Autumn",
        icon: "🍂",
        start: { monthId: "month-9", dayOfMonth: 1 },
        end: { monthId: "month-11", dayOfMonth: 30 },
        weatherProfile: {
          temperature: { min: 6, average: 14, max: 23 },
          windSpeed: { min: 5, average: 18, max: 40 },
          rain: { min: 1, average: 4, max: 12 }
        }
      },
      {
        id: "winter",
        name: "Winter",
        icon: "❄️",
        start: { monthId: "month-12", dayOfMonth: 1 },
        end: { monthId: "month-2", dayOfMonth: 28 },
        weatherProfile: {
          temperature: { min: -10, average: 1, max: 9 },
          windSpeed: { min: 8, average: 22, max: 55 },
          rain: { min: 0, average: 2, max: 8 }
        }
      }
    ],
    moons: [{ id: "moon-main", name: "Main moon", icon: "🌕", cycleLengthDays: 29.5, cycleOffsetDays: 0 }],
    weatherSettings: { seed: "fantasy-classic", forecastMode: "wide" },
    weatherEvents: [
      {
        id: "heat-wave",
        name: "Heat alert",
        icon: "🔥",
        summary: "High heat conditions today.",
        enabled: true,
        requireAllConditions: true,
        conditions: [{ metric: "temperature", operator: "gte", value: 32 }]
      },
      {
        id: "strong-wind",
        name: "Strong winds",
        icon: "💨",
        summary: "Sustained strong gusts in progress.",
        enabled: true,
        requireAllConditions: true,
        conditions: [{ metric: "windSpeed", operator: "gte", value: 45 }]
      }
    ],
    uiSettings: { activeTab: "today", compactMode: true, defaultMoonSystemInitialized: true }
  }
};