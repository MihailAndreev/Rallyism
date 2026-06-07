"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAction } from "@/app/(auth)/register/actions";
import { initialAuthActionState } from "@/lib/validation/auth";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-zinc-800">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="h-12 w-full rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-rally-blue focus:ring-2 focus:ring-rally-blue-soft"
          placeholder="Your name"
        />
      </div>
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
          autoComplete="new-password"
          required
          minLength={6}
          className="h-12 w-full rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-rally-blue focus:ring-2 focus:ring-rally-blue-soft"
          placeholder="Create a password"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-zinc-800"
        >
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className="h-12 w-full rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-rally-blue focus:ring-2 focus:ring-rally-blue-soft"
          placeholder="Repeat your password"
        />
      </div>
      <div
        aria-live="polite"
        className="min-h-6 text-sm font-medium text-red-700"
      >
        {state.error}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="h-12 w-full rounded-md bg-rally-blue px-5 text-base font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover focus:outline-none focus:ring-2 focus:ring-rally-blue focus:ring-offset-2"
      >
        {isPending ? "Creating account..." : "Register"}
      </button>
      <p className="text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-rally-blue">
          Login
        </Link>
      </p>
    </form>
  );
}
