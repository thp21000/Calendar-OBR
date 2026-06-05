import { useState } from "react";
import { changeWeatherBiome, getCurrentWeatherBiomeDefinition, getWeatherBiomeDefinition, WEATHER_BIOME_DEFINITIONS, type WeatherBiomeId } from "../../calendar/weather/biomes";
import { absoluteDayToCalendarDate } from "../../calendar/dateEngine";
import { formatDisplayDate } from "../../calendar/formatDisplayDate";
import { toAbsoluteMinutes } from "../../calendar/weatherEventsLogic";
import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { sendPopupNotification } from "../../obr/popupNotifications";
import { PrimaryButton, SecondaryButton } from "../ui";

export const WeatherBiomePickerPopup = ({ project, onClose, onApply }: { project: CalendarProject; onClose: () => void; onApply: (project: CalendarProject) => void }) => {
  const currentDefinition = getCurrentWeatherBiomeDefinition(project);
  const [selectedBiomeId, setSelectedBiomeId] = useState<WeatherBiomeId>(currentDefinition.id);
  const selectedDefinition = getWeatherBiomeDefinition(selectedBiomeId);

  const applySelection = () => {
    const changed = selectedBiomeId !== currentDefinition.id;
    onApply(changeWeatherBiome(project, selectedBiomeId, toAbsoluteMinutes(project.currentTime)));
    onClose();
    if (!changed) return;

    const displayDate = absoluteDayToCalendarDate(project.currentTime, project.calendarSystem);
    sendPopupNotification({
      type: "weather",
      audience: "players",
      title: t(project.locale, selectedDefinition.nameKey),
      body: t(project.locale, selectedDefinition.entryMessageKey),
      date: formatDisplayDate(displayDate, project.locale, project.uiSettings.dateFormat, project.uiSettings.timeFormat),
      icon: selectedDefinition.icon,
      summary: t(project.locale, selectedDefinition.descriptionKey)
    });
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true">
      <div style={modalStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>{t(project.locale, "weatherBiome.changeTitle")}</h2>
          <SecondaryButton type="button" onClick={onClose}>×</SecondaryButton>
        </div>

        <div style={{ display: "grid", gap: 6, maxHeight: 360, overflowY: "auto", paddingRight: 2 }}>
          {WEATHER_BIOME_DEFINITIONS.map((definition) => {
            const selected = definition.id === selectedBiomeId;
            const current = definition.id === currentDefinition.id;
            return (
              <button
                key={definition.id}
                type="button"
                onClick={() => setSelectedBiomeId(definition.id)}
                style={{ ...biomeButtonStyle, borderColor: selected ? "#8b7cf6" : "#374151", background: selected ? "rgba(139, 124, 246, 0.2)" : "#111827" }}
              >
                <span style={{ fontSize: 20 }}>{definition.icon}</span>
                <span style={{ display: "grid", gap: 2, textAlign: "left" }}>
                  <span style={{ fontWeight: 800 }}>{t(project.locale, definition.nameKey)} {current ? `· ${t(project.locale, "weatherBiome.current")}` : ""}</span>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{t(project.locale, definition.descriptionKey)}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <SecondaryButton type="button" onClick={onClose}>{t(project.locale, "events.cancel")}</SecondaryButton>
          <PrimaryButton type="button" onClick={applySelection}>{t(project.locale, "weatherBiome.apply")}</PrimaryButton>
        </div>
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: "rgba(2, 6, 23, 0.72)",
  display: "grid",
  placeItems: "center",
  padding: 12
};

const modalStyle: React.CSSProperties = {
  width: "min(560px, 100%)",
  maxHeight: "92vh",
  overflow: "hidden",
  border: "1px solid #374151",
  borderRadius: 10,
  background: "#0f172a",
  color: "#f3f4f6",
  padding: 12,
  boxShadow: "0 18px 45px rgba(0,0,0,0.45)"
};

const biomeButtonStyle: React.CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "28px 1fr",
  gap: 8,
  alignItems: "start",
  border: "1px solid #374151",
  borderRadius: 8,
  color: "#f3f4f6",
  padding: 8,
  cursor: "pointer"
};
