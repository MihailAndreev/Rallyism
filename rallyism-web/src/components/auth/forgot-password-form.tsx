"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  forgotPasswordAction,
  type ForgotPasswordActionState,
} from "@/app/(auth)/forgot-password/actions";

const initialState: ForgotPasswordActionState = {
  error: "",
};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-zinc-800">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 w-full rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
          placeholder="you@example.com"
        />
      </div>
      <div aria-live="polite" className="min-h-6 text-sm font-medium">
        {state.error ? (
          <span className="text-red-700">{state.error}</span>
        ) : state.success ? (
          <span className="text-emerald-700">{state.success}</span>
        ) : null}
      </div>
      {state.devResetUrl ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Development reset link</p>
          <Link
            href={state.devResetUrl}
            className="break-all font-semibold text-red-700 hover:text-red-800"
          >
            {state.devResetUrl}
          </Link>
        </div>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="h-12 w-full rounded-md bg-red-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Creating link..." : "Create reset link"}
      </button>
      <p className="text-center text-sm text-zinc-600">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-red-700">
          Login
        </Link>
      </p>
    </form>
  );
}
