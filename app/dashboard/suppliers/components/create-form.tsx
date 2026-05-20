"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FormActionAlert from "@/components/alerts/form-action-alert";
import {
  createSupplierAction,
  SupplierState,
} from "@/app/dashboard/suppliers/actions";
import SupplierFormFields from "@/app/dashboard/suppliers/components/supplier-form-fields";

export default function CreateForm() {
  const initialState: SupplierState = {
    errors: {},
    message: "",
    values: {
      name: "",
      supplierCode: "",
      contactInfo: "",
      bankName: "",
      bankAccountName: "",
      bankAccountNumber: "",
      notes: "",
      active: "true",
    },
  };
  const [state, formAction, pending] = useActionState(
    createSupplierAction,
    initialState,
  );

  return (
    <form action={formAction}>
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert
          message={state.message}
          title="Unable to create supplier"
        />
      ) : null}
      <SupplierFormFields state={state} />
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/suppliers"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          Create Supplier
        </Button>
      </div>
    </form>
  );
}
