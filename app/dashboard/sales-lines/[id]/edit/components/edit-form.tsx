"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FormActionAlert from "@/components/alerts/form-action-alert";
import {
  SalesLineState,
  updateSalesLineAction,
} from "@/app/dashboard/sales-lines/actions";
import { CustomerSelectOption } from "@/modules/customers/customer.types";
import { ProductSelectOption } from "@/modules/products/product.types";
import SalesLineFormFields from "@/app/dashboard/sales-lines/components/sales-line-form-fields";
import { SalesLine } from "@/modules/sales-lines/sales-line.types";
import { SupplierSelectOption } from "@/modules/suppliers/supplier.types";

export default function EditForm({
  customers,
  products,
  salesLine,
  suppliers,
}: {
  customers: CustomerSelectOption[];
  products: ProductSelectOption[];
  salesLine: SalesLine;
  suppliers: SupplierSelectOption[];
}) {
  const initialState: SalesLineState = {
    errors: {},
    message: "",
    values: {
      customerId: salesLine.customerId,
      productId: salesLine.productId,
      quantity: String(salesLine.quantity),
      unitSellPrice:
        salesLine.unitSellPrice === null ? "" : String(salesLine.unitSellPrice),
      sourceMode: salesLine.sourceMode,
      supplierId: salesLine.supplierId ?? "",
      status: salesLine.status,
      notes: salesLine.notes ?? "",
    },
  };
  const updateWithId = updateSalesLineAction.bind(null, salesLine.id);

  const [state, formAction, pending] = useActionState(
    updateWithId,
    initialState,
  );

  return (
    <form action={formAction}>
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert message={state.message} title="Unable to update sales line" />
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
          Update Sales Line
        </Button>
      </div>
    </form>
  );
}
