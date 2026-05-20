"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FormActionAlert from "@/components/alerts/form-action-alert";
import {
  ProductState,
  updateProductAction,
} from "@/app/dashboard/products/actions";
import ProductFormFields from "@/app/dashboard/products/components/product-form-fields";
import { Product } from "@/modules/products/product.types";

export default function EditForm({ product }: { product: Product }) {
  const initialState: ProductState = {
    errors: {},
    message: "",
    values: {
      name: product.name,
      productCode: product.productCode ?? "",
      description: product.description ?? "",
      defaultUnit: product.defaultUnit ?? "",
      cost: String(product.cost),
      price: String(product.price),
      defaultFulfillmentMode: product.defaultFulfillmentMode,
      trackStock: String(product.trackStock),
      active: String(product.active),
    },
  };
  const updateWithId = updateProductAction.bind(null, product.id);

  const [state, formAction, pending] = useActionState(
    updateWithId,
    initialState,
  );

  return (
    <form action={formAction}>
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert message={state.message} title="Unable to update product" />
      ) : null}
      <ProductFormFields state={state} />
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/products"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          Update Product
        </Button>
      </div>
    </form>
  );
}
