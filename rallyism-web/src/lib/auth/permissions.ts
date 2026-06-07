type PermissionUser = {
  approvalStatus: "pending" | "approved" | "rejected";
  disabledAt: Date | null;
  role: "user" | "admin";
} | null;

export function isAdminUser(user: PermissionUser) {
  return user?.role === "admin" && !user.disabledAt;
}

export function isApprovedRegularUser(user: PermissionUser) {
  return user?.approvalStatus === "approved" && !user.disabledAt;
}

export function canUserContribute(user: PermissionUser) {
  return isAdminUser(user) || isApprovedRegularUser(user);
}
