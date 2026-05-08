"use server";

import { revalidatePath } from "next/cache";
import {
  createCustomerService,
  deleteCustomerService,
  updateCustomerService,
} from "@/modules/customers/customer.service";
import { redirect } from "next/navigation";
import { z, treeifyError } from "zod";
import { CreateCustomerSchema } from "@/modules/customers/customer.schema";

type CustomerValues = z.infer<typeof CreateCustomerSchema>;

type TreeifiedFieldErrors<T> = {
  [K in keyof T]?: {
    errors: string[];
  };
};

export type CustomerState = {
  errors: TreeifiedFieldErrors<CustomerValues>;
  message: string;
  values: {
    name: string;
    customerCode: string;
    address: string;
    notes: string;
  };
};

function getCustomerValues(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    customerCode: String(formData.get("customerCode") ?? ""),
    address: String(formData.get("address") ?? ""),
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

export async function createCustomerAction(
  prevState: CustomerState,
  formData: FormData,
): Promise<CustomerState> {
  const values = getCustomerValues(formData);
  const validatedFields = CreateCustomerSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await createCustomerService(validatedFields.data);
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to create customer"),
      values,
    };
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

export async function updateCustomerAction(
  id: string,
  prevState: CustomerState,
  formData: FormData,
): Promise<CustomerState> {
  const values = getCustomerValues(formData);
  const validatedFields = CreateCustomerSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: treeifyError(validatedFields.error).properties || {},
      message: "Validation failed",
      values,
    };
  }

  try {
    await updateCustomerService({
      id,
      ...validatedFields.data,
    });
  } catch (error) {
    console.error(error);
    return {
      errors: {},
      message: getActionErrorMessage(error, "Failed to update customer"),
      values,
    };
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

export async function deleteCustomerAction(id: string) {
  try {
    await deleteCustomerService({ id });
    revalidatePath("/dashboard/customers");
    return { success: true, message: "Customer deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to delete customer" };
  }
}