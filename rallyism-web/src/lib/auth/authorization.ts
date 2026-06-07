import { redirect } from "next/navigation";

import {
  canUserContribute,
  isAdminUser,
  isApprovedRegularUser,
} from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import type { AuthUser } from "@/services/users";

export function isAdmin(user: AuthUser | null) {
  return isAdminUser(user);
}

export function isApprovedUser(user: AuthUser | null) {
  return isApprovedRegularUser(user);
}

export function canContribute(user: AuthUser | null) {
  return canUserContribute(user);
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
