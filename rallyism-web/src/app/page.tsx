import Image from "next/image";
import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:px-8 lg:py-20">
      <section className="space-y-7">
        <div className="inline-flex rounded-md border border-red-200 bg-white px-3 py-1 text-sm font-medium text-red-700 shadow-sm">
          Welcome to Rallyism
        </div>
        <div className="space-y-5">
          <h1 className="text-5xl font-semibold tracking-normal text-zinc-950 sm:text-6xl">
            Rallyism
          </h1>
          <p className="text-xl font-medium text-zinc-700 sm:text-2xl">
            Your personal rally memories gallery.
          </p>
          <p className="max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
            Organize rally trips, albums, photos and video links in one clean
            place. Browse memories from WRC, ERC and other rally adventures.
          </p>
        </div>
        {user ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-zinc-950">
              Welcome back, {user.name || user.email}.
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Your Rallyism dashboard is ready for the next step.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Go to dashboard
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-md bg-red-600 px-6 text-base font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-md border border-zinc-300 bg-white px-6 text-base font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
            >
              Register
            </Link>
          </div>
        )}
      </section>

      <section aria-label="Rally memory preview" className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <Image
            src="/images/rally-hero.png"
            alt="Rally car on a gravel road during a rally trip"
            width={1536}
            height={1024}
            priority
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="grid gap-3 border-t border-zinc-200 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase text-red-700">
                Events
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Rally trips and weekends
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-red-700">
                Albums
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Stages, service parks, podiums
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-red-700">
                Media
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Photos and YouTube links
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
