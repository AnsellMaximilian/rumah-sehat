"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FormActionAlert from "@/components/alerts/form-action-alert";
import {
  SupplierState,
  updateSupplierAction,
} from "@/app/dashboard/suppliers/actions";
import SupplierFormFields from "@/app/dashboard/suppliers/components/supplier-form-fields";
import { Supplier } from "@/modules/suppliers/supplier.types";

export default function EditForm({ supplier }: { supplier: Supplier }) {
  const initialState: SupplierState = {
    errors: {},
    message: "",
    values: {
      name: supplier.name,
      supplierCode: supplier.supplierCode ?? "",
      contactInfo: supplier.contactInfo ?? "",
      bankName: supplier.bankName ?? "",
      bankAccountName: supplier.bankAccountName ?? "",
      bankAccountNumber: supplier.bankAccountNumber ?? "",
      notes: supplier.notes ?? "",
      active: String(supplier.active),
    },
  };
  const updateWithId = updateSupplierAction.bind(null, supplier.id);

  const [state, formAction, pending] = useActionState(
    updateWithId,
    initialState,
  );

  return (
    <form action={formAction}>
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert
          message={state.message}
          title="Unable to update supplier"
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
          Update Supplier
        </Button>
      </div>
    </form>
  );
}
