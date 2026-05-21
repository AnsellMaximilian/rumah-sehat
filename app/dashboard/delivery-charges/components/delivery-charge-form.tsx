"use client";

import { useActionState } from "react";
import Link from "next/link";
import FormActionAlert from "@/components/alerts/form-action-alert";
import FormError from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createDeliveryChargeAction,
  DeliveryChargeState,
  updateDeliveryChargeAction,
} from "@/app/dashboard/delivery-charges/actions";
import {
  DELIVERY_CHARGE_TYPES,
  DeliveryCharge,
} from "@/modules/delivery-charges/delivery-charge.types";
import { DeliverySelectOption } from "@/modules/deliveries/delivery.types";

const CHARGE_TYPE_LABELS: Record<(typeof DELIVERY_CHARGE_TYPES)[number], string> = {
  courier: "Courier",
  staff_delivery: "Staff Delivery",
  third_party_delivery: "Third Party Delivery",
  packaging: "Packaging",
  misc: "Misc",
  adjustment: "Adjustment",
};

function formatDeliveryOptionLabel(delivery: DeliverySelectOption) {
  const recordedAt = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(delivery.recordedAt));

  const customerLabel = delivery.customerCode
    ? `${delivery.customerCode} - ${delivery.customerName}`
    : delivery.customerName || "Unknown customer";

  return `${customerLabel} | ${recordedAt} | ${delivery.status}`;
}

export default function DeliveryChargeForm({
  deliveryCharge,
  deliveryOptions,
}: {
  deliveryCharge?: DeliveryCharge;
  deliveryOptions: DeliverySelectOption[];
}) {
  const initialState: DeliveryChargeState = {
    errors: {},
    message: "",
    values: deliveryCharge
      ? {
          deliveryId: deliveryCharge.deliveryId,
          chargeType: deliveryCharge.chargeType,
          description: deliveryCharge.description,
          amount: String(deliveryCharge.amount),
          billToCustomer: deliveryCharge.billToCustomer ? "true" : "false",
          notes: deliveryCharge.notes ?? "",
        }
      : {
          deliveryId: "",
          chargeType: "courier",
          description: "",
          amount: "",
          billToCustomer: "true",
          notes: "",
        },
  };

  const action = deliveryCharge
    ? updateDeliveryChargeAction.bind(null, deliveryCharge.id)
    : createDeliveryChargeAction;

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert
          message={state.message}
          title={
            deliveryCharge
              ? "Unable to update delivery charge"
              : "Unable to create delivery charge"
          }
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="deliveryId" className="mb-2 block text-sm font-medium">
            Delivery
          </label>
          <select
            id="deliveryId"
            name="deliveryId"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.deliveryId}
            aria-describedby="deliveryId-error"
          >
            <option value="">Select delivery</option>
            {deliveryOptions.map((delivery) => (
              <option key={delivery.id} value={delivery.id}>
                {formatDeliveryOptionLabel(delivery)}
              </option>
            ))}
          </select>
          <FormError
            errorField={state.errors?.deliveryId?.errors}
            errorId="deliveryId-error"
          />
        </div>

        <div>
          <label htmlFor="chargeType" className="mb-2 block text-sm font-medium">
            Charge Type
          </label>
          <select
            id="chargeType"
            name="chargeType"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.chargeType}
            aria-describedby="chargeType-error"
          >
            {DELIVERY_CHARGE_TYPES.map((chargeType) => (
              <option key={chargeType} value={chargeType}>
                {CHARGE_TYPE_LABELS[chargeType]}
              </option>
            ))}
          </select>
          <FormError
            errorField={state.errors?.chargeType?.errors}
            errorId="chargeType-error"
          />
        </div>

        <div>
          <label htmlFor="billToCustomer" className="mb-2 block text-sm font-medium">
            Bill To Customer
          </label>
          <select
            id="billToCustomer"
            name="billToCustomer"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.billToCustomer}
            aria-describedby="billToCustomer-error"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
          <FormError
            errorField={state.errors?.billToCustomer?.errors}
            errorId="billToCustomer-error"
          />
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
            placeholder="JNE fee, Siti delivery fee, box, ice pack..."
          />
          <FormError
            errorField={state.errors?.description?.errors}
            errorId="description-error"
          />
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
            inputMode="numeric"
            defaultValue={state.values.amount}
            aria-describedby="amount-error amount-help"
            placeholder="25000"
          />
          <p id="amount-help" className="mt-1 text-xs text-muted-foreground">
            Whole rupiah amount only. Negative is allowed only for adjustment.
          </p>
          <FormError
            errorField={state.errors?.amount?.errors}
            errorId="amount-error"
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
          <FormError
            errorField={state.errors?.notes?.errors}
            errorId="notes-error"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/delivery-charges"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {deliveryCharge ? "Update Delivery Charge" : "Create Delivery Charge"}
        </Button>
      </div>
    </form>
  );
}
