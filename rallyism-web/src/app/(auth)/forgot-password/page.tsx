import { AuthFormShell } from "@/components/auth-form-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthFormShell
      title="Forgot password"
      subtitle="Create a secure reset link for your Rallyism account."
    >
      <ForgotPasswordForm />
    </AuthFormShell>
  );
}
