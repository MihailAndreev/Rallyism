import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import type { AuthUser } from "@/services/users";

export function isAdmin(user: AuthUser | null) {
  return user?.role === "admin" && !user.disabledAt;
}

export function isApprovedUser(user: AuthUser | null) {
  return user?.approvalStatus === "approved" && !user.disabledAt;
}

export function canContribute(user: AuthUser | null) {
  return isAdmin(user) || isApprovedUser(user);
}

export async function requireContributor(from = "/dashboard") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?from=${encodeURIComponent(from)}`);
  }

  return canContribute(user) ? user : null;
}

export async function requireAdmin(from = "/admin/users") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?from=${encodeURIComponent(from)}`);
  }

  return isAdmin(user) ? user : null;
}
