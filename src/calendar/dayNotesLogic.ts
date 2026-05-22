import type { CalendarDate, CalendarProject, DayNote } from "../domain/types";

const sameDay = (a: CalendarDate, b: CalendarDate): boolean => a.year === b.year && a.monthId === b.monthId && a.dayOfMonth === b.dayOfMonth;

export const getDayNotesForDay = (project: CalendarProject, date: CalendarDate): DayNote[] => (project.dayNotes ?? []).filter((n) => sameDay(n.date, date));
export const getPlayerVisibleDayNotesForDay = (project: CalendarProject, date: CalendarDate): DayNote[] =>
  getDayNotesForDay(project, date).filter((n) => n.visibility === "players");
export const addDayNote = (project: CalendarProject, note: DayNote): CalendarProject => ({ ...project, dayNotes: [...(project.dayNotes ?? []), note] });
export const updateDayNote = (project: CalendarProject, noteId: string, patch: Partial<DayNote>): CalendarProject => ({
  ...project,
  dayNotes: (project.dayNotes ?? []).map((n) => (n.id === noteId ? { ...n, ...patch, updatedAt: Date.now() } : n))
});
export const deleteDayNote = (project: CalendarProject, noteId: string): CalendarProject => ({
  ...project,
  dayNotes: (project.dayNotes ?? []).filter((n) => n.id !== noteId)
});
export const createDefaultDayNote = (project: CalendarProject, date: CalendarDate): DayNote => ({
  id: `day-note-${Date.now()}`,
  date: { ...date, hour: 0, minute: 0 },
  gmNote: "",
  playerNote: "",
  visibility: "gm",
  updatedAt: Date.now()
});

