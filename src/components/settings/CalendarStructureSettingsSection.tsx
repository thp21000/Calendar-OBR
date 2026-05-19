import type { CalendarProject } from "../../domain/types";
import { t } from "../../i18n/messages";
import { CollapsibleSection } from "../CollapsibleSection";
import { CalendarReferenceSettingsSection } from "./CalendarReferenceSettingsSection";
import { MonthsSettingsSection } from "./MonthsSettingsSection";
import { WeekdaysSettingsSection } from "./WeekdaysSettingsSection";
import { YearsSettingsSection } from "./YearsSettingsSection";

export const CalendarStructureSettingsSection = ({ project, onProjectUpdate, inputStyle }: { project: CalendarProject; onProjectUpdate: (project: CalendarProject) => void; inputStyle: React.CSSProperties }) => (
  <>
    <CollapsibleSection title={t(project.locale, "settings.section.months")}>
      <MonthsSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
    </CollapsibleSection>

    <CollapsibleSection title={t(project.locale, "settings.section.weekdays")}>
      <WeekdaysSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
    </CollapsibleSection>

    <CollapsibleSection title={t(project.locale, "settings.section.calendarReference")}>
      <CalendarReferenceSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
    </CollapsibleSection>

    <CollapsibleSection title={t(project.locale, "settings.section.years")}>
      <YearsSettingsSection project={project} onProjectUpdate={onProjectUpdate} inputStyle={inputStyle} />
    </CollapsibleSection>
  </>
);
