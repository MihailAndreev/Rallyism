import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import type { AuthUser } from "@/services/users";

export function isAdmin(user: AuthUser | null) {
  return user?.role === "admin";
}

export function isApprovedUser(user: AuthUser | null) {
  return user?.approvalStatus === "approved";
}

export function canContribute(user: AuthUser | null) {
  return isAdmin(user) || isApprovedUser(user);
}

export async function requireAdmin(from = "/admin/users") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?from=${encodeURIComponent(from)}`);
  }

  return isAdmin(user) ? user : null;
}
