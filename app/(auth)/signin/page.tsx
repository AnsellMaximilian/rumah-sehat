import { redirect } from "next/navigation";
import AuthShell from "@/app/(auth)/components/auth-shell";
import SignInForm from "@/app/(auth)/signin/components/sign-in-form";
import { getAuthSessionService } from "@/modules/auth/auth.service";

export default async function Page() {
  const session = await getAuthSessionService();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="Sign In"
      description="Use your Rumah Sehat account to continue."
      altActionLabel="Don't have an account?"
      altActionHref="/signup"
      altActionText="Create one"
    >
      <SignInForm />
    </AuthShell>
  );
}
