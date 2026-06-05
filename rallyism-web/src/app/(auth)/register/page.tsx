import { AuthFormShell } from "@/components/auth-form-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthFormShell
      title="Register"
      subtitle="Create your Rallyism profile and start preparing your future rally gallery."
    >
      <RegisterForm />
    </AuthFormShell>
  );
}
