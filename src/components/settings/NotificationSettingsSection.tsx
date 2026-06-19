import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";

type Props = {
  project: CalendarProject;
  onProjectUpdate: (project: CalendarProject) => void;
};

const checkLabelStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, fontSize: 12 };

export const NotificationSettingsSection = ({ project, onProjectUpdate }: Props) => {
  const settings = project.notificationSettings ?? {};
  const update = (patch: NonNullable<CalendarProject["notificationSettings"]>) => {
    onProjectUpdate({ ...project, notificationSettings: { ...settings, ...patch } });
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label style={checkLabelStyle}>
        <input
          type="checkbox"
          checked={settings.notifyDatedEventsToPlayers ?? true}
          onChange={(event) => update({ notifyDatedEventsToPlayers: event.target.checked })}
        />
        <span>{t(project.locale, "notifications.notifyDatedEventsToPlayers")}</span>
      </label>
    </div>
  );
};
