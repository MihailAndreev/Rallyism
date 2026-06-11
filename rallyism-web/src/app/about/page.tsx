import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <Image
          src="/images/rallyism-logo.png"
          alt=""
          width={260}
          height={282}
          priority
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[22rem] w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.095] lg:block"
        />
        <div className="relative min-w-0">
          <p className="text-sm font-semibold uppercase text-rally-blue">
            About Rallyism
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
            Rallyism: more than a memory, more than a rally.
          </h1>
          <div className="mt-6 space-y-5 text-base leading-7 text-zinc-600">
            <p>
              Rallyism is a clean archive for rally journeys across special
              stages, service parks, itineraries, maps, photos, videos and the
              drivers&apos; experience around each event.
            </p>
            <p>
              Instead of leaving rally memories scattered across phones, cloud
              folders, chats and YouTube links, Rallyism brings them together in
              one place. Each event can include albums, photos, video links and
              tags, making it easier to revisit moments from parc ferme, road
              sections, travel days and the atmosphere around the rally itself.
            </p>
            <p>
              Visitors can explore published rally galleries and open albums,
              photos and videos. Registered and approved users can help build
              the archive by creating events, uploading photos, adding YouTube
              videos and tagging media.
            </p>
            <p>
              Rallyism is designed as a clean motorsport memory archive, not a
              social network. Its purpose is simple: preserve rally memories
              with enough structure to make them meaningful and enjoyable to
              revisit.
            </p>
          </div>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-md bg-rally-blue px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover"
            >
              Browse Rallyism
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
