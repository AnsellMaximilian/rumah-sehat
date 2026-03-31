import { DashboardShell } from "@/app/dashboard/components/dashboard-shell";
import { getAuthSessionService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSessionService();

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="flex min-h-svh bg-background">
      <DashboardShell userName={session.user.name} />
      <main className="min-w-0 flex-1 p-4">{children}</main>
    </div>
  );
}
