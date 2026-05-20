"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { treeifyError } from "zod";
import { CreateProductCategorySchema } from "@/modules/product-categories/product-category.schema";
import {
  createProductCategoryService,
  deleteProductCategoryService,
  updateProductCategoryService,
} from "@/modules/product-categories/product-category.service";

type TreeifiedFieldErrors<T> = {
  [K in keyof T]?: {
    errors: string[];
  };
};

export type ProductCategoryFormValues = {
  name: string;
  description: string;
  active: string;
};

export type ProductCategoryState = {
  errors: TreeifiedFieldErrors<ProductCategoryFormValues>;
  message: string;
  values: ProductCategoryFormValues;
};

function getProductCategoryValues(formData: FormData): ProductCategoryFormValues {
  return {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    active: String(formData.get("active") ?? "true"),
  };
}

function getActionErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export async function createProductCategoryAction(
  prevState: ProductCategoryState,
  formData: FormData,
): Promise<ProductCategoryState> {
  const values = getProductCategoryValues(formData);
  const validatedFields = CreateProductCategorySchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await createProductCategoryService(validatedFields.data);
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to create category"),
      values,
    };
  }

  revalidatePath("/dashboard/product-categories");
  redirect("/dashboard/product-categories");
}

export async function updateProductCategoryAction(
  id: string,
  prevState: ProductCategoryState,
  formData: FormData,
): Promise<ProductCategoryState> {
  const values = getProductCategoryValues(formData);
  const validatedFields = CreateProductCategorySchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await updateProductCategoryService({
      id,
      ...validatedFields.data,
    });
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to update category"),
      values,
    };
  }

  revalidatePath("/dashboard/product-categories");
  redirect("/dashboard/product-categories");
}

export async function deleteProductCategoryAction(id: string) {
  try {
    await deleteProductCategoryService({ id });
    revalidatePath("/dashboard/product-categories");
    return { success: true, message: "Category deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to delete category" };
  }
}
