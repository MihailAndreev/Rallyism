import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

import { findUserById } from "@/services/users";

export const sessionCookieName = "rallyism_session";

type SessionPayload = {
  userId: number;
  email: string;
  role: "user" | "admin";
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required for authentication.");
  }

  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    if (
      typeof payload.userId !== "number" ||
      typeof payload.email !== "string" ||
      (payload.role !== "user" && payload.role !== "admin")
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await signSessionToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  const user = await findUserById(session.userId);

  return user?.disabledAt ? null : user;
}
