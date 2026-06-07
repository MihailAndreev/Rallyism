import Link from "next/link";
import Image from "next/image";

import { logoutAction } from "@/app/logout/actions";
import { canContribute, isAdmin } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-zinc-200 bg-white/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xl font-semibold tracking-normal text-zinc-950"
        >
          <Image
            src="/images/rallyism-logo.png"
            alt="Rallyism"
            width={48}
            height={52}
            priority
            className="h-12 w-auto"
          />
          <span>Rallyism</span>
        </Link>
        <nav aria-label="Primary navigation" className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            About
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
              >
                Dashboard
              </Link>
              {canContribute(user) ? (
                <Link
                  href="/tags"
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
                >
                  Tags
                </Link>
              ) : null}
              {isAdmin(user) ? (
                <Link
                  href="/admin/rally-events"
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
                >
                  Admin
                </Link>
              ) : null}
              <span className="rounded-md px-3 py-2 text-sm font-semibold text-zinc-950">
                {user.name || user.email}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
