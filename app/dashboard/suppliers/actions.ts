"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { treeifyError } from "zod";
import { CreateSupplierSchema } from "@/modules/suppliers/supplier.schema";
import {
  createSupplierService,
  deleteSupplierService,
  updateSupplierService,
} from "@/modules/suppliers/supplier.service";

type TreeifiedFieldErrors<T> = {
  [K in keyof T]?: {
    errors: string[];
  };
};

export type SupplierFormValues = {
  name: string;
  supplierCode: string;
  contactInfo: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  notes: string;
  active: string;
};

export type SupplierState = {
  errors: TreeifiedFieldErrors<SupplierFormValues>;
  message: string;
  values: SupplierFormValues;
};

function getSupplierValues(formData: FormData): SupplierFormValues {
  return {
    name: String(formData.get("name") ?? ""),
    supplierCode: String(formData.get("supplierCode") ?? ""),
    contactInfo: String(formData.get("contactInfo") ?? ""),
    bankName: String(formData.get("bankName") ?? ""),
    bankAccountName: String(formData.get("bankAccountName") ?? ""),
    bankAccountNumber: String(formData.get("bankAccountNumber") ?? ""),
    notes: String(formData.get("notes") ?? ""),
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

export async function createSupplierAction(
  prevState: SupplierState,
  formData: FormData,
): Promise<SupplierState> {
  const values = getSupplierValues(formData);
  const validatedFields = CreateSupplierSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await createSupplierService(validatedFields.data);
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to create supplier"),
      values,
    };
  }

  revalidatePath("/dashboard/suppliers");
  redirect("/dashboard/suppliers");
}

export async function updateSupplierAction(
  id: string,
  prevState: SupplierState,
  formData: FormData,
): Promise<SupplierState> {
  const values = getSupplierValues(formData);
  const validatedFields = CreateSupplierSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await updateSupplierService({
      id,
      ...validatedFields.data,
    });
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to update supplier"),
      values,
    };
  }

  revalidatePath("/dashboard/suppliers");
  redirect("/dashboard/suppliers");
}

export async function deleteSupplierAction(id: string) {
  try {
    await deleteSupplierService({ id });
    revalidatePath("/dashboard/suppliers");
    return { success: true, message: "Supplier deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to delete supplier" };
  }
}
