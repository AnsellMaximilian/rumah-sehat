"use client";

import { useActionState } from "react";
import Link from "next/link";
import FormActionAlert from "@/components/alerts/form-action-alert";
import FormError from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createInvoiceAction,
  InvoiceGenerateState,
} from "@/app/dashboard/invoices/actions";
import { InvoicePreview } from "@/modules/invoices/invoice.types";

export default function CreateDraftForm({
  preview,
  values,
}: {
  preview: InvoicePreview;
  values: {
    customerId: string;
    invoiceDate: string;
    periodEnd: string;
    periodStart: string;
  };
}) {
  const initialState: InvoiceGenerateState = {
    errors: {},
    message: "",
    values: {
      customerId: values.customerId,
      periodStart: values.periodStart,
      periodEnd: values.periodEnd,
      invoiceDate: values.invoiceDate,
      invoiceNumber: "",
      notes: "",
    },
  };
  const [state, formAction, pending] = useActionState(
    createInvoiceAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert message={state.message} title="Unable to create invoice" />
      ) : null}

      <input type="hidden" name="customerId" value={state.values.customerId} />
      <input type="hidden" name="periodStart" value={state.values.periodStart} />
      <input type="hidden" name="periodEnd" value={state.values.periodEnd} />
      <input type="hidden" name="invoiceDate" value={state.values.invoiceDate} />

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
          <label htmlFor="invoiceDateDisplay" className="mb-2 block text-sm font-medium">
            Invoice Date
          </label>
          <Input
            id="invoiceDateDisplay"
            value={state.values.invoiceDate}
            readOnly
            disabled
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

      <div className="rounded-lg border p-4 text-sm">
        <p>
          Draft invoice for {preview.customerCode ? `${preview.customerCode} - ` : ""}
          {preview.customerName} covering {preview.periodStart} to {preview.periodEnd}.
        </p>
        <p className="mt-1 text-muted-foreground">
          {preview.salesLines.length} product lines, {preview.deliveryCharges.length}{" "}
          delivery charges, total Rp{" "}
          {new Intl.NumberFormat("id-ID").format(preview.grandTotal)}.
        </p>
      </div>

      <div className="flex justify-end gap-4">
        <Link
          href="/dashboard/invoices"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending || !preview.canGenerate}>
          Create Draft Invoice
        </Button>
      </div>
    </form>
  );
}
