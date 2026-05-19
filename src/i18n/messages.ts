import type { LocaleCode } from "../domain/types";

export const messages: Record<LocaleCode, Record<string, string>> = {
  fr: {
    "common.today": "Aujourd'hui",
    "common.month": "Mois",
    "time.current": "Heure actuelle",
    "time.quick.rest8h": "Pause longue +8 h",
    "calendar.currentDate": "Date actuelle"
  },
  en: {
    "common.today": "Today",
    "common.month": "Month",
    "time.current": "Current time",
    "time.quick.rest8h": "Long rest +8 h",
    "calendar.currentDate": "Current date"
  }
};

export const t = (locale: LocaleCode, key: string): string => messages[locale][key] ?? key;
