"use server";

import { headers } from "next/headers";

import {
  validateForgotPasswordInput,
  type AuthActionState,
} from "@/lib/validation/auth";
import { createPasswordResetToken } from "@/services/users";

export type ForgotPasswordActionState = AuthActionState & {
  devResetUrl?: string;
  success?: string;
};

function getBaseUrl(headersList: Headers) {
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol =
    headersList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}

export async function forgotPasswordAction(
  _state: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const validationError = validateForgotPasswordInput({ email });

  if (validationError) {
    return { error: validationError };
  }

  const token = await createPasswordResetToken(email);
  const success =
    "If an account exists for that email, a reset link has been created.";

  if (token && process.env.NODE_ENV !== "production") {
    const baseUrl = getBaseUrl(await headers());
    const params = new URLSearchParams({ token });

    return {
      error: "",
      success,
      devResetUrl: `${baseUrl}/reset-password?${params.toString()}`,
    };
  }

  return { error: "", success };
}
