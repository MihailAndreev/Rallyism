"use server";

import { redirect } from "next/navigation";

import { createSessionCookie } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import type { AuthActionState } from "@/lib/validation/auth";
import {
  getSafeRedirectPath,
  validateLoginInput,
} from "@/lib/validation/auth";
import { findUserWithPasswordByEmail } from "@/services/users";

export async function loginAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = getSafeRedirectPath(formData.get("from"));
  const validationError = validateLoginInput({ email, password });

  if (validationError) {
    return { error: validationError };
  }

  const user = await findUserWithPasswordByEmail(email);
  const passwordMatches = user
    ? await verifyPassword(password, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    return { error: "Invalid email or password." };
  }

  await createSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  redirect(redirectTo);
}
