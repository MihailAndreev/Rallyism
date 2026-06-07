import { describe, expect, it } from "vitest";

import { formatDate, formatDateRange } from "./rally-event-format";

describe("rally event date formatting", () => {
  it("formats dates as dd/mm/yyyy", () => {
    expect(formatDate("2024-02-18")).toBe("18/02/2024");
  });

  it("handles missing dates", () => {
    expect(formatDate(null)).toBe("Date TBC");
  });

  it("formats date ranges", () => {
    expect(formatDateRange("2024-02-18", "2024-02-20")).toBe(
      "18/02/2024 - 20/02/2024",
    );
  });

  it("does not repeat identical range dates", () => {
    expect(formatDateRange("2024-02-18", "2024-02-18")).toBe("18/02/2024");
  });
});
