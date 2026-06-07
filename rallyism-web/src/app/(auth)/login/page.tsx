import { AuthFormShell } from "@/components/auth-form-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getSafeRedirectPath } from "@/lib/validation/auth";

type LoginPageProps = {
  searchParams: Promise<{
    from?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const from = getSafeRedirectPath(params.from ?? null);
  const message = params.message?.slice(0, 160) ?? "";

  return (
    <AuthFormShell
      title="Login"
      subtitle="Open your rally memories space and continue to your dashboard."
    >
      <LoginForm from={from} message={message} />
    </AuthFormShell>
  );
}
