"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FormActionAlert from "@/components/alerts/form-action-alert";
import {
  createProductAction,
  ProductState,
} from "@/app/dashboard/products/actions";
import ProductFormFields from "@/app/dashboard/products/components/product-form-fields";

export default function CreateForm() {
  const initialState: ProductState = {
    errors: {},
    message: "",
    values: {
      name: "",
      productCode: "",
      description: "",
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
      <ProductFormFields state={state} />
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
