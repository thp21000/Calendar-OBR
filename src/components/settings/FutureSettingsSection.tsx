import { t } from "../../i18n/messages";

export const FutureSettingsSection = ({ locale }: { locale: "fr" | "en" }) => (
  <>
    <div>• {t(locale, "settings.futureSeasons")} — {t(locale, "common.comingSoon")}</div>
    <div>• {t(locale, "settings.futureWeather")} — {t(locale, "common.comingSoon")}</div>
    <div>• {t(locale, "settings.futureMoons")} — {t(locale, "common.comingSoon")}</div>
    <div>• {t(locale, "settings.futureEvents")} — {t(locale, "common.comingSoon")}</div>
    <div>• {t(locale, "settings.futurePacks")} — {t(locale, "common.comingSoon")}</div>
  </>
);
