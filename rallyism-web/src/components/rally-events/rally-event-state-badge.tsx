import type { RallyEventState } from "@/services/rally-events";

const stateStyles: Record<RallyEventState, string> = {
  upcoming: "border-sky-200 bg-sky-50 text-sky-700",
  current: "border-emerald-200 bg-emerald-50 text-emerald-700",
  past: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

export function RallyEventStateBadge({ state }: { state: RallyEventState }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold capitalize ${stateStyles[state]}`}
    >
      {state}
    </span>
  );
}
