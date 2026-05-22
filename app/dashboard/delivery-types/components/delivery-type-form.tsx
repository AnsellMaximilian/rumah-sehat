"use client";

import { useActionState } from "react";
import Link from "next/link";
import FormActionAlert from "@/components/alerts/form-action-alert";
import FormError from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AccountSelectOption } from "@/modules/accounts/account.types";
import { DELIVERY_CHARGE_TYPES } from "@/modules/delivery-charges/delivery-charge.types";
import { DeliveryType } from "@/modules/delivery-types/delivery-type.types";
import {
  createDeliveryTypeAction,
  DeliveryTypeState,
  updateDeliveryTypeAction,
} from "../actions";

const CHARGE_TYPE_LABELS: Record<(typeof DELIVERY_CHARGE_TYPES)[number], string> = {
  courier: "Courier",
  staff_delivery: "Staff Delivery",
  third_party_delivery: "Third Party Delivery",
  packaging: "Packaging",
  misc: "Misc",
  adjustment: "Adjustment",
};

export default function DeliveryTypeForm({
  accountOptions,
  deliveryType,
}: {
  accountOptions: AccountSelectOption[];
  deliveryType?: DeliveryType;
}) {
  const initialState: DeliveryTypeState = {
    errors: {},
    message: "",
    values: deliveryType
      ? {
          name: deliveryType.name,
          defaultChargeType: deliveryType.defaultChargeType ?? "",
          defaultBillToCustomer: deliveryType.defaultBillToCustomer ? "true" : "false",
          defaultAccountId: deliveryType.defaultAccountId ?? "",
          requiresManualAmount: deliveryType.requiresManualAmount ? "true" : "false",
          active: deliveryType.active ? "true" : "false",
          notes: deliveryType.notes ?? "",
        }
      : {
          name: "",
          defaultChargeType: "courier",
          defaultBillToCustomer: "true",
          defaultAccountId: "",
          requiresManualAmount: "true",
          active: "true",
          notes: "",
        },
  };
  const action = deliveryType
    ? updateDeliveryTypeAction.bind(null, deliveryType.id)
    : createDeliveryTypeAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert message={state.message} title="Unable to save delivery type" />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Name
          </label>
          <Input id="name" name="name" defaultValue={state.values.name} />
          <FormError errorField={state.errors.name?.errors} errorId="name-error" />
        </div>

        <div>
          <label htmlFor="defaultChargeType" className="mb-2 block text-sm font-medium">
            Default Charge Type
          </label>
          <select
            id="defaultChargeType"
            name="defaultChargeType"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.defaultChargeType}
          >
            <option value="">No default</option>
            {DELIVERY_CHARGE_TYPES.map((chargeType) => (
              <option key={chargeType} value={chargeType}>
                {CHARGE_TYPE_LABELS[chargeType]}
              </option>
            ))}
          </select>
          <FormError
            errorField={state.errors.defaultChargeType?.errors}
            errorId="defaultChargeType-error"
          />
        </div>

        <div>
          <label htmlFor="defaultBillToCustomer" className="mb-2 block text-sm font-medium">
            Bill Customer By Default
          </label>
          <select
            id="defaultBillToCustomer"
            name="defaultBillToCustomer"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.defaultBillToCustomer}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
          <FormError
            errorField={state.errors.defaultBillToCustomer?.errors}
            errorId="defaultBillToCustomer-error"
          />
        </div>

        <div>
          <label htmlFor="defaultAccountId" className="mb-2 block text-sm font-medium">
            Default Account <span className="text-muted-foreground">(optional)</span>
          </label>
          <select
            id="defaultAccountId"
            name="defaultAccountId"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.defaultAccountId}
          >
            <option value="">No account deduction</option>
            {accountOptions.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.type.replaceAll("_", " ")})
              </option>
            ))}
          </select>
          <FormError
            errorField={state.errors.defaultAccountId?.errors}
            errorId="defaultAccountId-error"
          />
        </div>

        <div>
          <label htmlFor="requiresManualAmount" className="mb-2 block text-sm font-medium">
            Requires Manual Amount
          </label>
          <select
            id="requiresManualAmount"
            name="requiresManualAmount"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.requiresManualAmount}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
          <FormError
            errorField={state.errors.requiresManualAmount?.errors}
            errorId="requiresManualAmount-error"
          />
        </div>

        <div>
          <label htmlFor="active" className="mb-2 block text-sm font-medium">
            Active
          </label>
          <select
            id="active"
            name="active"
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            defaultValue={state.values.active}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
          <FormError errorField={state.errors.active?.errors} errorId="active-error" />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="notes" className="mb-2 block text-sm font-medium">
            Notes <span className="text-muted-foreground">(optional)</span>
          </label>
          <Textarea id="notes" name="notes" defaultValue={state.values.notes} />
          <FormError errorField={state.errors.notes?.errors} errorId="notes-error" />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Button asChild variant="outline">
          <Link href="/dashboard/delivery-types">Cancel</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {pending ? "Saving..." : deliveryType ? "Update Delivery Type" : "Create Delivery Type"}
        </Button>
      </div>
    </form>
  );
}
