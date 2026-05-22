"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { treeifyError } from "zod";
import { CreateStockMovementSchema } from "@/modules/stock-movements/stock-movement.schema";
import { createStockMovementService } from "@/modules/stock-movements/stock-movement.service";
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
  supplierId: string;
  categoryId: string;
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
    supplierId: String(formData.get("supplierId") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
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


export type StockMovementFormValues = {
  productId: string;
  quantityDelta: string;
  movementType: string;
  occurredAt: string;
  notes: string;
};

export type StockMovementState = {
  errors: TreeifiedFieldErrors<StockMovementFormValues>;
  message: string;
  values: StockMovementFormValues;
};

function getStockMovementValues(
  productId: string,
  formData: FormData,
): StockMovementFormValues {
  return {
    productId,
    quantityDelta: String(formData.get("quantityDelta") ?? ""),
    movementType: String(formData.get("movementType") ?? "manual_adjustment"),
    occurredAt: String(formData.get("occurredAt") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

export async function createStockMovementAction(
  productId: string,
  prevState: StockMovementState,
  formData: FormData,
): Promise<StockMovementState> {
  const values = getStockMovementValues(productId, formData);
  const validatedFields = CreateStockMovementSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await createStockMovementService(validatedFields.data);
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to create stock movement"),
      values,
    };
  }

  revalidatePath(`/dashboard/products/${productId}`);

  return {
    errors: {},
    message: "Stock movement added",
    values: {
      productId,
      quantityDelta: "",
      movementType: values.movementType,
      occurredAt: values.occurredAt,
      notes: "",
    },
  };
}
