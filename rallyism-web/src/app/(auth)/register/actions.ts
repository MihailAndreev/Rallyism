"use server";

import { redirect } from "next/navigation";

import { createSessionCookie } from "@/lib/auth/session";
import type { AuthActionState } from "@/lib/validation/auth";
import { validateRegisterInput } from "@/lib/validation/auth";
import { createUser, findUserByEmail } from "@/services/users";

export async function registerAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const validationError = validateRegisterInput({
    name,
    email,
    password,
    confirmPassword,
  });

  if (validationError) {
    return { error: validationError };
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const user = await createUser({ name, email, password });

  await createSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  redirect("/pending-approval");
}
