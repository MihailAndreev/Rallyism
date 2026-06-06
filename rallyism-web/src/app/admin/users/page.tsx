import Link from "next/link";
import type { ReactNode } from "react";

import {
  approveUserAction,
  changeUserRoleAction,
  rejectUserAction,
} from "@/app/admin/users/actions";
import { formatDateTime } from "@/components/rally-events/rally-event-format";
import { requireAdmin } from "@/lib/auth/authorization";
import {
  getAdminUsersPage,
  type AdminUserListItem,
  type UserApprovalStatusFilter,
} from "@/services/users";

type AdminUsersPageProps = {
  searchParams?: Promise<{
    page?: string;
    status?: string;
    message?: string;
    messageType?: string;
  }>;
};

const statusFilters: { value: UserApprovalStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function parseStatus(value: string | undefined): UserApprovalStatusFilter {
  if (value === "pending" || value === "approved" || value === "rejected") {
    return value;
  }

  return "all";
}

function parsePage(value: string | undefined) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getAdminUsersHref(input: {
  status: UserApprovalStatusFilter;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (input.status !== "all") {
    params.set("status", input.status);
  }

  if (input.page && input.page > 1) {
    params.set("page", String(input.page));
  }

  const query = params.toString();

  return `/admin/users${query ? `?${query}` : ""}`;
}

function StatusBadge({ status }: { status: AdminUserListItem["approvalStatus"] }) {
  const classes = {
    pending: "border-amber-200 bg-amber-50 text-amber-800",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: "border-zinc-200 bg-zinc-50 text-zinc-600",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold capitalize ${classes[status]}`}
    >
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: AdminUserListItem["role"] }) {
  return (
    <span className="inline-flex rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold capitalize text-zinc-700">
      {role}
    </span>
  );
}

function ActionButton({
  children,
  variant = "secondary",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
}) {
  const classes = {
    primary: "border-red-600 bg-red-600 text-white hover:bg-red-700",
    secondary: "border-zinc-300 bg-white text-zinc-900 hover:border-zinc-400 hover:bg-zinc-100",
    danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <button
      type="submit"
      className={`inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-semibold shadow-sm transition ${classes[variant]}`}
    >
      {children}
    </button>
  );
}

function UserActionForm({
  action,
  userId,
  returnTo,
  children,
  role,
}: {
  action: (formData: FormData) => void | Promise<void>;
  userId: number;
  returnTo: string;
  children: ReactNode;
  role?: "user" | "admin";
}) {
  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {role ? <input type="hidden" name="role" value={role} /> : null}
      {children}
    </form>
  );
}

function UserActions({
  user,
  adminUserId,
  returnTo,
}: {
  user: AdminUserListItem;
  adminUserId: number;
  returnTo: string;
}) {
  const isSelf = user.id === adminUserId;

  return (
    <div className="flex flex-wrap gap-2">
      {user.approvalStatus !== "approved" ? (
        <UserActionForm
          action={approveUserAction}
          userId={user.id}
          returnTo={returnTo}
        >
          <ActionButton variant="primary">Approve</ActionButton>
        </UserActionForm>
      ) : null}
      {user.approvalStatus === "pending" ? (
        <UserActionForm
          action={rejectUserAction}
          userId={user.id}
          returnTo={returnTo}
        >
          <ActionButton variant="danger">Reject</ActionButton>
        </UserActionForm>
      ) : null}
      {user.role === "admin" ? (
        <UserActionForm
          action={changeUserRoleAction}
          userId={user.id}
          returnTo={returnTo}
          role="user"
        >
          <ActionButton>Make regular</ActionButton>
        </UserActionForm>
      ) : (
        <UserActionForm
          action={changeUserRoleAction}
          userId={user.id}
          returnTo={returnTo}
          role="admin"
        >
          <ActionButton>Make admin</ActionButton>
        </UserActionForm>
      )}
      {isSelf ? (
        <span className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-500">
          Current user
        </span>
      ) : null}
    </div>
  );
}

function AdminAccessDenied() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-red-700">
          Admin access required
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-zinc-950">
          You do not have access to user management.
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          Admin pages are only available to Rallyism admin users.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
        >
          Back to Dashboard
        </Link>
      </section>
    </div>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const resolvedSearchParams = await searchParams;
  const admin = await requireAdmin("/admin/users");

  if (!admin) {
    return <AdminAccessDenied />;
  }

  const status = parseStatus(resolvedSearchParams?.status);
  const page = parsePage(resolvedSearchParams?.page);
  const usersPage = await getAdminUsersPage({ status, page, pageSize: 12 });
  const returnTo = getAdminUsersHref({
    status: usersPage.status,
    page: usersPage.currentPage,
  });
  const message = resolvedSearchParams?.message;
  const messageType =
    resolvedSearchParams?.messageType === "success" ? "success" : "error";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex text-sm font-semibold text-red-700 hover:text-red-800"
        >
          Back to Dashboard
        </Link>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-red-700">
              Admin
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
              User approvals
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
              Review new registrations, approve access and adjust basic roles.
            </p>
          </div>
          <p className="text-sm text-zinc-500">
            Signed in as {admin.name || admin.email}
          </p>
        </div>
      </section>

      {message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${
            messageType === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      <section className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal text-zinc-950">
              Users
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Page {usersPage.currentPage} of {usersPage.totalPages}
            </p>
          </div>
          <nav
            aria-label="Approval status filters"
            className="inline-flex w-full rounded-md border border-zinc-200 bg-white p-1 sm:w-auto"
          >
            {statusFilters.map((option) => (
              <Link
                key={option.value}
                href={getAdminUsersHref({ status: option.value })}
                className={`flex-1 rounded px-3 py-1.5 text-center text-sm font-semibold transition sm:flex-none ${
                  usersPage.status === option.value
                    ? "bg-red-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </nav>
        </div>

        {usersPage.users.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[minmax(0,1.3fr)_120px_140px_170px_minmax(260px,1fr)] gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase text-zinc-500 lg:grid">
              <div>User</div>
              <div>Role</div>
              <div>Status</div>
              <div>Created</div>
              <div>Actions</div>
            </div>
            <div className="divide-y divide-zinc-200">
              {usersPage.users.map((user) => (
                <article
                  key={user.id}
                  className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.3fr)_120px_140px_170px_minmax(260px,1fr)] lg:items-center"
                >
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-semibold text-zinc-950">
                      {user.name}
                    </h3>
                    <p className="mt-1 break-words text-sm text-zinc-500">
                      {user.email}
                    </p>
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase text-zinc-500 lg:hidden">
                      Role
                    </span>
                    <RoleBadge role={user.role} />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase text-zinc-500 lg:hidden">
                      Status
                    </span>
                    <StatusBadge status={user.approvalStatus} />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase text-zinc-500 lg:hidden">
                      Created
                    </span>
                    <p className="text-sm text-zinc-600">
                      {formatDateTime(user.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="mb-2 block text-xs font-semibold uppercase text-zinc-500 lg:hidden">
                      Actions
                    </span>
                    <UserActions
                      user={user}
                      adminUserId={admin.id}
                      returnTo={returnTo}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-5 py-10 text-center">
            <h2 className="text-lg font-semibold text-zinc-950">
              No users in this filter.
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Try another approval status to continue reviewing accounts.
            </p>
          </div>
        )}
      </section>

      {usersPage.totalUsers > 0 ? (
        <nav
          aria-label="User pagination"
          className="flex items-center justify-between border-t border-zinc-200 pt-6"
        >
          {usersPage.hasPreviousPage ? (
            <Link
              href={getAdminUsersHref({
                status: usersPage.status,
                page: usersPage.currentPage - 1,
              })}
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
            >
              Previous
            </Link>
          ) : (
            <span className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-400">
              Previous
            </span>
          )}
          <p className="text-sm text-zinc-500">
            {usersPage.totalUsers} user{usersPage.totalUsers === 1 ? "" : "s"}
          </p>
          {usersPage.hasNextPage ? (
            <Link
              href={getAdminUsersHref({
                status: usersPage.status,
                page: usersPage.currentPage + 1,
              })}
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
            >
              Next
            </Link>
          ) : (
            <span className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-400">
              Next
            </span>
          )}
        </nav>
      ) : null}
    </div>
  );
}
