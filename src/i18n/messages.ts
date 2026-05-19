import type { LocaleCode } from "../domain/types";

export const messages: Record<LocaleCode, Record<string, string>> = {
  fr: {
    "app.title": "Calendrier vivant",
    "nav.today": "Aujourd'hui",
    "nav.month": "Mois",
    "common.month": "Mois",
    "common.year": "Année",
    "calendar.currentDate": "Date actuelle",
    "calendar.currentMonth": "Mois actuel",
    "calendar.currentDay": "Jour actuel",
    "calendar.noEventsYet": "Événements à venir",
    "calendar.weekday": "Jour de semaine",
    "calendar.seasonPlaceholder": "Saison à venir",
    "calendar.weatherPlaceholder": "Météo à venir",
    "calendar.moonPlaceholder": "Lune à venir",
    "time.current": "Heure actuelle",
    "time.minus2h": "-2 h",
    "time.minus1h": "-1 h",
    "time.minus15m": "-15 min",
    "time.minus5m": "-5 min",
    "time.plus5m": "+5 min",
    "time.plus15m": "+15 min",
    "time.plus1h": "+1 h",
    "time.plus2h": "+2 h",
    "time.longRest": "Pause longue +8 h",
    "settings.resetCalendar": "Réinitialiser le calendrier"
  },
  en: {
    "app.title": "Living Calendar",
    "nav.today": "Today",
    "nav.month": "Month",
    "common.month": "Month",
    "common.year": "Year",
    "calendar.currentDate": "Current date",
    "calendar.currentMonth": "Current month",
    "calendar.currentDay": "Current day",
    "calendar.noEventsYet": "Events coming soon",
    "calendar.weekday": "Weekday",
    "calendar.seasonPlaceholder": "Season coming soon",
    "calendar.weatherPlaceholder": "Weather coming soon",
    "calendar.moonPlaceholder": "Moon coming soon",
    "time.current": "Current time",
    "time.minus2h": "-2 h",
    "time.minus1h": "-1 h",
    "time.minus15m": "-15 min",
    "time.minus5m": "-5 min",
    "time.plus5m": "+5 min",
    "time.plus15m": "+15 min",
    "time.plus1h": "+1 h",
    "time.plus2h": "+2 h",
    "time.longRest": "Long rest +8 h",
    "settings.resetCalendar": "Reset calendar"
  }
};

export const t = (locale: LocaleCode, key: string): string => messages[locale][key] ?? key;