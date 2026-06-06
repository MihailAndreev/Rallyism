import {
  formatChampionship,
  formatDateRange,
  formatDateTime,
} from "@/components/rally-events/rally-event-format";
import { RallyEventMetaRow } from "@/components/rally-events/rally-event-meta-row";
import type { RallyEventSummary } from "@/services/rally-events";

export function RallyEventMeta({ event }: { event: RallyEventSummary }) {
  const location = event.region
    ? `${event.country} / ${event.region}`
    : event.country;

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <RallyEventMetaRow
        label="Championship"
        value={formatChampionship(event.championship)}
      />
      <RallyEventMetaRow label="Season" value={event.seasonYear} />
      <RallyEventMetaRow label="Location" value={location} />
      <RallyEventMetaRow
        label="Dates"
        value={formatDateRange(event.startDate, event.endDate)}
      />
      <RallyEventMetaRow label="Visibility" value={event.visibility} />
      <RallyEventMetaRow label="Featured" value={event.featured ? "Yes" : "No"} />
      <RallyEventMetaRow label="Creator" value={event.creatorName ?? "Unknown"} />
      <RallyEventMetaRow label="Created" value={formatDateTime(event.createdAt)} />
      <RallyEventMetaRow label="Updated" value={formatDateTime(event.updatedAt)} />
    </dl>
  );
}
