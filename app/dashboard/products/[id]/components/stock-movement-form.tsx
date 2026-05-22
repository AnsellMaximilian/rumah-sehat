"use client";

import { useActionState } from "react";
import FormActionAlert from "@/components/alerts/form-action-alert";
import FormError from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  STOCK_MOVEMENT_TYPES,
} from "@/modules/stock-movements/stock-movement.types";
import {
  createStockMovementAction,
  type StockMovementState,
} from "../../actions";

function getDateTimeLocalValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

  return now.toISOString().slice(0, 16);
}

const ADJUSTMENT_TYPES = STOCK_MOVEMENT_TYPES.filter(
  (type) => !["purchase_in", "delivery_out", "delivery_correction"].includes(type),
);

export default function StockMovementForm({ productId }: { productId: string }) {
  const initialState: StockMovementState = {
    errors: {},
    message: "",
    values: {
      productId,
      quantityDelta: "",
      movementType: "manual_adjustment",
      occurredAt: getDateTimeLocalValue(),
      notes: "",
    },
  };
  const action = createStockMovementAction.bind(null, productId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert
          message={state.message}
          title={state.message === "Stock movement added" ? "Stock updated" : "Unable to add stock movement"}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="movementType" className="mb-2 block text-sm font-medium">
            Movement Type
          </label>
          <select
            id="movementType"
            name="movementType"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.movementType}
            aria-describedby="movementType-error"
          >
            {ADJUSTMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <FormError
            errorField={state.errors?.movementType?.errors}
            errorId="movementType-error"
          />
        </div>

        <div>
          <label htmlFor="quantityDelta" className="mb-2 block text-sm font-medium">
            Quantity Delta
          </label>
          <Input
            id="quantityDelta"
            name="quantityDelta"
            type="number"
            step="any"
            defaultValue={state.values.quantityDelta}
            aria-describedby="quantityDelta-error quantityDelta-help"
            placeholder="20 or -6"
          />
          <p id="quantityDelta-help" className="mt-1 text-xs text-muted-foreground">
            Positive adds stock. Negative reduces stock.
          </p>
          <FormError
            errorField={state.errors?.quantityDelta?.errors}
            errorId="quantityDelta-error"
          />
        </div>

        <div>
          <label htmlFor="occurredAt" className="mb-2 block text-sm font-medium">
            Occurred At
          </label>
          <Input
            id="occurredAt"
            name="occurredAt"
            type="datetime-local"
            defaultValue={state.values.occurredAt}
            aria-describedby="occurredAt-error"
          />
          <FormError
            errorField={state.errors?.occurredAt?.errors}
            errorId="occurredAt-error"
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
            placeholder="Opening count, damaged goods, personal draw, count correction..."
          />
          <FormError errorField={state.errors?.notes?.errors} errorId="notes-error" />
        </div>
      </div>

      <Button disabled={pending} type="submit">
        {pending ? "Adding..." : "Add Stock Movement"}
      </Button>
    </form>
  );
}
