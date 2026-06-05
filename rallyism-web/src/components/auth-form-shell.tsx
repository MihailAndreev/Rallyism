import type { ReactNode } from "react";

type AuthFormShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthFormShell({ title, subtitle, children }: AuthFormShellProps) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-145px)] w-full max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1fr] lg:px-8">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase text-red-700">
          Rally memories
        </p>
        <h1 className="text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl">
          {title}
        </h1>
        <p className="max-w-xl text-base leading-7 text-zinc-600 sm:text-lg">
          {subtitle}
        </p>
      </section>
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        {children}
      </section>
    </div>
  );
}
