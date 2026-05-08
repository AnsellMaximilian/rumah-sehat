"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  createCustomerAction,
  CustomerState,
} from "@/app/dashboard/customers/actions";
import FormActionAlert from "@/components/alerts/form-action-alert";

import CustomerFormFields from "@/app/dashboard/customers/components/customer-form-fields";

export default function CreateForm() {
  const initialState: CustomerState = {
    errors: {},
    message: "",
    values: {
      name: "",
      customerCode: "",
      address: "",
      notes: "",
    },
  };
  const [state, formAction, pending] = useActionState(
    createCustomerAction,
    initialState,
  );

  return (
    <form action={formAction}>
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert message={state.message} title="Unable to create customer" />
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
          Create Customer
        </Button>
      </div>
    </form>
  );
}