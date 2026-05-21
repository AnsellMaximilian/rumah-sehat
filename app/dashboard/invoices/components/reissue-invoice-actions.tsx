"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { voidAndReissueInvoiceAction } from "@/app/dashboard/invoices/actions";

export default function ReissueInvoiceActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleVoidAndReissue() {
    startTransition(async () => {
      const result = await voidAndReissueInvoiceAction(id);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      if (result.replacementInvoiceId) {
        router.push(`/dashboard/invoices/${result.replacementInvoiceId}`);
        return;
      }

      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleVoidAndReissue}
      disabled={pending}
    >
      {pending ? "Voiding..." : "Void And Reissue"}
    </Button>
  );
}
