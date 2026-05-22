"use client";

import { useActionState } from "react";
import FormActionAlert from "@/components/alerts/form-action-alert";
import FormError from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createManualInvoiceItemAction,
  type ManualInvoiceItemState,
} from "../actions";

export default function ManualInvoiceItemForm({ invoiceId }: { invoiceId: string }) {
  const initialState: ManualInvoiceItemState = {
    errors: {},
    message: "",
    values: {
      invoiceId,
      lineType: "adjustment",
      description: "",
      quantity: "",
      unitPrice: "",
      amount: "",
    },
  };
  const action = createManualInvoiceItemAction.bind(null, invoiceId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert
          message={state.message}
          title={state.message === "Invoice item added" ? "Invoice updated" : "Unable to add invoice item"}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="lineType" className="mb-2 block text-sm font-medium">
            Line Type
          </label>
          <select
            id="lineType"
            name="lineType"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.lineType}
            aria-describedby="lineType-error"
          >
            <option value="adjustment">Adjustment</option>
            <option value="misc_charge">Misc Charge</option>
          </select>
          <FormError errorField={state.errors?.lineType?.errors} errorId="lineType-error" />
        </div>

        <div>
          <label htmlFor="amount" className="mb-2 block text-sm font-medium">
            Amount
          </label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="1"
            defaultValue={state.values.amount}
            aria-describedby="amount-error amount-help"
            placeholder="25000 or -10000"
          />
          <p id="amount-help" className="mt-1 text-xs text-muted-foreground">
            Use negative amounts for credits/discount corrections.
          </p>
          <FormError errorField={state.errors?.amount?.errors} errorId="amount-error" />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className="mb-2 block text-sm font-medium">
            Description
          </label>
          <Input
            id="description"
            name="description"
            defaultValue={state.values.description}
            aria-describedby="description-error"
            placeholder="Correction, discount, forgotten charge..."
          />
          <FormError
            errorField={state.errors?.description?.errors}
            errorId="description-error"
          />
        </div>

        <div>
          <label htmlFor="quantity" className="mb-2 block text-sm font-medium">
            Quantity <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            step="1"
            defaultValue={state.values.quantity}
            aria-describedby="quantity-error"
          />
          <FormError errorField={state.errors?.quantity?.errors} errorId="quantity-error" />
        </div>

        <div>
          <label htmlFor="unitPrice" className="mb-2 block text-sm font-medium">
            Unit Price <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="unitPrice"
            name="unitPrice"
            type="number"
            step="1"
            defaultValue={state.values.unitPrice}
            aria-describedby="unitPrice-error"
          />
          <FormError errorField={state.errors?.unitPrice?.errors} errorId="unitPrice-error" />
        </div>
      </div>

      <Button disabled={pending} type="submit">
        {pending ? "Adding..." : "Add Invoice Item"}
      </Button>
    </form>
  );
}
