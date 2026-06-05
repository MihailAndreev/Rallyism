import { AuthFormShell } from "@/components/auth-form-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getSafeRedirectPath } from "@/lib/validation/auth";

type LoginPageProps = {
  searchParams: Promise<{
    from?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const from = getSafeRedirectPath(params.from ?? null);

  return (
    <AuthFormShell
      title="Login"
      subtitle="Open your rally memories space and continue to your dashboard."
    >
      <LoginForm from={from} />
    </AuthFormShell>
  );
}
