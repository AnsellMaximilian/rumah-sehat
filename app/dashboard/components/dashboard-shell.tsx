"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/dashboard/components/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function DashboardShell() {
  return (
    <TooltipProvider>
      <SidebarProvider className="w-auto shrink-0">
        <div className="fixed top-4 left-4 z-40 md:hidden">
          <SidebarTrigger />
        </div>
        <AppSidebar />
      </SidebarProvider>
    </TooltipProvider>
  );
}
