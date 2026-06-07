"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ToastTone = "success" | "error" | "neutral";

type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
};

function getToast(input: { code: string | null; count: string | null }): Toast | null {
  if (!input.code) {
    return null;
  }

  const count = Number(input.count ?? 0);
  const photoCount = Number.isInteger(count) && count > 0 ? count : 0;

  if (input.code === "photos-deleted") {
    return {
      id: `${input.code}-${input.count ?? ""}`,
      message: `${photoCount} photo${photoCount === 1 ? "" : "s"} deleted.`,
      tone: "success",
    };
  }

  if (input.code === "photos-delete-failed") {
    return {
      id: input.code,
      message: "Selected photos could not be deleted.",
      tone: "error",
    };
  }

  if (input.code === "photo-deleted") {
    return {
      id: input.code,
      message: "Photo deleted.",
      tone: "success",
    };
  }

  if (input.code === "album-deleted") {
    return {
      id: input.code,
      message: "Album deleted.",
      tone: "success",
    };
  }

  if (input.code === "event-deleted") {
    return {
      id: input.code,
      message: "Rally event deleted.",
      tone: "success",
    };
  }

  return null;
}

function getToastClass(tone: ToastTone) {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (tone === "error") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  return "border-zinc-200 bg-white text-zinc-900";
}

export function ToastFromSearchParams() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<Toast | null>(null);
  const toastInput = useMemo(
    () => ({
      code: searchParams.get("toast"),
      count: searchParams.get("count"),
      query: searchParams.toString(),
    }),
    [searchParams],
  );

  useEffect(() => {
    const nextToast = getToast(toastInput);

    if (!nextToast) {
      return;
    }

    const showToastTimeoutId = window.setTimeout(() => {
      setToast(nextToast);
    }, 0);

    const params = new URLSearchParams(toastInput.query);
    params.delete("toast");
    params.delete("count");

    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });

    return () => window.clearTimeout(showToastTimeoutId);
  }, [pathname, router, toastInput]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 4500);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  if (!toast) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="fixed right-4 top-4 z-50 w-[calc(100vw-2rem)] max-w-sm sm:right-6 sm:top-6"
    >
      <div
        className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${getToastClass(
          toast.tone,
        )}`}
      >
        <p className="min-w-0 flex-1 text-sm font-semibold leading-5">
          {toast.message}
        </p>
        <button
          type="button"
          aria-label="Dismiss notification"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-lg leading-none transition hover:bg-black/5"
          onClick={() => setToast(null)}
        >
          x
        </button>
      </div>
    </div>
  );
}
