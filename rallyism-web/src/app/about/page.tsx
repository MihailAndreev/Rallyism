import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-rally-blue">
          About Rallyism
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
          A clean archive for rally memories.
        </h1>
        <div className="mt-6 space-y-5 text-base leading-7 text-zinc-600">
          <p>
            Rallyism is a personal rally memories gallery created to collect,
            organize and preserve photos, videos and stories from rally events
            and trips.
          </p>
          <p>
            Instead of keeping rally memories scattered across phones, cloud
            folders, chats and YouTube links, Rallyism brings them together in
            one clean place. Each rally event can have albums, photos, YouTube
            video links and simple tags, making it easier to browse memories by
            event, trip, location, driver or moment.
          </p>
          <p>
            Visitors can explore published rally galleries and open albums,
            photos and videos. Registered and approved users can help build the
            archive by creating events, uploading photos, adding YouTube videos
            and tagging media.
          </p>
          <p>
            Rallyism is designed as a clean motorsport memory archive, not a
            social network. Its purpose is simple: preserve rally moments and
            make them enjoyable to revisit.
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
      </section>
    </div>
  );
}
