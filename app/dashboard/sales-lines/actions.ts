"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { treeifyError } from "zod";
import { CreateSalesLineSchema } from "@/modules/sales-lines/sales-line.schema";
import {
  createSalesLineService,
  deleteSalesLineService,
  updateSalesLineService,
} from "@/modules/sales-lines/sales-line.service";

type TreeifiedFieldErrors<T> = {
  [K in keyof T]?: {
    errors: string[];
  };
};

export type SalesLineFormValues = {
  customerId: string;
  productId: string;
  quantity: string;
  unitSellPrice: string;
  sourceMode: string;
  supplierId: string;
  status: string;
  notes: string;
};

export type SalesLineState = {
  errors: TreeifiedFieldErrors<SalesLineFormValues>;
  message: string;
  values: SalesLineFormValues;
};

function getSalesLineValues(formData: FormData): SalesLineFormValues {
  return {
    customerId: String(formData.get("customerId") ?? ""),
    productId: String(formData.get("productId") ?? ""),
    quantity: String(formData.get("quantity") ?? ""),
    unitSellPrice: String(formData.get("unitSellPrice") ?? ""),
    sourceMode: String(formData.get("sourceMode") ?? "unknown"),
    supplierId: String(formData.get("supplierId") ?? ""),
    status: String(formData.get("status") ?? "pending"),
    notes: String(formData.get("notes") ?? ""),
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

export async function createSalesLineAction(
  prevState: SalesLineState,
  formData: FormData,
): Promise<SalesLineState> {
  const values = getSalesLineValues(formData);
  const validatedFields = CreateSalesLineSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await createSalesLineService(validatedFields.data);
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to create sales line"),
      values,
    };
  }

  revalidatePath("/dashboard/sales-lines");
  redirect("/dashboard/sales-lines");
}

export async function updateSalesLineAction(
  id: string,
  prevState: SalesLineState,
  formData: FormData,
): Promise<SalesLineState> {
  const values = getSalesLineValues(formData);
  const validatedFields = CreateSalesLineSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await updateSalesLineService({
      id,
      ...validatedFields.data,
    });
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to update sales line"),
      values,
    };
  }

  revalidatePath("/dashboard/sales-lines");
  redirect("/dashboard/sales-lines");
}

export async function deleteSalesLineAction(id: string) {
  try {
    await deleteSalesLineService({ id });
    revalidatePath("/dashboard/sales-lines");
    return { success: true, message: "Sales line deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to delete sales line" };
  }
}
