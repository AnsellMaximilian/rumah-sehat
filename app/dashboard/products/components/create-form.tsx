"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FormActionAlert from "@/components/alerts/form-action-alert";
import {
  createProductAction,
  ProductState,
} from "@/app/dashboard/products/actions";
import { ProductCategorySelectOption } from "@/modules/product-categories/product-category.types";
import ProductFormFields from "@/app/dashboard/products/components/product-form-fields";
import { SupplierSelectOption } from "@/modules/suppliers/supplier.types";

export default function CreateForm({
  categories,
  suppliers,
}: {
  categories: ProductCategorySelectOption[];
  suppliers: SupplierSelectOption[];
}) {
  const initialState: ProductState = {
    errors: {},
    message: "",
    values: {
      name: "",
      productCode: "",
      description: "",
      supplierId: "",
      categoryId: "",
      defaultUnit: "",
      cost: "",
      price: "",
      defaultFulfillmentMode: "unknown",
      trackStock: "false",
      active: "true",
    },
  };
  const [state, formAction, pending] = useActionState(
    createProductAction,
    initialState,
  );

  return (
    <form action={formAction}>
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert message={state.message} title="Unable to create product" />
      ) : null}
      <ProductFormFields
        state={state}
        categories={categories}
        suppliers={suppliers}
      />
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/products"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          Create Product
        </Button>
      </div>
    </form>
  );
}
