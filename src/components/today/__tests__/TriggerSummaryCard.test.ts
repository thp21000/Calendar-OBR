import { describe, expect, it } from "vitest";
import { getNotificationLabelKey } from "../TriggerSummaryCard";

describe("getNotificationLabelKey", () => {
  it("maps eventReminder to reminder label", () => {
    expect(getNotificationLabelKey("eventReminder")).toBe("notifications.eventReminder");
  });
});
