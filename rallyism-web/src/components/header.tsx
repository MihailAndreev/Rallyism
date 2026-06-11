import Link from "next/link";
import Image from "next/image";

import { logoutAction } from "@/app/logout/actions";
import { canContribute, isAdmin } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";

export async function Header() {
  const user = await getCurrentUser();
  const navItemClass =
    "inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-rally-blue-border hover:bg-rally-blue-soft hover:text-rally-blue";
  const userBadgeClass =
    "inline-flex h-9 items-center justify-center rounded-md border border-rally-orange-border bg-rally-orange-soft px-3 text-sm font-semibold text-zinc-950";

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
            className={navItemClass}
          >
            Home
          </Link>
          <Link
            href="/about"
            className={navItemClass}
          >
            About
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className={navItemClass}
              >
                Dashboard
              </Link>
              {canContribute(user) ? (
                <Link
                  href="/tags"
                  className={navItemClass}
                >
                  Tags
                </Link>
              ) : null}
              {isAdmin(user) ? (
                <Link
                  href="/admin/rally-events"
                  className={navItemClass}
                >
                  Admin
                </Link>
              ) : null}
              <span className={userBadgeClass}>
                {user.name || user.email}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className={navItemClass}
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={navItemClass}
              >
                Login
              </Link>
              <Link
                href="/register"
                className={navItemClass}
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
