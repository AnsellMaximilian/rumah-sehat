"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { treeifyError } from "zod";
import { CreateProductSchema } from "@/modules/products/product.schema";
import {
  createProductService,
  deleteProductService,
  updateProductService,
} from "@/modules/products/product.service";

type TreeifiedFieldErrors<T> = {
  [K in keyof T]?: {
    errors: string[];
  };
};

export type ProductFormValues = {
  name: string;
  productCode: string;
  description: string;
  defaultUnit: string;
  cost: string;
  price: string;
  defaultFulfillmentMode: string;
  trackStock: string;
  active: string;
};

export type ProductState = {
  errors: TreeifiedFieldErrors<ProductFormValues>;
  message: string;
  values: ProductFormValues;
};

function getProductValues(formData: FormData): ProductFormValues {
  return {
    name: String(formData.get("name") ?? ""),
    productCode: String(formData.get("productCode") ?? ""),
    description: String(formData.get("description") ?? ""),
    defaultUnit: String(formData.get("defaultUnit") ?? ""),
    cost: String(formData.get("cost") ?? ""),
    price: String(formData.get("price") ?? ""),
    defaultFulfillmentMode: String(
      formData.get("defaultFulfillmentMode") ?? "unknown",
    ),
    trackStock: String(formData.get("trackStock") ?? "false"),
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

export async function createProductAction(
  prevState: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const values = getProductValues(formData);
  const validatedFields = CreateProductSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await createProductService(validatedFields.data);
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to create product"),
      values,
    };
  }

  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function updateProductAction(
  id: string,
  prevState: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const values = getProductValues(formData);
  const validatedFields = CreateProductSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await updateProductService({
      id,
      ...validatedFields.data,
    });
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to update product"),
      values,
    };
  }

  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function deleteProductAction(id: string) {
  try {
    await deleteProductService({ id });
    revalidatePath("/dashboard/products");
    return { success: true, message: "Product deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to delete product" };
  }
}
