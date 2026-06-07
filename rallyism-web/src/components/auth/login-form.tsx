"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction } from "@/app/(auth)/login/actions";
import { initialAuthActionState } from "@/lib/validation/auth";

type LoginFormProps = {
  from: string;
  message?: string;
};

export function LoginForm({ from, message = "" }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="from" value={from} />
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
          className="h-12 w-full rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-rally-blue focus:ring-2 focus:ring-rally-blue-soft"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-zinc-800">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 w-full rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-rally-blue focus:ring-2 focus:ring-rally-blue-soft"
          placeholder="Enter your password"
        />
      </div>
      <div
        aria-live="polite"
        className={`min-h-6 text-sm font-medium ${
          state.error ? "text-red-700" : "text-emerald-700"
        }`}
      >
        {state.error || message}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="h-12 w-full rounded-md bg-rally-blue px-5 text-base font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover focus:outline-none focus:ring-2 focus:ring-rally-blue focus:ring-offset-2"
      >
        {isPending ? "Logging in..." : "Login"}
      </button>
      <p className="text-center text-sm text-zinc-600">
        <Link href="/forgot-password" className="font-semibold text-rally-blue">
          Forgot password?
        </Link>
      </p>
      <p className="text-center text-sm text-zinc-600">
        New to Rallyism?{" "}
        <Link href="/register" className="font-semibold text-rally-blue">
          Create an account
        </Link>
      </p>
    </form>
  );
}
