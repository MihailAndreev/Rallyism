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
