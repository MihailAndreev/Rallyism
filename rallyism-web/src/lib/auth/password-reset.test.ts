import { describe, expect, it } from "vitest";

import {
  createPasswordResetPlainToken,
  getPasswordResetExpiry,
  getPasswordResetTokenHash,
  isPasswordResetExpired,
  safeCompareResetTokenHash,
} from "./password-reset";

describe("password reset helpers", () => {
  it("generates URL-safe random tokens", () => {
    const token = createPasswordResetPlainToken();

    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("hashes reset tokens without storing raw token text", () => {
    const token = "reset-token";
    const hash = getPasswordResetTokenHash(token);

    expect(hash).not.toBe(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("compares token hashes safely", () => {
    const hash = getPasswordResetTokenHash("reset-token");

    expect(safeCompareResetTokenHash(hash, hash)).toBe(true);
    expect(safeCompareResetTokenHash(hash, getPasswordResetTokenHash("other"))).toBe(
      false,
    );
    expect(safeCompareResetTokenHash(hash, "abc")).toBe(false);
  });

  it("detects expiry", () => {
    const now = new Date("2024-01-01T12:00:00Z");
    const expiresAt = getPasswordResetExpiry(now);

    expect(isPasswordResetExpired(expiresAt, now)).toBe(false);
    expect(isPasswordResetExpired(expiresAt, expiresAt)).toBe(true);
  });
});
