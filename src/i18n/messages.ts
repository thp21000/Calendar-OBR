import type { LocaleCode } from "../domain/types";
import { enMessages } from "./locales/en";
import { frMessages } from "./locales/fr";

export type MessageDictionary = Record<string, string>;

export const messages: Record<LocaleCode, MessageDictionary> = {
  fr: frMessages,
  en: enMessages