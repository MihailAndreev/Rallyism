import { describe, expect, it } from "vitest";

import {
  canUserContribute,
  isAdminUser,
  isApprovedRegularUser,
} from "./permissions";

const activeUser = {
  approvalStatus: "approved" as const,
  disabledAt: null,
  role: "user" as const,
};

describe("permission helpers", () => {
  it("recognizes active admins", () => {
    expect(
      isAdminUser({ ...activeUser, role: "admin", approvalStatus: "pending" }),
    ).toBe(true);
  });

  it("blocks disabled admins", () => {
    expect(
      isAdminUser({
        ...activeUser,
        role: "admin",
        disabledAt: new Date("2024-01-01"),
      }),
    ).toBe(false);
  });

  it("recognizes approved active users", () => {
    expect(isApprovedRegularUser(activeUser)).toBe(true);
  });

  it("blocks pending, rejected and disabled users from contributing", () => {
    expect(canUserContribute({ ...activeUser, approvalStatus: "pending" })).toBe(
      false,
    );
    expect(canUserContribute({ ...activeUser, approvalStatus: "rejected" })).toBe(
      false,
    );
    expect(
      canUserContribute({
        ...activeUser,
        disabledAt: new Date("2024-01-01"),
      }),
    ).toBe(false);
  });

  it("allows active admins and approved users to contribute", () => {
    expect(canUserContribute(activeUser)).toBe(true);
    expect(canUserContribute({ ...activeUser, role: "admin" })).toBe(true);
  });
});
