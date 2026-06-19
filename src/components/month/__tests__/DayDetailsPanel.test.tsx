import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getDayDetails } from "../../../calendar/dayDetails";
import { createDefaultCalendarProject } from "../../../storage/calendarStorage";
import { DayDetailsPanel } from "../DayDetailsPanel";

describe("DayDetailsPanel", () => {
  it("renders GM day details synchronously when a month day is selected", () => {
    const project = createDefaultCalendarProject();
    const dayDetails = getDayDetails(project, { year: 1000, monthId: "month-1", dayOfMonth: 1, hour: 0, minute: 0 });

    const html = renderToStaticMarkup(createElement(DayDetailsPanel, {
      project,
      dayDetails,
      notes: [],
      onClose: () => undefined,
      onProjectUpdate: () => undefined
    }));

    expect(html).toContain("Événements du jour");
    expect(html).toContain("Notes du jour");
  });
});
