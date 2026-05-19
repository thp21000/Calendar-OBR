import { useState } from "react";
import { isImageUrl } from "../calendar/eventsLogic";
import { t } from "../i18n/messages";
import type { LocaleCode } from "../domain/types";

export const EventIcon = ({ icon, locale }: { icon?: string; locale: LocaleCode }) => {
  const [failed, setFailed] = useState(false);
  if (!icon) return null;

  const shouldRenderImage = isImageUrl(icon) && !failed;

  if (shouldRenderImage) {
    return (
      <img
        src={icon}
        alt={t(locale, "events.imageIcon")}
        onError={() => setFailed(true)}
        style={{ width: 24, height: 24, objectFit: "contain", borderRadius: 4, flexShrink: 0 }}
      />
    );
  }

  return <span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>;
};
