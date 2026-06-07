"use client";

import { useState } from "react";

export function ShareRallyLinkButton() {
  const [message, setMessage] = useState("");

  async function handleCopy() {
    const url = window.location.href;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("textarea");
        input.value = url;
        input.setAttribute("readonly", "true");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }

      setMessage("Link copied");
    } catch {
      setMessage("Copy unavailable. Select the browser address instead.");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCopy}
        className="h-11 w-full rounded-md bg-rally-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover focus:outline-none focus:ring-2 focus:ring-rally-blue focus:ring-offset-2"
      >
        Share rally link
      </button>
      <p aria-live="polite" className="min-h-5 text-xs font-medium text-zinc-500">
        {message}
      </p>
    </div>
  );
}
