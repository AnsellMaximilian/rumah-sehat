"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FormActionAlert from "@/components/alerts/form-action-alert";
import {
  createSalesLineAction,
  SalesLineState,
} from "@/app/dashboard/sales-lines/actions";
import { CustomerSelectOption } from "@/modules/customers/customer.types";
import { ProductSelectOption } from "@/modules/products/product.types";
import SalesLineFormFields from "@/app/dashboard/sales-lines/components/sales-line-form-fields";
import { SupplierSelectOption } from "@/modules/suppliers/supplier.types";

export default function CreateForm({
  customers,
  products,
  suppliers,
}: {
  customers: CustomerSelectOption[];
  products: ProductSelectOption[];
  suppliers: SupplierSelectOption[];
}) {
  const initialState: SalesLineState = {
    errors: {},
    message: "",
    values: {
      customerId: "",
      productId: "",
      quantity: "",
      unitSellPrice: "",
      sourceMode: "unknown",
      supplierId: "",
      status: "pending",
      notes: "",
    },
  };
  const [state, formAction, pending] = useActionState(
    createSalesLineAction,
    initialState,
  );

  return (
    <form action={formAction}>
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert message={state.message} title="Unable to create sales line" />
      ) : null}
      <SalesLineFormFields
        customers={customers}
        products={products}
        state={state}
        suppliers={suppliers}
      />
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/sales-lines"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          Create Sales Line
        </Button>
      </div>
    </form>
  );
}
