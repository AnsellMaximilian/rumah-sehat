"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { regenerateDraftInvoiceAction } from "@/app/dashboard/invoices/actions";

export default function DraftInvoiceActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRegenerate() {
    startTransition(async () => {
      const result = await regenerateDraftInvoiceAction(id);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="outline" onClick={handleRegenerate} disabled={pending}>
      {pending ? "Regenerating..." : "Regenerate Draft"}
    </Button>
  );
}
