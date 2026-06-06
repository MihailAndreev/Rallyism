"use server";

import { redirect } from "next/navigation";

import { requireContributor } from "@/lib/auth/authorization";
import {
  createRallyEvent,
  RallyEventValidationError,
  validateRallyEventInput,
} from "@/services/rally-events";

function getFormInput(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    rallyName: String(formData.get("rallyName") ?? ""),
    championship: String(formData.get("championship") ?? ""),
    seasonYear: String(formData.get("seasonYear") ?? ""),
    country: String(formData.get("country") ?? ""),
    region: String(formData.get("region") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    description: String(formData.get("description") ?? ""),
    coverImageUrl: String(formData.get("coverImageUrl") ?? ""),
    visibility: String(formData.get("visibility") ?? ""),
    featured: formData.get("featured") === "on" ? "on" : null,
  };
}

function getErrorHref(message: string) {
  const params = new URLSearchParams({ error: message });

  return `/rally-events/new?${params.toString()}`;
}

export async function createRallyEventAction(formData: FormData) {
  const user = await requireContributor("/rally-events/new");

  if (!user) {
    redirect("/pending-approval");
  }

  let eventId: number;

  try {
    const values = validateRallyEventInput(getFormInput(formData), user);
    const event = await createRallyEvent({ currentUser: user, values });
    eventId = event.id;
  } catch (error) {
    const message =
      error instanceof RallyEventValidationError
        ? error.message
        : "The rally event could not be created.";

    redirect(getErrorHref(message));
  }

  redirect(`/rally-events/${eventId}`);
}
