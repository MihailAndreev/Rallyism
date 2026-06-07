import { describe, expect, it } from "vitest";

import {
  validateLoginInput,
  validateRegisterInput,
  validateResetPasswordInput,
} from "./auth";

describe("auth validation", () => {
  it("rejects invalid login email", () => {
    expect(validateLoginInput({ email: "bad-email", password: "secret" })).toBe(
      "Enter a valid email address.",
    );
  });

  it("rejects missing login password", () => {
    expect(validateLoginInput({ email: "user@example.com", password: "" })).toBe(
      "Password is required.",
    );
  });

  it("rejects short register passwords", () => {
    expect(
      validateRegisterInput({
        name: "Rally User",
        email: "user@example.com",
        password: "12345",
        confirmPassword: "12345",
      }),
    ).toBe("Password must be at least 6 characters.");
  });

  it("rejects register password mismatch", () => {
    expect(
      validateRegisterInput({
        name: "Rally User",
        email: "user@example.com",
        password: "secret1",
        confirmPassword: "secret2",
      }),
    ).toBe("Passwords do not match.");
  });

  it("validates reset password mismatch", () => {
    expect(
      validateResetPasswordInput({
        password: "secret1",
        confirmPassword: "secret2",
      }),
    ).toBe("Passwords do not match.");
  });
});
