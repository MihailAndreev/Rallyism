import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/logout/actions";
import { canContribute } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";

function getStatusCopy(status: "pending" | "approved" | "rejected") {
  if (status === "rejected") {
    return {
      eyebrow: "Account not approved",
      title: "This Rallyism account cannot access contribution tools.",
      description:
        "Your account request was not approved. You can still browse public rally memories without contributor access.",
    };
  }

  return {
    eyebrow: "Approval pending",
    title: "Your Rallyism account is waiting for approval.",
    description:
      "An admin needs to approve your account before you can use the dashboard and future contribution tools.",
  };
}

export default async function PendingApprovalPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?from=/pending-approval");
  }

  if (canContribute(user)) {
    redirect("/dashboard");
  }

  const copy = getStatusCopy(user.approvalStatus);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="w-full rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-red-700">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-zinc-950">
          {copy.title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-600">
          {copy.description}
        </p>
        <p className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          Signed in as {user.name || user.email}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-md bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            Browse Rallyism
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-md border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100 sm:w-auto"
            >
              Logout
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
