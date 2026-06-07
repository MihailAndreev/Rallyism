"use server";

import { redirect } from "next/navigation";

import {
  validateResetPasswordInput,
  type AuthActionState,
} from "@/lib/validation/auth";
import { resetPasswordWithToken } from "@/services/users";

export async function resetPasswordAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const validationError = validateResetPasswordInput({
    password,
    confirmPassword,
  });

  if (!token) {
    return { error: "Reset token is missing." };
  }

  if (validationError) {
    return { error: validationError };
  }

  const result = await resetPasswordWithToken({ token, password });

  if (result.status === "invalid-token") {
    return { error: "This reset link is invalid or has expired." };
  }

  redirect("/login?message=Password%20reset.%20You%20can%20now%20log%20in.");
}
