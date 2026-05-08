"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Customer } from "@/modules/customers/customer.types";
import {
  CustomerState,
  updateCustomerAction,
} from "@/app/dashboard/customers/actions";
import FormActionAlert from "@/components/alerts/form-action-alert";
import CustomerFormFields from "@/app/dashboard/customers/components/customer-form-fields";

export default function EditForm({ customer }: { customer: Customer }) {
  const initialState: CustomerState = {
    errors: {},
    message: "",
    values: {
      name: customer.name,
      customerCode: customer.customerCode,
      address: customer.address ?? "",
      notes: customer.notes ?? "",
      
    },
  };
  const updateWithId = updateCustomerAction.bind(null, customer.id);

  const [state, formAction, pending] = useActionState(
    updateWithId,
    initialState,
  );

  return (
    <form action={formAction}>
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert message={state.message} title="Unable to update customer" />
      ) : null}
      <CustomerFormFields state={state} />
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/customers"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          Update Customer
        </Button>
      </div>
    </form>
  );
}