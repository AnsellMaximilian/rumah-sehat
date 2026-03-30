import { redirect } from "next/navigation";
import AuthShell from "@/app/(auth)/components/auth-shell";
import SignUpForm from "@/app/(auth)/signup/components/sign-up-form";
import { getAuthSessionService } from "@/modules/auth/auth.service";

export default async function Page() {
  const session = await getAuthSessionService();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="Create Account"
      description="Set up your Rumah Sehat account to access the dashboard."
      altActionLabel="Already have an account?"
      altActionHref="/signin"
      altActionText="Sign in"
    >
      <SignUpForm />
    </AuthShell>
  );
}
