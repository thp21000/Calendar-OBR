import { calendarDateToAbsoluteDay } from "./dateEngine";
import type { CalendarDate, CalendarProject, CalendarSystem, CalendarMonth, CalendarWeekday, InternalTime, UiSettings } from "../domain/types";

const sortedMonths = (system: CalendarSystem) => [...system.months].sort((a, b) => a.order - b.order);
const sortedWeekdays = (system: CalendarSystem) => [...system.weekdays].sort((a, b) => a.order - b.order);

const normalizeWeekdaySettings = (weekdays: CalendarWeekday[], ui: UiSettings): UiSettings => {
  const validIds = new Set(weekdays.map((w) => w.id));
  if (!ui.monthGridStartsOnWeekdayId || validIds.has(ui.monthGridStartsOnWeekdayId)) return ui;
  return { ...ui, monthGridStartsOnWeekdayId: weekdays[0]?.id };
};

const clampOffset = (offset: number | undefined, weekdaysLength: number): number => {
  if (weekdaysLength <= 0) return 0;
  return Math.min(Math.max(0, Math.trunc(offset ?? 0)), weekdaysLength - 1);
};

export const clampDateParts = (date: CalendarDate, system: CalendarSystem): CalendarDate => {
  const months = sortedMonths(system);
  const month = months.find((m) => m.id === date.monthId) ?? months[0];
  const dayOfMonth = Math.max(1, Math.min(date.dayOfMonth, month.days));
  const hour = Math.max(0, Math.min(23, Math.trunc(date.hour)));
  const minute = Math.max(0, Math.min(59, Math.trunc(date.minute)));
  return { ...date, monthId: month.id, dayOfMonth, hour, minute };
};

export const updateCurrentTimeFromDate = (project: CalendarProject, date: CalendarDate): InternalTime => {
  const clamped = clampDateParts(date, project.calendarSystem);
  return calendarDateToAbsoluteDay(clamped, project.calendarSystem);
};

export const ensureValidCalendarSystem = (system: CalendarSystem): CalendarSystem => {
  const months = system.months.length > 0 ? system.months : [{ id: "month-1", name: "Month 1", order: 1, days: 30 }];
  const weekdays = system.weekdays.length > 0 ? system.weekdays : [{ id: "day-1", name: "Day 1", shortName: "D1", order: 1 }];
  const normalizedWeekdays = weekdays.map((d, i) => ({ ...d, order: i + 1 }));

  return {
    ...system,
    firstWeekdayOffset: clampOffset(system.firstWeekdayOffset, normalizedWeekdays.length),
    months: months.map((m, i) => ({ ...m, days: Math.max(1, Math.trunc(m.days)), order: i + 1 })),
    weekdays: normalizedWeekdays
  };
};

export const moveMonth = (system: CalendarSystem, monthId: string, direction: -1 | 1): CalendarSystem => {
  const months = sortedMonths(system);
  const index = months.findIndex((m) => m.id === monthId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= months.length) return system;
  [months[index], months[target]] = [months[target], months[index]];
  return { ...system, months: months.map((m, i) => ({ ...m, order: i + 1 })) };
};

export const moveWeekday = (system: CalendarSystem, weekdayId: string, direction: -1 | 1): CalendarSystem => {
  const weekdays = sortedWeekdays(system);
  const index = weekdays.findIndex((d) => d.id === weekdayId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= weekdays.length) return system;
  [weekdays[index], weekdays[target]] = [weekdays[target], weekdays[index]];
  return { ...system, weekdays: weekdays.map((d, i) => ({ ...d, order: i + 1 })) };
};

export const updateMonth = (system: CalendarSystem, monthId: string, patch: Partial<CalendarMonth>): CalendarSystem => ({
  ...system,
  months: sortedMonths(system).map((m, i) => m.id === monthId ? { ...m, ...patch, days: Math.max(1, Math.trunc((patch.days ?? m.days))), order: i + 1 } : { ...m, order: i + 1 })
});

export const updateWeekday = (system: CalendarSystem, weekdayId: string, patch: Partial<CalendarWeekday>): CalendarSystem => ({
  ...system,
  weekdays: sortedWeekdays(system).map((d, i) => d.id === weekdayId ? { ...d, ...patch, order: i + 1 } : { ...d, order: i + 1 })
});

export const addMonth = (system: CalendarSystem): CalendarSystem => {
  const months = sortedMonths(system);
  months.push({ id: `month-${Date.now()}`, name: `Month ${months.length + 1}`, shortName: "", days: 30, order: months.length + 1 });
  return { ...system, months };
};

export const addWeekday = (system: CalendarSystem): CalendarSystem => {
  const weekdays = sortedWeekdays(system);
  weekdays.push({ id: `day-${Date.now()}`, name: `Day ${weekdays.length + 1}`, shortName: `D${weekdays.length + 1}`, order: weekdays.length + 1 });
  return { ...system, weekdays };
};

export const removeMonth = (system: CalendarSystem, monthId: string): CalendarSystem => {
  const months = sortedMonths(system);
  if (months.length <= 1) return system;
  return { ...system, months: months.filter((m) => m.id !== monthId).map((m, i) => ({ ...m, order: i + 1 })) };
};

export const removeWeekday = (system: CalendarSystem, weekdayId: string): CalendarSystem => {
  const weekdays = sortedWeekdays(system);
  if (weekdays.length <= 1) return system;
  const next = weekdays.filter((d) => d.id !== weekdayId).map((d, i) => ({ ...d, order: i + 1 }));
  return { ...system, weekdays: next, firstWeekdayOffset: clampOffset(system.firstWeekdayOffset, next.length) };
};

export const normalizeUiSettingsWeekdaySelection = (system: CalendarSystem, uiSettings: UiSettings): UiSettings =>
  normalizeWeekdaySettings(sortedWeekdays(system), uiSettings);