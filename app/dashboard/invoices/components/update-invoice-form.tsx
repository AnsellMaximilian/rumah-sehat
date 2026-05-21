"use client";

import { useActionState } from "react";
import Link from "next/link";
import FormActionAlert from "@/components/alerts/form-action-alert";
import FormError from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  updateInvoiceAction,
  InvoiceUpdateState,
} from "@/app/dashboard/invoices/actions";
import {
  INVOICE_STATUSES,
  INVOICE_SYNC_STATUSES,
  InvoiceDetail,
} from "@/modules/invoices/invoice.types";

const STATUS_LABELS: Record<(typeof INVOICE_STATUSES)[number], string> = {
  draft: "Draft",
  issued: "Issued",
  paid: "Paid",
  void: "Void",
};

const SYNC_STATUS_LABELS: Record<(typeof INVOICE_SYNC_STATUSES)[number], string> = {
  current: "Current",
  needs_review: "Needs Review",
};

export default function UpdateInvoiceForm({
  invoice,
}: {
  invoice: InvoiceDetail;
}) {
  const initialState: InvoiceUpdateState = {
    errors: {},
    message: "",
    values: {
      invoiceNumber: invoice.invoiceNumber ?? "",
      invoiceDate: invoice.invoiceDate,
      status: invoice.status,
      syncStatus: invoice.syncStatus,
      notes: invoice.notes ?? "",
    },
  };

  const [state, formAction, pending] = useActionState(
    updateInvoiceAction.bind(null, invoice.id),
    initialState,
  );

  return (
    <form action={formAction}>
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert message={state.message} title="Unable to update invoice" />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="invoiceNumber" className="mb-2 block text-sm font-medium">
            Invoice Number <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="invoiceNumber"
            name="invoiceNumber"
            defaultValue={state.values.invoiceNumber}
            aria-describedby="invoiceNumber-error"
          />
          <FormError
            errorField={state.errors?.invoiceNumber?.errors}
            errorId="invoiceNumber-error"
          />
        </div>

        <div>
          <label htmlFor="invoiceDate" className="mb-2 block text-sm font-medium">
            Invoice Date
          </label>
          <Input
            id="invoiceDate"
            name="invoiceDate"
            type="date"
            defaultValue={state.values.invoiceDate}
            aria-describedby="invoiceDate-error"
          />
          <FormError
            errorField={state.errors?.invoiceDate?.errors}
            errorId="invoiceDate-error"
          />
        </div>

        <div>
          <label htmlFor="status" className="mb-2 block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.status}
            aria-describedby="status-error"
          >
            {INVOICE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <FormError errorField={state.errors?.status?.errors} errorId="status-error" />
        </div>

        <div>
          <label htmlFor="syncStatus" className="mb-2 block text-sm font-medium">
            Sync Status
          </label>
          <select
            id="syncStatus"
            name="syncStatus"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.syncStatus}
            aria-describedby="syncStatus-error"
          >
            {INVOICE_SYNC_STATUSES.map((syncStatus) => (
              <option key={syncStatus} value={syncStatus}>
                {SYNC_STATUS_LABELS[syncStatus]}
              </option>
            ))}
          </select>
          <FormError
            errorField={state.errors?.syncStatus?.errors}
            errorId="syncStatus-error"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="notes" className="mb-2 block text-sm font-medium">
            Notes <span className="text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={state.values.notes}
            aria-describedby="notes-error"
          />
          <FormError errorField={state.errors?.notes?.errors} errorId="notes-error" />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/invoices"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          Update Invoice
        </Button>
      </div>
    </form>
  );
}
