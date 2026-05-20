"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FormActionAlert from "@/components/alerts/form-action-alert";
import {
  ProductCategoryState,
  updateProductCategoryAction,
} from "@/app/dashboard/product-categories/actions";
import ProductCategoryFormFields from "@/app/dashboard/product-categories/components/product-category-form-fields";
import { ProductCategory } from "@/modules/product-categories/product-category.types";

export default function EditForm({
  productCategory,
}: {
  productCategory: ProductCategory;
}) {
  const initialState: ProductCategoryState = {
    errors: {},
    message: "",
    values: {
      name: productCategory.name,
      description: productCategory.description ?? "",
      active: String(productCategory.active),
    },
  };
  const updateWithId = updateProductCategoryAction.bind(null, productCategory.id);

  const [state, formAction, pending] = useActionState(
    updateWithId,
    initialState,
  );

  return (
    <form action={formAction}>
      {state.message && state.message !== "Validation failed" ? (
        <FormActionAlert
          message={state.message}
          title="Unable to update category"
        />
      ) : null}
      <ProductCategoryFormFields state={state} />
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/product-categories"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          Update Category
        </Button>
      </div>
    </form>
  );
}
