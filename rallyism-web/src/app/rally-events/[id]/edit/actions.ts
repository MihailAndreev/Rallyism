"use server";

import { redirect } from "next/navigation";

import { requireContributor } from "@/lib/auth/authorization";
import {
  RallyEventValidationError,
  updateRallyEvent,
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

function getEventId(formData: FormData) {
  const eventId = Number(formData.get("eventId"));

  return Number.isInteger(eventId) && eventId > 0 ? eventId : null;
}

function getErrorHref(eventId: number, message: string) {
  const params = new URLSearchParams({ error: message });

  return `/rally-events/${eventId}/edit?${params.toString()}`;
}

export async function updateRallyEventAction(formData: FormData) {
  const user = await requireContributor("/dashboard");

  if (!user) {
    redirect("/pending-approval");
  }

  const eventId = getEventId(formData);

  if (!eventId) {
    redirect("/dashboard");
  }

  let result:
    | { status: "allowed" | "not-found" | "access-denied" }
    | null = null;

  try {
    const values = validateRallyEventInput(getFormInput(formData), user);
    result = await updateRallyEvent({
      id: eventId,
      currentUser: user,
      values,
    });
  } catch (error) {
    const message =
      error instanceof RallyEventValidationError
        ? error.message
        : "The rally event could not be updated.";

    redirect(getErrorHref(eventId, message));
  }

  if (result?.status === "not-found") {
    redirect("/dashboard");
  }

  if (result?.status === "access-denied") {
    redirect(
      `/rally-events/${eventId}/edit?error=You%20cannot%20edit%20this%20rally%20event.`,
    );
  }

  redirect(`/rally-events/${eventId}`);
}
