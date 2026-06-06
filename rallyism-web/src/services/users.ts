import { and, desc, eq, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  photoUrl: string | null;
  role: "user" | "admin";
  approvalStatus: "pending" | "approved" | "rejected";
};

export type UserWithPassword = AuthUser & {
  passwordHash: string;
};

export type UserApprovalStatusFilter =
  | "all"
  | "pending"
  | "approved"
  | "rejected";

export type AdminUserListItem = AuthUser & {
  createdAt: Date;
  updatedAt: Date;
};

export type AdminUsersPage = {
  users: AdminUserListItem[];
  status: UserApprovalStatusFilter;
  currentPage: number;
  pageSize: number;
  totalUsers: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export class UserManagementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserManagementError";
  }
}

export async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return user ?? null;
}

export async function findUserById(id: number): Promise<AuthUser | null> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      photoUrl: users.photoUrl,
      role: users.role,
      approvalStatus: users.approvalStatus,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user ?? null;
}

export async function findUserWithPasswordByEmail(
  email: string,
): Promise<UserWithPassword | null> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      photoUrl: users.photoUrl,
      role: users.role,
      approvalStatus: users.approvalStatus,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return user ?? null;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const passwordHash = await hashPassword(input.password);

  const [user] = await db
    .insert(users)
    .values({
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      passwordHash,
      role: "user",
      approvalStatus: "pending",
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      photoUrl: users.photoUrl,
      role: users.role,
      approvalStatus: users.approvalStatus,
    });

  return user;
}

function getAdminUsersWhereClause(status: UserApprovalStatusFilter) {
  if (status === "all") {
    return undefined;
  }

  return eq(users.approvalStatus, status);
}

async function getAdminCountExcluding(userId: number) {
  const [row] = await db
    .select({
      adminCount: sql<number>`count(${users.id})::int`,
    })
    .from(users)
    .where(and(eq(users.role, "admin"), ne(users.id, userId)));

  return row?.adminCount ?? 0;
}

export async function getAdminUsersPage(input: {
  status?: UserApprovalStatusFilter;
  page?: number;
  pageSize?: number;
} = {}): Promise<AdminUsersPage> {
  const status = input.status ?? "all";
  const pageSize = input.pageSize ?? 12;
  const requestedPage =
    input.page && Number.isInteger(input.page) && input.page > 0 ? input.page : 1;
  const whereClause = getAdminUsersWhereClause(status);
  const countQuery = db
    .select({
      totalUsers: sql<number>`count(${users.id})::int`,
    })
    .from(users)
    .$dynamic();

  if (whereClause) {
    countQuery.where(whereClause);
  }

  const [{ totalUsers }] = await countQuery;
  const totalPages = Math.max(1, Math.ceil((totalUsers ?? 0) / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * pageSize;
  const usersQuery = db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      photoUrl: users.photoUrl,
      role: users.role,
      approvalStatus: users.approvalStatus,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt), desc(users.id))
    .limit(pageSize)
    .offset(offset)
    .$dynamic();

  if (whereClause) {
    usersQuery.where(whereClause);
  }

  return {
    users: await usersQuery,
    status,
    currentPage,
    pageSize,
    totalUsers: totalUsers ?? 0,
    totalPages,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
}

export async function approveUser(userId: number) {
  await db
    .update(users)
    .set({ approvalStatus: "approved", updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function rejectUser(input: { targetUserId: number; actorUserId: number }) {
  if (input.targetUserId === input.actorUserId) {
    throw new UserManagementError("You cannot reject your own account.");
  }

  await db
    .update(users)
    .set({ approvalStatus: "rejected", updatedAt: new Date() })
    .where(eq(users.id, input.targetUserId));
}

export async function changeUserRole(input: {
  targetUserId: number;
  actorUserId: number;
  role: "user" | "admin";
}) {
  if (input.targetUserId === input.actorUserId && input.role !== "admin") {
    throw new UserManagementError("You cannot remove admin rights from yourself.");
  }

  if (input.role === "user") {
    const remainingAdmins = await getAdminCountExcluding(input.targetUserId);

    if (remainingAdmins === 0) {
      throw new UserManagementError("At least one admin account must remain.");
    }
  }

  await db
    .update(users)
    .set({ role: input.role, updatedAt: new Date() })
    .where(eq(users.id, input.targetUserId));
}
