import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const PASSWORD_RESET_TOKEN_BYTES = 32;
export const PASSWORD_RESET_EXPIRY_MINUTES = 60;

export function createPasswordResetPlainToken() {
  return randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("base64url");
}

export function getPasswordResetTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function safeCompareResetTokenHash(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function getPasswordResetExpiry(now = new Date()) {
  return new Date(now.getTime() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);
}

export function isPasswordResetExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() <= now.getTime();
}
