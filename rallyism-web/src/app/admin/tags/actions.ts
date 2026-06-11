"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/authorization";
import {
  deleteTag,
  TagManagementError,
  updateTag,
} from "@/services/rally-events";

function parseTagId(value: FormDataEntryValue | null) {
  const tagId = Number(value);

  return Number.isInteger(tagId) && tagId > 0 ? tagId : null;
}

function getReturnPath(message: string, type: "success" | "error") {
  const params = new URLSearchParams();

  params.set("message", message);
  params.set("messageType", type);

  return `/admin/tags?${params.toString()}`;
}

async function runAdminTagMutation(
  mutation: () => Promise<void>,
  successMessage: string,
) {
  const admin = await requireAdmin("/admin/tags");

  if (!admin) {
    redirect("/dashboard");
  }

  try {
    await mutation();
  } catch (error) {
    const message =
      error instanceof TagManagementError
        ? error.message
        : "The tag action could not be completed.";

    redirect(getReturnPath(message, "error"));
  }

  revalidatePath("/admin/tags");
  revalidatePath("/tags");
  redirect(getReturnPath(successMessage, "success"));
}

export async function updateTagAction(formData: FormData) {
  const tagId = parseTagId(formData.get("tagId"));
  const name = String(formData.get("name") ?? "");

  if (!tagId) {
    redirect(getReturnPath("Invalid tag selected.", "error"));
  }

  await runAdminTagMutation(
    () => updateTag({ tagId, name }),
    "Tag updated.",
  );
}

export async function deleteTagAction(formData: FormData) {
  const tagId = parseTagId(formData.get("tagId"));

  if (!tagId) {
    redirect(getReturnPath("Invalid tag selected.", "error"));
  }

  await runAdminTagMutation(() => deleteTag(tagId), "Tag deleted.");
}
