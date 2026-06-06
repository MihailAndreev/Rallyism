"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/authorization";
import {
  approveUser,
  changeUserRole,
  rejectUser,
  UserManagementError,
} from "@/services/users";

function parseUserId(value: FormDataEntryValue | null) {
  const userId = Number(value);

  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

function getReturnPath(formData: FormData, message: string, type: "success" | "error") {
  const rawReturnTo = String(formData.get("returnTo") ?? "/admin/users");
  const returnTo =
    rawReturnTo.startsWith("/admin/users") && !rawReturnTo.startsWith("//")
      ? rawReturnTo
      : "/admin/users";
  const [pathname, query = ""] = returnTo.split("?");
  const params = new URLSearchParams(query);

  params.set("message", message);
  params.set("messageType", type);

  const nextQuery = params.toString();

  return `${pathname}${nextQuery ? `?${nextQuery}` : ""}`;
}

async function runAdminMutation(
  formData: FormData,
  mutation: (adminUserId: number) => Promise<void>,
  successMessage: string,
) {
  const admin = await requireAdmin("/admin/users");

  if (!admin) {
    redirect("/dashboard");
  }

  try {
    await mutation(admin.id);
  } catch (error) {
    const message =
      error instanceof UserManagementError
        ? error.message
        : "The user action could not be completed.";

    redirect(getReturnPath(formData, message, "error"));
  }

  revalidatePath("/admin/users");
  redirect(getReturnPath(formData, successMessage, "success"));
}

export async function approveUserAction(formData: FormData) {
  const userId = parseUserId(formData.get("userId"));

  if (!userId) {
    redirect(getReturnPath(formData, "Invalid user selected.", "error"));
  }

  await runAdminMutation(
    formData,
    async () => approveUser(userId),
    "User approved.",
  );
}

export async function rejectUserAction(formData: FormData) {
  const userId = parseUserId(formData.get("userId"));

  if (!userId) {
    redirect(getReturnPath(formData, "Invalid user selected.", "error"));
  }

  await runAdminMutation(
    formData,
    async (adminUserId) =>
      rejectUser({ targetUserId: userId, actorUserId: adminUserId }),
    "User rejected.",
  );
}

export async function changeUserRoleAction(formData: FormData) {
  const userId = parseUserId(formData.get("userId"));
  const role = formData.get("role");

  if (!userId || (role !== "user" && role !== "admin")) {
    redirect(getReturnPath(formData, "Invalid role change selected.", "error"));
  }

  await runAdminMutation(
    formData,
    async (adminUserId) =>
      changeUserRole({
        targetUserId: userId,
        actorUserId: adminUserId,
        role,
      }),
    role === "admin" ? "User is now an admin." : "User is now a regular user.",
  );
}
