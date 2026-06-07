import Link from "next/link";

import { AuthFormShell } from "@/components/auth-form-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getPasswordResetTokenStatus } from "@/services/users";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

function InvalidResetLink() {
  return (
    <div className="space-y-5 text-center">
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        This reset link is invalid or has expired.
      </div>
      <Link
        href="/forgot-password"
        className="inline-flex h-11 items-center justify-center rounded-md bg-rally-blue px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover"
      >
        Create a new reset link
      </Link>
    </div>
  );
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params?.token ?? "";
  const tokenStatus = token
    ? await getPasswordResetTokenStatus(token)
    : ("invalid" as const);

  return (
    <AuthFormShell
      title="Reset password"
      subtitle="Choose a new password for your Rallyism account."
    >
      {tokenStatus === "valid" ? (
        <ResetPasswordForm token={token} />
      ) : (
        <InvalidResetLink />
      )}
    </AuthFormShell>
  );
}
