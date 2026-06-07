import { describe, expect, it } from "vitest";

import { getTagSlug, normalizeTagName, parseTagNames } from "./tags";

describe("tag helpers", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeTagName("  Rally   Sweden   2024  ")).toBe(
      "Rally Sweden 2024",
    );
  });

  it("creates stable slugs", () => {
    expect(getTagSlug("  Sébastien   Ogier!  ")).toBe("sebastien-ogier");
  });

  it("parses comma-separated tags", () => {
    expect(parseTagNames("Lappi, service park, Stage 12")).toEqual([
      "Lappi",
      "service park",
      "Stage 12",
    ]);
  });

  it("removes duplicates by slug", () => {
    expect(parseTagNames("Rally Sweden, rally   sweden, RALLY-SWEDEN")).toEqual([
      "Rally Sweden",
    ]);
  });

  it("skips empty or unsluggable tags", () => {
    expect(parseTagNames(" , !!!, Toyota")).toEqual(["Toyota"]);
  });
});
