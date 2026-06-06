import { describe, expect, it } from "vitest";
import { messages } from "../messages";

describe("i18n messages", () => {
  it("has the same keys in French and English", () => {
    expect(Object.keys(messages.fr).sort()).toEqual(Object.keys(messages.en).sort());
  });
});