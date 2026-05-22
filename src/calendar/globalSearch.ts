import type { CalendarDate, CalendarEventVisibility, CalendarProject } from "../domain/types";
import { isImageUrl } from "./eventsLogic";

export type GlobalSearchResult = {
  id: string;
  type: "event" | "moonEvent" | "dayNote";
  title: string;
  summary?: string;
  date?: CalendarDate;
  visibility?: CalendarEventVisibility | "gm" | "players";
  sourceId: string;
};

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const includesQuery = (query: string, ...values: Array<string | undefined>): boolean =>
  values.some((value) => (value ? normalize(value).includes(query) : false));

const typeOrder: Record<GlobalSearchResult["type"], number> = { event: 0, moonEvent: 1, dayNote: 2 };

export const searchCalendarProject = (project: CalendarProject, query: string): GlobalSearchResult[] => {
  const q = normalize(query);
  if (q.length < 2) return [];

  const moonNameById = new Map(project.moons.map((moon) => [moon.id, moon.name]));
  const results: GlobalSearchResult[] = [];

  for (const event of project.events) {
    const textIcon = event.icon && !isImageUrl(event.icon) ? event.icon : undefined;
    if (!includesQuery(q, event.name, event.summary, event.playerDescription, event.gmDescription, textIcon)) continue;
    results.push({
      id: `event:${event.id}`,
      type: "event",
      title: event.name,
      summary: event.summary || undefined,
      date: event.date,
      visibility: event.visibility,
      sourceId: event.id
    });
  }

  for (const moonEvent of project.moonEvents ?? []) {
    const moonName = moonNameById.get(moonEvent.moonId);
    if (!includesQuery(q, moonEvent.name, moonEvent.summary, moonEvent.playerDescription, moonEvent.gmDescription, moonName)) continue;
    results.push({
      id: `moonEvent:${moonEvent.id}`,
      type: "moonEvent",
      title: moonEvent.name,
      summary: moonEvent.summary || undefined,
      visibility: moonEvent.visibility,
      sourceId: moonEvent.id
    });
  }

  for (const note of project.dayNotes ?? []) {
    if (!includesQuery(q, note.gmNote, note.playerNote)) continue;
    results.push({
      id: `dayNote:${note.id}`,
      type: "dayNote",
      title: `Y${note.date.year} ${note.date.monthId} ${note.date.dayOfMonth}`,
      summary: note.playerNote || note.gmNote || undefined,
      date: note.date,
      visibility: note.visibility,
      sourceId: note.id
    });
  }

  return results
    .sort((a, b) => {
      const typeDelta = typeOrder[a.type] - typeOrder[b.type];
      if (typeDelta !== 0) return typeDelta;
      if (a.date && b.date) {
        if (a.date.year !== b.date.year) return a.date.year - b.date.year;
        if (a.date.monthId !== b.date.monthId) return a.date.monthId.localeCompare(b.date.monthId);
        if (a.date.dayOfMonth !== b.date.dayOfMonth) return a.date.dayOfMonth - b.date.dayOfMonth;
      }
      return a.title.localeCompare(b.title);
    })
    .slice(0, 25);
};
