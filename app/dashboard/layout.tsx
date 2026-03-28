import { DashboardShell } from "@/app/dashboard/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh bg-background">
      <DashboardShell />
      <main className="min-w-0 flex-1 p-4">{children}</main>
    </div>
  );
}
