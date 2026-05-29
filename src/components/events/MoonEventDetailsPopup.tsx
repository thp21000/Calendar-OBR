import { useState, type ReactNode } from "react";
import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import { getNextMoonEventActivationDays } from "../../calendar/moonEventsLogic";
import type { CalendarProject, MoonEvent } from "../../domain/types";
import { t } from "../../i18n/messages";
import { sendPopupNotification } from "../../obr/popupNotifications";
import { Badge, SecondaryButton } from "../ui";


const CollapsibleDetailSection = ({ title, children, defaultOpen = false, empty = false }: { title: string; children: ReactNode; defaultOpen?: boolean; empty?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section style={{ fontSize: 12, border: "1px solid #374151", borderRadius: 6, background: "#0f172a", padding: 6, opacity: empty ? 0.85 : 1 }}>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, border: 0, background: "transparent", color: "#e5e7eb", padding: 0, fontWeight: 700, textAlign: "left", cursor: "pointer" }}
      >
        <span>{title}</span>
        <span aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
      </button>
      {isOpen ? <div style={{ marginTop: 6 }}>{children}</div> : null}
    </section>
  );
};

const formatMoonEventVisibility = (project: CalendarProject, visibility: "gm" | "players" | "revealOnTrigger") => {
  if (visibility === "gm") return t(project.locale, "events.visibilityGm");
  if (visibility === "players") return t(project.locale, "events.visibilityPlayers");
  return t(project.locale, "events.visibilityRevealOnTrigger");
};

export const MoonEventDetailsPopup = ({ project, event, onClose, contextDateLabel }: { project: CalendarProject; event: MoonEvent; onClose: () => void; contextDateLabel?: string }) => {
  const moon = project.moons.find((item) => item.id === event.moonId);
  const nextActivationDays = getNextMoonEventActivationDays(project, event, project.currentTime.absoluteDay, 3);
  const nextActivationLabels = nextActivationDays.map((absoluteDay) => {
    const date = absoluteDayToCalendarDate({ absoluteDay, hour: 0, minute: 0 }, project.calendarSystem);
    const month = project.calendarSystem.months.find((item) => item.id === date.monthId);
    return `${date.dayOfMonth} ${month?.name ?? date.monthId} ${date.year}`;
  });

  const canSendToPlayers = event.visibility === "players" || (event.visibility === "revealOnTrigger" && event.status === "triggered");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 360, maxHeight: "85vh", overflow: "auto", border: "1px solid #374151", borderRadius: 8, padding: 8, background: "#111827" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span>{event.icon ?? "🌕"}</span>
            <strong style={{ lineHeight: 1.2, overflowWrap: "anywhere" }}>{event.name}</strong>
          </div>
          <button type="button" onClick={onClose} title={t(project.locale, "month.closeDayDetails")} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "#e5e7eb", fontSize: 18, lineHeight: 1, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <Badge>{t(project.locale, "moonEvents.detailsTitle")}</Badge>
            <Badge>{t(project.locale, "events.visibility")}: {formatMoonEventVisibility(project, event.visibility)}</Badge>
            <Badge>{t(project.locale, "moonEvents.activationEnabled")}: {event.enabled ? t(project.locale, "moonEvents.activationEnabledYes") : t(project.locale, "moonEvents.activationEnabledNo")}</Badge>
            <Badge>{t(project.locale, "moonEvents.notifyOnTrigger")}: {event.notifyOnTrigger ? t(project.locale, "common.yes") : t(project.locale, "common.no")}</Badge>
          </div>
          <div style={{ fontSize: 12, color: "#e5e7eb" }}>
            {moon?.name ?? t(project.locale, "moonEvents.unknownMoon")} · {t(project.locale, `moon.phase.${event.phaseId}`)}
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {event.summary ? (
            <CollapsibleDetailSection title={t(project.locale, "moonEvents.summary")}>
              <div style={{ whiteSpace: "pre-wrap", color: "#d1d5db" }}>{event.summary}</div>
            </CollapsibleDetailSection>
          ) : null}
          <CollapsibleDetailSection title={t(project.locale, "moonEvents.playerDescription")} empty={!event.playerDescription?.trim()}>
            <div style={{ whiteSpace: "pre-wrap", color: "#d1d5db" }}>{event.playerDescription?.trim() || t(project.locale, "moonEvents.noPlayerDescription")}</div>
          </CollapsibleDetailSection>
          <CollapsibleDetailSection title={t(project.locale, "moonEvents.gmDescription")} empty={!event.gmDescription?.trim()}>
            <div style={{ whiteSpace: "pre-wrap", color: "#d1d5db" }}>{event.gmDescription?.trim() || t(project.locale, "moonEvents.noGmDescription")}</div>
          </CollapsibleDetailSection>
          <CollapsibleDetailSection title={t(project.locale, "moonEvents.nextActivationsTitle")} empty={nextActivationLabels.length === 0}>
            <div style={{ color: "#d1d5db" }}>
              {nextActivationLabels.length === 0 ? <div>{t(project.locale, "moonEvents.nextActivationUnknown")}</div> : <ul style={{ margin: 0, paddingLeft: 16 }}>{nextActivationLabels.map((label) => <li key={label}>{label}</li>)}</ul>}
            </div>
          </CollapsibleDetailSection>
        </div>

        {canSendToPlayers ? (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <SecondaryButton
              type="button"
              onClick={() =>
                sendPopupNotification({
                  type: "event",
                  audience: "players",
                  title: event.name,
                  body: event.playerDescription?.trim() || event.summary || event.name,
                  date: contextDateLabel ?? "",
                  icon: event.icon,
                  summary: event.summary,
                  playerDescription: event.playerDescription
                })
              }
            >
              {t(project.locale, "moonEvents.sendToPlayers")}
            </SecondaryButton>
          </div>
        ) : null}
      </div>
    </div>