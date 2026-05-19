import { t } from "../../i18n/messages";
import type { StorageScope } from "../../obr/roomScope";

type Props = {
  locale: "fr" | "en";
  scope: StorageScope;
  onReset: () => void;
};

export const DataSettingsSection = ({ locale, scope, onReset }: Props) => (
  <>
    <div>{t(locale, "settings.storageScope")}: {scope.type === "obr-room" ? t(locale, "settings.storageScopeRoom") : "Local"}</div>
    <RowButtons>
      <Action onClick={onReset}>{t(locale, "settings.resetCalendar")}</Action>
      <Action disabled>{t(locale, "settings.exportJson")} ({t(locale, "common.comingSoon")})</Action>
      <Action disabled>{t(locale, "settings.importJson")} ({t(locale, "common.comingSoon")})</Action>
    </RowButtons>
  </>
);

const RowButtons = ({ children }: { children: React.ReactNode }) => <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>{children}</div>;
const Action = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button type="button" style={{ border: "1px solid #4b5563", borderRadius: 6, background: "#1f2937", color: "#e5e7eb", padding: "5px 8px", fontSize: 12 }} {...props}>{children}</button>;
